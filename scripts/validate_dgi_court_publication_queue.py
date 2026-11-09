#!/usr/bin/env python3
"""Check DGI all-outcome source queue; this alone never publishes a case."""
import argparse, datetime, hashlib, json, re
from pathlib import Path
from urllib.parse import urlsplit, parse_qs
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

ROOT=Path(__file__).resolve().parents[1]
QUEUE=ROOT/"research/dgi-court-publication-queue-2026-10-28.json"
CURATED=ROOT/"apps/web/src/data/verified-court-static.json"
SEED=ROOT/"data/court-catalog.jsonl"
OUT=ROOT/"test-results/dgi-court-research-probe.json"
STATES={"already_curated","out_of_scope","ready_for_source_import"}
def official_url(value):
    try:
        p=urlsplit(value)
        if (p.scheme!="https" or p.hostname!="2kas.sudrf.ru" or
                p.path!="/modules.php" or p.username or p.password or p.port or
                p.fragment or len(value)>=1900):
            return False
        q=parse_qs(p.query, strict_parsing=True)
        return (q.get("name")==["sud_delo"] and
                q.get("name_op") in (["case"],["doc"]) and
                q.get("delo_id")==["2800001"] and
                q.get("srv_num")==["1"] and
                (q.get("case_id",[""])[0].isdigit() if q["name_op"]==["case"]
                 else q.get("number",[""])[0].isdigit()))
    except (TypeError, ValueError):
        return False
def validate():
    data=json.loads(QUEUE.read_text(encoding="utf-8"))
    assert data["schema_version"]==2 and data["auto_publish_from_this_file"] is False
    policy=json.loads((ROOT/"config/dgi-daily-publication.json").read_text(encoding="utf-8"))
    target=policy["publication_limits"]["new_verified_court_acts_per_run"]
    assert type(target) is int and target==10
    assert data["limit_per_daily_release"]==target
    rows=data["items"]
    old=json.loads(CURATED.read_text(encoding="utf-8"))
    seed=[json.loads(s) for s in SEED.read_text(encoding="utf-8").splitlines() if s.strip()]
    seen=set(); urls=set(); published={x["case_number"]:x for x in old}
    assert len(published)==len(old)
    for row in rows:
        n=row["case_number"];url=row["official_url"]
        assert re.fullmatch(r"88-\d{1,6}/20\d\d",n) and n not in seen
        assert official_url(url) and url not in urls
        assert row["status"] in STATES and row["release_eligible"] is False
        seen.add(n);urls.add(url)
        if row["status"]=="already_curated":
            assert n in published and published[n]["official_url"]==url
        else:
            assert n not in published
    assert {x["number"] for x in seed}.issubset(seen)
    assert data["counts"]["total"]==len(rows)
    assert data["counts"]["curated"]==len(old)
    assert data["counts"]["ready_for_source_import"]==sum(x["status"]=="ready_for_source_import" for x in rows)
    assert data["counts"]["out_of_scope"]==sum(x["status"]=="out_of_scope" for x in rows)
    print("DGI_ALL_OUTCOMES_QUEUE_VALID",len(rows),"curated",len(old),
          "source_pending",data["counts"]["ready_for_source_import"])
    return rows
def probe(rows,maximum):
    from bs4 import BeautifulSoup
    from bs4.dammit import UnicodeDammit
    results=[]
    for row in (x for x in rows if x["status"]=="ready_for_source_import"):
        if len(results)>=maximum:break
        result={"number":row["case_number"],"official_url":row["official_url"],
                "official_full_text_available":False,"eligible_for_publication":False}
        try:
            with urlopen(Request(row["official_url"],headers={"User-Agent":"DGI-Court-Source-Research/2.0"}),timeout=22) as response:
                if response.status!=200 or urlsplit(response.url).hostname!="2kas.sudrf.ru":
                    raise ValueError("Bad official HTTP source")
                raw=response.read(1_500_001)
            text=BeautifulSoup(UnicodeDammit(raw,is_html=True).unicode_markup or "","lxml").find(id="cont_doc1")
            if text is None:raise ValueError("Full act section absent")
            body=text.get_text("\n",strip=True)
            if len(body)<4000 or row["case_number"] not in body[:1200]:
                raise ValueError("Full court text absent or mismatched")
            result.update(official_full_text_available=True,
                          full_text_sha256=hashlib.sha256(body.encode("utf-8")).hexdigest(),
                          text_characters=len(body),
                          dgi_mentioned="департамент городского имущества" in body.lower(),
                          outcome_classification="not_classified_pending_source_import")
        except (HTTPError,URLError,TimeoutError,ValueError,OSError) as error:
            result["reason"]=type(error).__name__
        results.append(result)
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps({"checked_at":datetime.datetime.now(datetime.timezone.utc).isoformat(),
       "research_only":True,"new_publications":0,"results":results},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("SOURCE_PROBE_COMPLETE",len(results),"available",sum(x["official_full_text_available"] for x in results))
if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--probe",action="store_true")
    p.add_argument("--max",type=int,default=6)
    a=p.parse_args();rows=validate()
    if a.probe:
        assert 1<=a.max<=20
        probe(rows,a.max)
