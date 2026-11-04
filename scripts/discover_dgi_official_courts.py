#!/usr/bin/env python3
"""Bounded official 2kas court-case discovery, never direct publication.

Discover exact official case URLs from the court's public case list. Append
only source-observed full-text candidates to the prepublication queue. The
normal official-act importer independently re-verifies every document, privacy,
DGI party, date and PDF before any proposed publication.
"""
import argparse
import datetime
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

from bs4 import BeautifulSoup
from bs4.dammit import UnicodeDammit

ROOT = Path(__file__).resolve().parents[1]
QUEUE = ROOT / "research/dgi-court-publication-queue-2026-10-28.json"
REPORT = ROOT / "test-results/dgi-official-court-discovery.json"
LIST_URL = "https://2kas.sudrf.ru/modules.php?name=sud_delo&srv_num=1"
CASE = re.compile(r"88-\d{1,6}/20\d{2}")
DGI = re.compile(r"департамент[а-я]*\s+городского\s+имущества|\bДГИ\b", re.I)
MAX_HTML = 1_500_000


def case_link(value, origin=LIST_URL):
    from validate_dgi_court_publication_queue import official_url
    url = urllib.parse.urljoin(origin, value)
    return url if official_url(url) and urllib.parse.parse_qs(
        urllib.parse.urlsplit(url).query).get("name_op") == ["case"] else None


def read_official(url):
    request = urllib.request.Request(
        url, headers={"User-Agent": "DGI-Official-Court-Discovery/1.0"})
    with urllib.request.urlopen(request, timeout=25) as response:
        if response.status != 200:
            raise ValueError("Official source not HTTP 200")
        if urllib.parse.urlsplit(response.url).hostname != "2kas.sudrf.ru":
            raise ValueError("Court source redirected to non-official host")
        raw = response.read(MAX_HTML + 1)
    if not 2000 < len(raw) <= MAX_HTML:
        raise ValueError("Court source incomplete or oversized")
    decoded = UnicodeDammit(raw, is_html=True).unicode_markup or ""
    return BeautifulSoup(decoded, "lxml")


def case_links(list_html):
    """Case number is observed in the linked text, never guessed from ID."""
    discovered = {}
    for a in list_html.find_all("a", href=True):
        number = CASE.search(a.get_text(" ", strip=True))
        url = case_link(a["href"])
        if number and url:
            discovered.setdefault(number.group(), url)
    return discovered


def full_text_is_dgi(soup, number):
    doc = soup.find(id="cont_doc1")
    if doc is None:
        return False
    body = doc.get_text(" ", strip=True)
    return (len(body) >= 4000 and number in body[:2200] and DGI.search(body) is not None)


def discover(limit, apply=False):
    q = json.loads(QUEUE.read_text(encoding="utf-8"))
    existing = {r["case_number"] for r in q["items"]}
    used_urls = {r["official_url"] for r in q["items"]}
    found = []
    problems = []
    try:
        entries = case_links(read_official(LIST_URL))
    except (OSError, TimeoutError, ValueError) as error:
        entries = {}
        problems.append({"source": LIST_URL, "reason": type(error).__name__})
    for number, url in list(entries.items())[:min(max(12, limit * 2), 25)]:
        if number in existing or url in used_urls:
            continue
        try:
            soup = read_official(url)
            if not full_text_is_dgi(soup, number):
                continue
            entry = {
                "case_number": number, "official_url": url,
                "origin": "exact_official_court_list_full_text_discovery",
                "status": "ready_for_source_import",
                "reason": "Full court text and DGI observed; date, anonymization, PDF and SHA-256 still require importer checks",
                "release_eligible": False,
                "needs_full_act_and_history_review": False,
                "already_curated": False,
                "needs_official_source_and_privacy_screen": True,
            }
            found.append(entry)
        except (OSError, TimeoutError, ValueError) as error:
            problems.append({"case_number": number, "reason": type(error).__name__})
        if len(found) >= limit:
            break
    if apply and found:
        q["items"].extend(found)
        q["counts"] = {
            "total": len(q["items"]),
            "curated": sum(x["status"] == "already_curated" for x in q["items"]),
            "out_of_scope": sum(x["status"] == "out_of_scope" for x in q["items"]),
            "ready_for_source_import": sum(x["status"] == "ready_for_source_import" for x in q["items"]),
        }
        q["as_of"] = datetime.datetime.now(datetime.timezone.utc).date().isoformat()
        QUEUE.write_text(json.dumps(q, ensure_ascii=False, indent=2) + "\n",
                         encoding="utf-8")
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    result = {
        "checked_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "official_list_url": LIST_URL, "list_cases_seen": len(entries),
        "new_source_candidates": len(found), "candidates": found,
        "source_errors": problems,
        "publication_authorized": False, "verified_for_live": 0,
        "queue_changed": bool(found and apply),
    }
    REPORT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n",
                      encoding="utf-8")
    print("COURT_OFFICIAL_DISCOVERY", json.dumps({
        "list_cases": len(entries), "new_candidates": len(found),
        "errors": len(problems), "publication_authorized": False,
    }))
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=30)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    if not 1 <= args.limit <= 50:
        parser.error("limit must be 1..50")
    discover(args.limit, args.apply)
