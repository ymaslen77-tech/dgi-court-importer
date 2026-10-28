#!/usr/bin/env python3
"""Read-only evidence probe for DGI candidate 88-3117/2026.

Does not change the published static index, CMS, PostgreSQL, PDF files or
approval fields. A positive automated result is NOT independent legal,
privacy, rights-to-republish or later-appeal approval.
"""
import hashlib
import json
from pathlib import Path
import re
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

from bs4 import BeautifulSoup
from bs4.dammit import UnicodeDammit

DRAFT = Path("research/dgi-court-drafts/88-3117-2026.json")
REPORT = Path("test-results/88-3117-source-probe.json")
AGENT = "DGI-ReadOnly-Official-Act-Research/1.0"


def compact(text):
    return re.sub(r"\s+", " ", text).strip()


def check(text, pattern, reason, flags=re.I):
    if not re.search(pattern, text, flags):
        raise ValueError(reason)


def get_official_act(url):
    parsed = urlsplit(url)
    if parsed.scheme != "https" or parsed.hostname != "2kas.sudrf.ru":
        raise ValueError("not an allowed direct court URL")
    for attempt in range(3):
        try:
            with urlopen(Request(url, headers={"User-Agent": AGENT}), timeout=55) as r:
                if r.status != 200 or urlsplit(r.url).hostname != "2kas.sudrf.ru":
                    raise ValueError("official source HTTP status or redirect invalid")
                raw = r.read(1_500_001)
            if not (15_000 < len(raw) <= 1_500_000):
                raise ValueError("official source HTML missing, truncated or oversized")
            decoded = UnicodeDammit(raw, is_html=True).unicode_markup
            if not decoded:
                raise ValueError("official HTML decoding failed")
            soup = BeautifulSoup(decoded, "lxml")
            act = soup.find(id="cont_doc1")
            if act is None:
                raise ValueError("complete official court act #cont_doc1 absent")
            body = act.get_text("\n", strip=True).replace("\r", "").strip()
            if not 7_500 < len(body) < 140_000:
                raise ValueError("official judicial text is incomplete or oversized")
            return raw, body
        except (HTTPError, URLError, TimeoutError, OSError) as exc:
            if attempt == 2:
                raise RuntimeError("official source unavailable: " + type(exc).__name__) from exc
            time.sleep(3 * (attempt + 1))


def inspect(body, record):
    norm = compact(body)
    header = norm[:1400]
    end = norm[-2200:]
    # These checks are strictly documentary and do not assert legal finality.
    check(header, r"88\s*[-–]\s*3117\s*/\s*2026", "case number not in official act heading")
    check(header, r"19\s*[»\"]?\s*февраля\s+2026\s+года", "date mismatch")
    check(header, r"О\s*П\s*Р\s*Е\s*Д\s*Е\s*Л\s*Е\s*Н\s*И\s*Е|ОПРЕДЕЛЕНИЕ",
          "act heading missing")
    uid = re.sub(r"\s*-\s*", "-", record["uid"])
    if uid not in re.sub(r"\s*-\s*", "-", header):
        raise ValueError("official UID mismatch")
    check(norm, r"по иску\s+ФИО1\s+к\s+Департаменту городского имущества города Москвы",
          "citizen is not the claimant against DGI")
    check(norm, r"Решением\s+Симоновского\s+районного\s+суда.{0,150}24\s+августа\s+2023\s+года",
          "first instance not identified")
    check(norm, r"26\s+июня\s+2025\s+года", "appeal date absent")
    check(norm, r"признан\s+незаключенным\s+в\s+отношении\s+ФИО1",
          "material relief for citizen not observed")
    check(norm, r"Разрешая\s+спор\s+и\s+удовлетворяя\s+исковые\s+требования",
          "judicial reasoning does not affirm claimant relief")
    check(end, r"оставить\s+без\s+изменения", "cassation operative part missing")
    check(end, r"кассационн\w*\s+жалоб\w*\s+Департамент\w*"
               r".{0,110}без\s+удовлетворения", "DGI cassation outcome missing")
    check(norm[-600:], r"Председательствующ\w*\s+Судьи\s*$",
          "court act signature footer missing")
    if len(re.findall(r"\bФИО\d+\b", body)) < 8:
        raise ValueError("court anonymization markers missing")
    if "<адрес>" not in body.lower() and "<данные изъяты>" not in body.lower():
        raise ValueError("court redaction markers missing")
    if re.search(r"(?:\+7|8)\s*[\(\- ]?\d{3}[\)\- ]?\s*\d{3}[\- ]?\d{2}[\- ]?\d{2}", body):
        raise ValueError("potential unmasked personal phone")
    if re.search(r"[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}", body):
        raise ValueError("potential personal email in court text")
    # No raw text or personal names are persisted in the probe report.
    return {
        "full_text_characters": len(body),
        "anonymization_marker_count": len(re.findall(r"\bФИО\d+\b", body)),
        "source_text_sha256": hashlib.sha256(body.encode("utf8")).hexdigest(),
        "documentary_case_number_date_uid_and_claimant_relief_checks": "passed",
        "cassation_disposition_check": "passed",
        "automatic_privacy_pattern_screen": "passed_not_independent_approval",
    }


def main():
    record = json.loads(DRAFT.read_text(encoding="utf8"))
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    report = {
        "case_number": record["case_number"],
        "official_source_url": record["official_source_url"],
        "status": "blocked",
        "publishable": False,
        "independent_reviewer_confirmed": False,
        "rights_to_republish_confirmed": False,
        "later_reversal_independently_checked": False,
        "cms_db_approval_confirmed": False,
        "pdf_generated": False,
        "site_published": False,
    }
    try:
        raw, body = get_official_act(record["official_source_url"])
        report["official_html_sha256"] = hashlib.sha256(raw).hexdigest()
        report.update(inspect(body, record))
        report["status"] = "documentary_checks_passed_but_publication_blocked"
        print("DOCUMENTARY_SOURCE_PROBE_OK", record["case_number"],
              "text_chars", report["full_text_characters"],
              "text_sha256", report["source_text_sha256"])
        returncode = 0
    except Exception as exc:
        report["blocker"] = str(exc)[:350]
        print("DOCUMENTARY_SOURCE_PROBE_BLOCKED", record["case_number"],
              type(exc).__name__, file=sys.stderr)
        returncode = 1
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    return returncode


if __name__ == "__main__":
    sys.exit(main())
