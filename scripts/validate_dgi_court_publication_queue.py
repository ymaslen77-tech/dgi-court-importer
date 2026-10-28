#!/usr/bin/env python3
"""Fail-closed research-only DGI court publication queue auditor.

The queue is NOT a publication manifest. No court record is promoted without
independent full-text, operative-outcome, history and privacy review plus PR CI.
A successful audit means the candidate queue is well formed, not approved.
"""
import argparse
import datetime
import hashlib
import json
from pathlib import Path
import re
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[1]
QUEUE = ROOT / "research/dgi-court-publication-queue-2026-10-28.json"
CURATED = ROOT / "apps/web/src/data/verified-court-static.json"
SEED = ROOT / "data/court-catalog.jsonl"
OUT = ROOT / "test-results/dgi-court-research-probe.json"
STATES = {
    "already_curated", "out_of_scope", "excluded_prior_unfavorable_or_mixed",
    "excluded_mixed_result", "excluded_remand_no_final_relief",
    "excluded_dgi_claim_granted", "requires_substantive_outcome_review",
    "requires_full_act_outcome_review",
}
DO_NOT_RELEASE = {
    "88-724/2026", "88-14012/2026", "88-13792/2026", "88-21277/2026"
}
def exact_source(value):
    try:
        p = urlsplit(value)
        return (p.scheme == "https" and p.hostname == "2kas.sudrf.ru"
                and not p.username and not p.password and not p.port
                and p.path == "/modules.php"
                and "name=sud_delo" in p.query
                and len(value) < 1900 and not p.fragment)
    except (TypeError, ValueError):
        return False

def validate():
    q = json.loads(QUEUE.read_text(encoding="utf-8"))
    assert q["schema_version"] == 1
    assert q["publication_source"] == "apps/web/src/data/verified-court-static.json"
    assert q["auto_publish_from_this_file"] is False
    assert q["source_recheck_required"] is True
    assert q["limit_per_daily_release"] == 5
    rows = q["items"]
    assert 15 <= len(rows) <= 200, "Unexpected review queue scope"
    old = json.loads(CURATED.read_text(encoding="utf-8"))
    index = [json.loads(line) for line in SEED.read_text(encoding="utf-8").splitlines() if line.strip()]
    assert len(old) == len({x["case_number"] for x in old})
    old_by_number = {x["case_number"]: x for x in old}
    staged_by_number = {}
    normalized_urls = set()
    for row in rows:
        num = row["case_number"]
        assert re.fullmatch(r"88-\d{1,6}/20\d{2}", num), num
        assert num not in staged_by_number, "Duplicate court case number"
        staged_by_number[num] = row
        url = row["official_url"]
        assert exact_source(url), "Invalid/non-official court source"
        parsed = urlsplit(url)
        key = (parsed.hostname, parsed.path, sorted(parsed.query.split("&")))
        key = repr(key)
        assert key not in normalized_urls, "Duplicate case URL"
        normalized_urls.add(key)
        assert row["status"] in STATES, "Invalid review state"
        assert row["release_eligible"] is False, "Queue is not a release approval"
        assert isinstance(row["reason"], str) and len(row["reason"]) >= 25
        assert row["origin"] in {"existing_curated", "seed_candidate_metadata_only", "new_official_source_discovery"}
        if row["status"] == "already_curated":
            assert row["origin"] == "existing_curated"
            assert row["already_curated"] is True and not row["needs_full_act_and_history_review"]
            assert num in old_by_number and old_by_number[num]["official_url"] == url
        else:
            assert num not in old_by_number
            assert row["already_curated"] is False
            assert row["needs_full_act_and_history_review"] is True
        if num in DO_NOT_RELEASE:
            assert row["status"].startswith("excluded_")
    assert set(old_by_number).issubset(staged_by_number)
    for record in index:
        assert record["number"] in staged_by_number, "Seed research record not reconciled"
        row = staged_by_number[record["number"]]
        if not record["dgi_party"]:
            assert row["status"] == "out_of_scope", "False-positive DGI metadata"
    assert q["current_curated_count"] == len(old)
    assert q["counts"]["total"] == len(rows)
    assert q["counts"]["curated"] == len(old)
    assert q["counts"]["needs_individual_review"] == sum(x["status"].startswith("requires") for x in rows)
    assert q["counts"]["excluded"] == sum(x["status"].startswith("excluded") or x["status"]=="out_of_scope" for x in rows)
    print("QUEUE_SAFE", len(rows), "curated", len(old), "eligible_to_publish", 0)
    return rows

