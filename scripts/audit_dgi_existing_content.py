#!/usr/bin/env python3
"""Read-only inventory of published-content evidence and court file integrity.

This creates a review queue, not legal approval. Hashes prove only identity of
the reviewed file, not validity of the interpretation or fidelity to the court.
Never print full court texts or private party names.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
from concurrent.futures import ThreadPoolExecutor

HEX = re.compile(r"[0-9a-f]{64}")
SLUG = re.compile(r"[a-z0-9][a-z0-9-]{2,159}")
MAX_PDF = 15 * 1024 * 1024

def digest(data):
    return hashlib.sha256(data).hexdigest()

def text_fields(value, prefix=""):
    if isinstance(value, dict):
        for key, v in value.items():
            yield from text_fields(v, f"{prefix}.{key}" if prefix else key)
    elif isinstance(value, list):
        for index, v in enumerate(value):
            yield from text_fields(v, f"{prefix}.{index}")
    elif isinstance(value, str) and value.strip():
        yield {"field":prefix, "sha256":digest(value.encode("utf-8")),
               "status":"requires_substantive_source_review"}

def valid_official_url(url):
    try:
        p = urlsplit(url)
        return p.scheme == "https" and not p.username and not p.password and p.port in (None,443) and any(
            p.hostname == host or p.hostname.endswith("." + host)
            for host in ("sudrf.ru","mos-gorsud.ru","vsrf.ru"))
    except (ValueError,TypeError,AttributeError):
        return False

def pdf_check(data, expected):
    return (300 <= len(data) <= MAX_PDF and data.startswith(b"%PDF-")
            and isinstance(expected,str) and HEX.fullmatch(expected) is not None
            and digest(data) == expected)

def court_record(root, row):
    slug = row.get("slug","")
    problems = []
    if not isinstance(slug,str) or not SLUG.fullmatch(slug):
        return {"slug":"invalid","problems":["invalid_slug"],"privacy_review":"unknown"}
    if row.get("privacy_checked") is True:
        privacy = "recorded_legacy_review_flag"
    elif row.get("privacy_screen_passed") is True:
        privacy = "recorded_automated_screen_flag"
    else:
        privacy = "no_recorded_screen"
        problems.append("missing_privacy_flag")
    full_text = row.get("full_text")
    expected = row.get("full_text_sha256")
    text_ok = (isinstance(full_text,str) and len(full_text) >= 4000
               and isinstance(expected,str) and HEX.fullmatch(expected) is not None
               and digest(full_text.encode("utf-8")) == expected)
    if not text_ok: problems.append("full_text_digest_mismatch")
    if row.get("source_checked") is not True: problems.append("missing_source_flag")
    if not valid_official_url(row.get("official_url")): problems.append("invalid_official_source_url")
    path = root / "apps/web/public/court-pdf-copies" / (slug+".pdf")
    try:
        local_ok = path.stat().st_size <= MAX_PDF and pdf_check(path.read_bytes(),row.get("pdf_sha256"))
        if not local_ok: problems.append("local_pdf_digest_or_format_mismatch")
    except OSError:
        local_ok = False
        problems.append("local_pdf_unavailable")
    return {"slug":slug, "case_number":row.get("case_number"), "source_url":row.get("official_url"),
            "source_review_flag":row.get("source_checked") is True,
            "privacy_review":privacy,"full_text_digest_ok":text_ok,"local_pdf_digest_ok":local_ok,
            "pdf_origin":row.get("pdf_origin"),"pdf_sha256":row.get("pdf_sha256"),
            "substantive_source_review":"not_certified_by_this_audit",
            "problems":problems}

def live_pdf(row):
    slug = row["slug"]
    if not SLUG.fullmatch(slug): return "invalid_slug"
    try:
        url = "https://dgi-pravo.ru/api/courts/verified/"+slug+"/pdf"
        req = Request(url,headers={"User-Agent":"DGI-PDF-integrity-read-only-audit/1.0"})
        with urlopen(req,timeout=25) as resp:
            target = urlsplit(resp.url)
            if resp.status != 200 or target.scheme != "https" or target.hostname != "dgi-pravo.ru":
                return "unexpected_response"
            data = resp.read(MAX_PDF+1)
        return "matches_manifest" if pdf_check(data,row.get("pdf_sha256")) else "digest_or_format_mismatch"
    except Exception:
        return "unavailable"

def audit(root, verify_live=False):
    data = root/"apps/web/src/data"
    pages=[]
    for p in sorted(data.glob("pages-*.json")):
        for row in json.loads(p.read_text(encoding="utf-8")):
            pages.append({"slug":row["slug"],"file":p.name,"fields":list(text_fields(row)),
                          "source_links":[b["href"] for b in row["blocks"]
                              if b.get("kind")=="link" and b.get("href","").startswith("https://")],
                          "live_cms_override_not_excluded":True})
    news=[]
    for row in json.loads((data/"housing-news.json").read_text(encoding="utf-8")):
        news.append({"slug":row["slug"],"source_url":row.get("sourceUrl"),
                     "fields":list(text_fields(row))})
    cases=[court_record(root,row) for row in json.loads((data/"verified-court-static.json").read_text(encoding="utf-8"))]
    for key in ("slug","case_number","source_url"):
        values=[x.get(key) for x in cases]
        for x in cases:
            if x.get(key) is None or values.count(x.get(key))>1:
                x["problems"].append("duplicate_or_missing_"+key)
    if verify_live:
        with ThreadPoolExecutor(max_workers=4) as pool:
            for row,status in zip(cases,pool.map(live_pdf,cases)):
                row["live_pdf_status"]=status
    return {"mode":"read_only_not_legal_certification","pages":pages,"news":news,"courts":cases,
            "summary":{"pages":len(pages),"news":len(news),"courts":len(cases),
                       "page_fields_to_review":sum(len(x["fields"]) for x in pages),
                       "news_fields_to_review":sum(len(x["fields"]) for x in news),
                       "court_local_integrity_passed":sum(not x["problems"] for x in cases),
                       "court_manual_review_flags":sum(x["privacy_review"]=="recorded_legacy_review_flag" for x in cases),
                       "court_automated_screen_flags":sum(x["privacy_review"]=="recorded_automated_screen_flag" for x in cases),
                       "court_live_pdf_matches":sum(x.get("live_pdf_status")=="matches_manifest" for x in cases),
                       "court_live_pdf_not_checked":sum("live_pdf_status" not in x for x in cases),
                       "court_substantive_reverification_complete":False}}

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--root",type=Path,default=Path(__file__).resolve().parents[1])
    p.add_argument("--output",type=Path,default=Path("test-results/dgi-existing-content-integrity.json"))
    p.add_argument("--live",action="store_true")
    args=p.parse_args()
    report=audit(args.root,args.live)
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("EXISTING_CONTENT_AUDIT",json.dumps(report["summary"],ensure_ascii=False))
    print("COURT_INTEGRITY_FINDINGS",json.dumps([{"slug":x["slug"],"problems":x["problems"],"live_pdf_status":x.get("live_pdf_status")} for x in report["courts"] if x["problems"] or x.get("live_pdf_status","matches_manifest")!="matches_manifest"],ensure_ascii=False))

if __name__=="__main__":
    main()
