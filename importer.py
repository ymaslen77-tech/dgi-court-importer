#!/usr/bin/env python3
"""Conservative DGI court-candidate loader. NEVER automatically publishes rulings."""
import argparse
import hashlib
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

CMS_COLLECTION = "6aca8b43f741d6755539f345"
API = "https://api.webflow.com/v2"
DGI = re.compile(r"департамент\w*\s+городск\w*\s+имуществ\w*\s+(?:(?:города|г\.)\s*)?москв\w*|\bдги\s+(?:г\.?\s*)?москв\w*", re.I)
KEYS = {
    "case": ("Номер дела", "Номер судебного дела", "caseNumber", "number"),
    "court": ("Наименование суда", "Суд", "court", "courtName"),
    "uid": ("УИД", "Уникальный идентификатор дела", "uid", "caseUid"),
    "parties": ("Стороны", "Участники", "participants", "parties"),
    "acts": ("Судебные акты", "Акты", "acts", "courtActs"),
    "topic": ("Категория дела", "category", "Категория судебного дела", "Категория судебного дела, материала, жалобы или производства"),
}
def pick(obj, kind):
    return next((obj[k] for k in KEYS[kind] if k in obj and obj[k] not in (None, "", [])), None)

def official(url):
    try:
        u = urllib.parse.urlparse(url)
        host = (u.hostname or "").lower()
        return u.scheme == "https" and any(host == h or host.endswith("." + h) for h in ("mos-gorsud.ru", "sudrf.ru"))
    except ValueError:
        return False

def dataset_url(url):
    """Accept only a concrete court dataset, not the portal's JSON registry index."""
    if not official(url):
        return False
    path = urllib.parse.urlparse(url).path.rstrip("/").lower()
    return path != "/api/opendata/json"

def names(value):
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        return " ".join(names(v) for v in value)
    if isinstance(value, dict):
        return " ".join(names(v) for k,v in value.items() if re.search("наименован|ФИО|участник|name|party", k, re.I))
    return ""

def acts(value):
    if isinstance(value, list):
        for x in value:
            yield from acts(x)
    elif isinstance(value, dict):
        urls = [v for k,v in value.items() if re.search("ссылк|url|href|link", k, re.I) and isinstance(v,str) and official(v)]
        if urls:
            yield value, urls[0]
        else:
            for v in value.values():
                yield from acts(v)

def normalize(row, provenance):
    if not isinstance(row, dict) or not DGI.search(names(pick(row, "parties"))):
        return None
    number, court = pick(row, "case"), pick(row, "court")
    if not isinstance(number,str) or not number.strip() or not isinstance(court,str) or not court.strip():
        return None
    candidate = next(acts(pick(row,"acts")), None)
    if candidate is None:
        return None
    act, url = candidate
    date = next((v for k,v in act.items() if re.search("дат|date",k,re.I) and isinstance(v,str)), "")
    kind = next((v for k,v in act.items() if re.search("наименован|тип|name|type",k,re.I) and isinstance(v,str)), "Судебный акт")
    uid = str(pick(row, "uid") or "")
    topic = str(pick(row, "topic") or "Не определена")
    fingerprint = hashlib.sha256("|".join((uid or court,number,kind,date,url)).encode()).hexdigest()
    return {
        "name": (kind+" — "+number)[:250],
        "slug": "dgi-"+fingerprint[:24],
        "nomer-dela": number[:200],
        "sud": court[:250],
        "unikalnyy-identifikator": uid[:200],
        "kategoriya-spora": topic[:250],
        "publikaciya-sudebnogo-akta": url,
        "status-verifikacii": "pending_review_of_resolutive_part",
        "status-peresmotra": "Не проверено",
        "kratkoe-soderzhanie": "ДГИ участвует в деле. Суть и итог требуют проверки по судебному акту.",
        "poiskovye-temy": topic[:250],
        "klyuch-deduplikacii": fingerprint,
        "istochnik-nabora-dannyh": provenance[:250],
    }