def research_probe(rows, maximum):
    """Best-effort source retrieval; summary-only artifact, never a publication gate."""
    from bs4 import BeautifulSoup
    from bs4.dammit import UnicodeDammit
    data = []
    pending = [r for r in rows if r["status"].startswith("requires")]
    for row in pending[:maximum]:
        item = {
            "number": row["case_number"], "official_url": row["official_url"],
            "stage": "research_only_not_publishable", "full_text_retrieved": False,
            "outcome_verified": False, "history_checked": False,
            "privacy_approved": False, "cms_db_approved": False, "release_eligible": False,
        }
        try:
            url = row["official_url"]
            with urlopen(Request(url, headers={"User-Agent":"DGI-Official-Research/1.0"}), timeout=18) as conn:
                if conn.status != 200 or urlsplit(conn.url).hostname != "2kas.sudrf.ru":
                    raise ValueError("Unapproved source redirect/status")
                raw = conn.read(1_400_001)
            if not 4000 < len(raw) < 1_400_001:
                raise ValueError("Empty/truncated/oversize official page")
            decoded = UnicodeDammit(raw,is_html=True).unicode_markup
            soup = BeautifulSoup(decoded or "", "lxml")
            node = soup.find(id="cont_doc1")
            if node is None:
                raise ValueError("Full judicial act node is missing")
            body = node.get_text("\n",strip=True)
            if len(body) < 4000 or row["case_number"] not in body[:1000]:
                raise ValueError("Full text or case number missing")
            item["full_text_retrieved"] = True
            item["full_text_sha256"] = hashlib.sha256(body.encode("utf-8")).hexdigest()
            item["full_text_characters"] = len(body)
            item["mentions_dgi"] = "департамент" in body.lower()
            item["citizen_claim_pattern_found"] = bool(re.search(
                r"(?:по иску|с иском)\s+(?:ФИО\d+|[А-ЯЁ][а-яё]+(?:\s+[А-ЯЁ][а-яё]+){1,2})\s+к\s+Департаменту",
                body,re.I))
            item["operative_clause_present"] = bool(re.search(
                r"определил[аи]\s*:", re.sub(r"\s+"," ",body[-2500:]),re.I))
            item["anonymization_markers"] = len(re.findall(r"\bФИО\d+\b",body))
            item["stage"] = "full_text_downloaded_requires_independent_legal_history_privacy_review"
        except (HTTPError,URLError,TimeoutError,OSError,ValueError,AssertionError) as e:
            item["stage"] = "source_unavailable_or_unqualified"
            item["blocker_kind"] = type(e).__name__
        data.append(item)
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps({
        "as_of":datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "source_only":True,"publication_count":0,
        "disclaimer":"Full text retrieval or lexical patterns NEVER equal legal/privacy/reversal approval.",
        "results":data},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("RESEARCH_ONLY", len(data), "fresh_full_text", sum(x["full_text_retrieved"] for x in data),
          "new_publications",0)

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--probe",action="store_true")
    p.add_argument("--max",type=int,default=6)
    a = p.parse_args()
    rows = validate()
    if a.probe:
        if not 1 <= a.max <= 6:
            raise SystemExit("Probe at most 6 non-published candidates")
        research_probe(rows,a.max)
