#!/usr/bin/env python3
"""Daily RSS discovery of housing-law NEWS CANDIDATES. Never publish automatically."""
import argparse
import hashlib
import json
import os
import re
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime

from importer import api

COLLECTION = "6acbbe75ee81535770a2bff7"
FEED = "https://rss.garant.ru/news/"
INTEREST = re.compile(
    r"жилищ|жилого?\s+помещен|квартир|недвижим|коммунальн|\bжкх\b|"
    r"\bжку\b|реновац|выселен|земельн|землепольз|кадастр|"
    r"собственник.{0,50}(помещен|дом|квартир)|\bегрн\b|"
    r"многоквартирн|социальн.{0,30}найм|аренд.{0,30}(земл|квартир|помещен)",
    re.I,
)

def allowed_article(url):
    p=urllib.parse.urlsplit(url.strip())
    host=(p.hostname or "").lower()
    return p.scheme=="https" and host in ("www.garant.ru", "garant.ru") and (
        p.path.startswith("/news/") or p.path.startswith("/article/")
    ) and not p.username and not p.password and p.port in (None,443)

def normal_url(url):
    p=urllib.parse.urlsplit(url.strip())
    return urllib.parse.urlunsplit(("https","www.garant.ru",p.path.rstrip("/")+"/","",""))

def parse_feed(blob):
    root=ET.fromstring(blob)
    entries=[]
    for item in root.findall(".//item"):
        title=" ".join((item.findtext("title") or "").split())
        link=(item.findtext("link") or "").strip()
        if not title or not allowed_article(link):
            continue
        published=(item.findtext("pubDate") or "").strip()
        try:
            published=parsedate_to_datetime(published).isoformat() if published else ""
        except (ValueError, TypeError, IndexError):
            published=""
        entries.append({"title":title,"url":normal_url(link),"date":published})
    return entries

def is_relevant(item):
    return bool(INTEREST.search(item["title"]))

def candidate(item):
    url=item["url"]
    key=hashlib.sha256(url.encode("utf-8")).hexdigest()
    d={
        "name":("На проверке: "+item["title"])[:250],
        "slug":"housing-news-"+key[:24],
        "rubrika":"Новости жилищного права — на проверке",
        "istochnik-publikacii":"ГАРАНТ.РУ (RSS)",
        "url-pervoistochnika":url,
        "klyuch-pervoistochnika":url,
        "kratkiy-anons":"Тема обнаружена в ленте; факты, правовой статус и первичные документы ещё не проверены.",
        "temy-zhilishchnogo-prava":"Требуется редакционная классификация",
        "status-verifikacii":"candidate — requires primary-source and editorial review",
        "provereno-redaktorom":False,
    }
    if item["date"]: d["data-istochnika"]=item["date"]
    return {"isDraft":True,"fieldData":d}

def seen_urls(token):
    known=set()
    offset=0
    while True:
        result=api("GET",f"/collections/{COLLECTION}/items?limit=100&offset={offset}",token)
        arr=result.get("items",[])
        for item in arr:
            f=item.get("fieldData",{})
            for key in ("klyuch-pervoistochnika","url-pervoistochnika"):
                if f.get(key):
                    u=f[key]
                    if allowed_article(u): known.add(normal_url(u))
        offset+=len(arr)
        if not arr or offset>=result.get("pagination",{}).get("total",offset):
            return known

def run(limit,upload):
    if limit<1 or limit>50: raise ValueError("limit must be 1..50")
    if upload and not os.getenv("WEBFLOW_TOKEN"):
        raise ValueError("WEBFLOW_TOKEN required for upload")
    req=urllib.request.Request(FEED,headers={"User-Agent":"Housing-Law-Editorial-RSS/1.0 (+https://rpn-585571.webflow.io/)"})
    with urllib.request.urlopen(req,timeout=35) as response:
        raw=response.read(3_000_001)
    if len(raw)>3_000_000: raise ValueError("RSS feed too large")
    rows=parse_feed(raw)
    if not rows: raise ValueError("RSS empty or schema changed; no import")
    token=os.getenv("WEBFLOW_TOKEN","")
    old=seen_urls(token) if upload else set()
    drafts=[]
    for item in rows:
        if not is_relevant(item) or item["url"] in old: continue
        old.add(item["url"])
        drafts.append(candidate(item))
        if len(drafts)>=limit: break
    staged=0
    if upload:
        for i in range(0,len(drafts),20):
            batch=drafts[i:i+20]
            result=api("POST",f"/collections/{COLLECTION}/items",token,{"items":batch})
            count=len(result.get("items",[]))
            if count!=len(batch): raise RuntimeError("Webflow returned incomplete batch")
            staged+=count
    print(json.dumps({"feed_items":len(rows),"relevant_new_candidates":len(drafts),
        "drafts_staged":staged,"dry_run":not upload,
        "automatic_publication":False},ensure_ascii=False))
if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--limit",type=int,default=15)
    parser.add_argument("--upload",action="store_true")
    a=parser.parse_args()
    try: run(a.limit,a.upload)
    except Exception as e:
        print("RSS NEWS ERROR:",str(e),file=sys.stderr)
        sys.exit(1)
