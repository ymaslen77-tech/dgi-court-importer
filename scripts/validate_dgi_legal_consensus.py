#!/usr/bin/env python3
"""Deterministic narrow-claim consensus: 59-FZ general correspondence.

Never decides a specific citizen's procedure. Independently obtains each
official excerpt live and confirms they support the same atomic fact:
30 calendar days FROM REGISTRATION. Does not infer a public-service deadline.
"""
import argparse
import datetime as dt
import hashlib
import json
import re
from pathlib import Path
from validate_official_legal_changes import (
    allowed_source, official_authority_group, official_excerpt_visible,
)

DEFAULT_INPUT="research/dgi-59fz-30day-consensus.json"
DEFAULT_OUTPUT="test-results/dgi-59fz-source-consensus.json"
REGISTRATION_RE=re.compile(r"со дня (?:его )?регистрации|со дня регистрации письменного обращения", re.I)
DAYS_RE=re.compile(r"в течение 30 дней|составляет 30 дней", re.I)
WRITTEN_RE=re.compile(r"обращени", re.I)

def verify(bundle,fetcher=official_excerpt_visible,now=None):
    now=now or dt.datetime.now(dt.timezone.utc)
    if not isinstance(bundle,dict) or bundle.get("version")!=1:
        raise ValueError("Unsupported source-consensus bundle")
    claims=bundle.get("claims")
    if not isinstance(claims,list) or len(claims)!=1:
        raise ValueError("Only the one narrow 59-FZ rule is supported")
    row=claims[0]
    keys={"id","procedure","act","numeric_days","starts_from",
          "jurisdiction","publication_status","scope","exclusions","sources"}
    if not isinstance(row,dict) or set(row)!=keys:
        raise ValueError("Claim structure not fully accounted for")
    if (row["id"]!="59-fz-general-written-appeal-30-days"
        or row["procedure"]!="59-fz-general-correspondence"
        or row["numeric_days"]!=30 or row["starts_from"]!="registration"
        or row["jurisdiction"]!="Российская Федерация"
        or row["publication_status"]!="research_only"
        or "59-ФЗ" not in row["act"]):
        raise ValueError("General correspondence fact cannot expand its scope")
    if not isinstance(row["scope"],str) or len(row["scope"])<60:
        raise ValueError("Detailed legal applicability missing")
    if not isinstance(row["exclusions"],list) or len(row["exclusions"])<4:
        raise ValueError("Unverified specialized procedures are not excluded")
    needed=("госуслуг","судеб","специальн")
    if any(not any(fragment in str(term).casefold() for term in row["exclusions"])
           for fragment in needed):
        raise ValueError("Special procedure/scope exclusions missing")
    sources=row["sources"]
    if not isinstance(sources,list) or len(sources)!=3:
        raise ValueError("Require exactly three independent official sources")
    publishers=set()
    confirmations=[]
    for source in sources:
        if not isinstance(source,dict) or not (
            {"official_source_url","official_source_excerpt"} <= set(source)
            and set(source) <= {"official_source_url","official_source_excerpt","alternates"}
        ):
            raise ValueError("Invalid source row")
        options=[{
            "official_source_url":source["official_source_url"],
            "official_source_excerpt":source["official_source_excerpt"],
        }]+source.get("alternates",[])
        if (not isinstance(options,list) or not 1<=len(options)<=3 or
            any(not isinstance(o,dict) or
                set(o)!={"official_source_url","official_source_excerpt"} for o in options)):
            raise ValueError("Invalid alternate official source record")
        primary=official_authority_group(source["official_source_url"])
        if not primary or primary in publishers:
            raise ValueError("Source publisher duplicated or unverifiable")
        publishers.add(primary)
        seen_urls=set();accepted=None
        for option in options:
            url=option["official_source_url"];excerpt=option["official_source_excerpt"]
            if (not isinstance(url,str) or not allowed_source(url) or
                official_authority_group(url)!=primary or url in seen_urls):
                raise ValueError("Alternate source must be a unique page from same official publisher")
            seen_urls.add(url)
            if not isinstance(excerpt,str) or len(excerpt.strip())<60:
                raise ValueError("No long exact official excerpt")
            if not (REGISTRATION_RE.search(excerpt) and DAYS_RE.search(excerpt)
                    and WRITTEN_RE.search(excerpt)):
                raise ValueError("Source does not independently assert 30 days from registration")
            ok,reason=fetcher(url,excerpt)
            if ok:
                accepted={
                    "publisher":primary,"source_url":url,
                    "excerpt_sha256":hashlib.sha256(excerpt.encode("utf-8")).hexdigest(),
                    "retrieved_and_observed":True,
                    "used_alternate":url!=source["official_source_url"],
                }
                break
        if not accepted:
            raise ValueError("Cannot observe official excerpt for "+primary)
        confirmations.append(accepted)
    return {
        "status":"independent_official_sources_confirm_narrow_fact",
        "checked_at":now.isoformat(),
        "claim_id":row["id"],
        "procedure":row["procedure"],
        "numeric_days":30,
        "starts_from":"registration",
        "scope":row["scope"],
        "exclusions":row["exclusions"],
        "independent_publishers":len(publishers),
        "sources":confirmations,
        "publication_status":"research_only",
        "caveat":"Atomic 30-day fact verified; not approval of other claims, procedural routes or user-specific deadlines.",
    }

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--input",default=DEFAULT_INPUT)
    parser.add_argument("--output",default=DEFAULT_OUTPUT)
    args=parser.parse_args()
    payload=json.loads(Path(args.input).read_text(encoding="utf-8"))
    result=verify(payload)
    target=Path(args.output);target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("DGI_59FZ_SOURCE_CONSENSUS",result["status"],result["independent_publishers"])

if __name__=="__main__":
    main()
