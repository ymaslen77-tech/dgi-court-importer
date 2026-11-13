#!/usr/bin/env python3
"""Atomic Art. 69 ЖК РФ three-publisher consensus, including actual official PDF."""
import argparse
import datetime as dt
import hashlib
import json
import re
from pathlib import Path
from validate_official_legal_changes import (
    allowed_source, official_authority_group, official_excerpt_visible, norm
)

INPUT="research/dgi-social-tenancy-equality-consensus.json"
OUTPUT="test-results/dgi-social-tenancy-consensus.json"
ATOM="члены семьи нанимателя жилого помещения по договору социального найма имеют равные с нанимателем права и обязанности"

def verify(bundle,fetcher=official_excerpt_visible,now=None):
    now=now or dt.datetime.now(dt.timezone.utc)
    expected={"version","id","procedure","statute","jurisdiction","fact",
              "publication_status","scope","exclusions","sources"}
    if not isinstance(bundle,dict) or set(bundle)!=expected or bundle["version"]!=1:
        raise ValueError("Social tenancy claim schema mismatch")
    if (bundle["id"]!="social-tenancy-equal-rights-family"
        or bundle["procedure"]!="social-tenancy"
        or bundle["jurisdiction"]!="Российская Федерация"
        or bundle["publication_status"]!="research_only"
        or "69" not in bundle["statute"]):
        raise ValueError("Unreviewed legal procedure or approval")
    if ATOM not in norm(bundle["fact"]):
        raise ValueError("Unsupported legal proposition")
    if (not isinstance(bundle["scope"],str) or len(bundle["scope"])<80
        or not isinstance(bundle["exclusions"],list)
        or len(bundle["exclusions"])<3):
        raise ValueError("Article 69 family status qualifications missing")
    sources=bundle["sources"]
    if not isinstance(sources,list) or len(sources)!=3:
        raise ValueError("Three official publishers required")
    publishers=set();items=[]
    for row in sources:
        if not isinstance(row,dict) or set(row)!={"official_source_url","official_source_excerpt"}:
            raise ValueError("Unexpected source shape")
        url=row["official_source_url"];quote=row["official_source_excerpt"]
        if not isinstance(url,str) or not allowed_source(url):
            raise ValueError("Not an accepted official URL")
        group=official_authority_group(url)
        if not group or group in publishers:
            raise ValueError("Duplicate or unsupported publisher")
        publishers.add(group)
        if not isinstance(quote,str) or len(quote)<60 or ATOM not in norm(quote):
            raise ValueError("Official quote does not support the same atomic equality")
        valid,reason=fetcher(url,quote)
        if not valid:
            raise ValueError("Official text not observed: "+group+": "+reason)
        items.append({"publisher":group,"url":url,
                      "excerpt_sha256":hashlib.sha256(quote.encode()).hexdigest(),
                      "observed":True})
    return {"status":"official_three_source_equality_provenance_passed",
            "claim_id":bundle["id"],"checked_at":now.isoformat(),
            "sources":items,"publication_status":"research_only",
            "scope":bundle["scope"],"exclusions":bundle["exclusions"],
            "caveat":"Equal rights attach to legally established family-member status; do not infer status, entitlement or outcome from registration."}

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--input",default=INPUT)
    parser.add_argument("--output",default=OUTPUT)
    args=parser.parse_args()
    result=verify(json.loads(Path(args.input).read_text(encoding="utf-8")))
    dest=Path(args.output);dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("DGI_SOCIAL_TENANCY_CONSENSUS",result["status"],len(result["sources"]))