def stream_rows(path):
    import ijson
    with open(path,"rb") as f:
        prefix = next((p for p,e,_ in ijson.parse(f) if e=="start_array" and p in ("","data","items","records","result","Data","Items")),None)
    if prefix is None:
        raise ValueError("Unknown official JSON root: inspect and adapt schema")
    with open(path,"rb") as f:
        yield from ijson.items(f, (prefix+".item") if prefix else "item")

def api(method,endpoint,token,payload=None):
    url = API+endpoint
    body = json.dumps(payload,ensure_ascii=False).encode() if payload is not None else None
    for attempt in range(5):
        request = urllib.request.Request(url, method=method, data=body,
                 headers={"Authorization":"Bearer "+token,"accept":"application/json","Content-Type":"application/json"})
        try:
            with urllib.request.urlopen(request,timeout=60) as response:
                return json.load(response)
        except urllib.error.HTTPError as e:
            if e.code not in (429,500,502,503,504) or attempt==4:
                raise RuntimeError("Webflow API error HTTP "+str(e.code)) from e
            time.sleep(2**attempt+1)

def existing(token):
    seen=set();offset=0
    while True:
        obj=api("GET",f"/collections/{CMS_COLLECTION}/items?limit=100&offset={offset}",token)
        arr=obj.get("items",[])
        for item in arr:
            data=item.get("fieldData",{})
            for key in ("klyuch-deduplikacii","publikaciya-sudebnogo-akta"):
                if data.get(key):
                    seen.add(data[key])
        offset += len(arr)
        if not arr or offset>=obj.get("pagination",{}).get("total",offset):
            break
    return seen

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--input",required=True)
    parser.add_argument("--download-url",default="")
    parser.add_argument("--source-label",default="")
    parser.add_argument("--limit",type=int,default=50)
    parser.add_argument("--upload",action="store_true")
    args=parser.parse_args()
    if not 1<=args.limit<=1000:
        parser.error("--limit must be between 1 and 1000")
    if args.download_url and not dataset_url(args.download_url):
        parser.error("Use a direct official case-dataset JSON URL, not /api/opendata/json (the registry export)")
    origin=args.download_url or args.source_label
    if not origin:
        parser.error("Official source label or URL is required")
    if not Path(args.input).is_file():
        parser.error("JSON input file missing")
    token=os.environ.get("WEBFLOW_TOKEN","")
    if args.upload and not token:
        parser.error("WEBFLOW_TOKEN secret required")
    known=existing(token) if args.upload else set()
    stats={"scanned":0,"matches":0,"duplicates":0,"staged":0,"candidates":0}
    pending=[]
    for row in stream_rows(args.input):
        stats["scanned"]+=1
        d=normalize(row,origin)
        if d is None:
            continue
        stats["matches"]+=1
        if d["klyuch-deduplikacii"] in known or d["publikaciya-sudebnogo-akta"] in known:
            stats["duplicates"]+=1
            continue
        known.update((d["klyuch-deduplikacii"],d["publikaciya-sudebnogo-akta"]))
        pending.append({"isDraft":True,"fieldData":d})
        if len(pending)>=args.limit:
            break
    stats["candidates"]=len(pending)
    if stats["scanned"] and not stats["matches"]:
        raise RuntimeError("No DGI court acts matched: verify this is a case dataset (not the open-data registry) and validate source schema")
    if args.upload:
        for start in range(0,len(pending),25):
            batch=pending[start:start+25]
            response=api("POST",f"/collections/{CMS_COLLECTION}/items",token,{"items":batch})
            saved=len(response.get("items",[]))
            if saved!=len(batch):
                raise RuntimeError("Incomplete CMS response: reconcile before retry")
            stats["staged"]+=saved
            time.sleep(.5)
    print(json.dumps({"dry_run":not args.upload,"stats":stats,"publication":"none, review required"},ensure_ascii=False,indent=2))

if __name__=="__main__":
    try:
        main()
    except Exception as e:
        print("ERROR:",e,file=sys.stderr)
        sys.exit(1)
