#!/usr/bin/env python3
"""Read-only public release visibility check, never a deployment mechanism.

Compares actual public news cards and court API counts to repository manifest
counts and observes indexability. The probe records failures explicitly and
does not claim that a local Next.js build means remote pages are published.
"""
import argparse
import datetime as dt
from html.parser import HTMLParser
import json
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

NEWS="/novosti-zhilishchnogo-prava"
COURTS="/api/courts/verified"
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"test-results/dgi-live-publication-smoke.json"
BASE="https://dgi-pravo.ru"

class NewsCards(HTMLParser):
    def __init__(self):
        super().__init__()
        self.cards=0
        self.noindex=False
    def handle_starttag(self,tag,attrs):
        props=dict(attrs)
        if tag=="article" and "housing-news-card" in props.get("class","").split():
            self.cards+=1
        if tag=="meta" and props.get("name","").lower()=="robots":
            self.noindex="noindex" in props.get("content","").lower()

def fetch(url,timeout=18):
    req=Request(url,headers={"User-Agent":"DGI-Publication-Smoke/1.0"})
    with urlopen(req,timeout=timeout) as response:
        final=urlsplit(response.url)
        if response.status!=200 or final.scheme!="https" or final.hostname!="dgi-pravo.ru":
            raise ValueError("Unexpected status or hostname for published page")
        data=response.read(12_000_000+1)
        if len(data)>12_000_000:
            raise ValueError("Response exceeds bounded audit size")
        return data,dict(response.headers.items())

def check(fetcher=fetch):
    news=json.loads((ROOT/"apps/web/src/data/housing-news.json").read_text("utf8"))
    courts=json.loads((ROOT/"apps/web/src/data/verified-court-static.json").read_text("utf8"))
    expected={"news":len(news),"verified_courts":len(courts)}
    result={"checked_at":dt.datetime.now(dt.timezone.utc).isoformat(),
            "expected_manifest_counts":expected,"news":{},"courts":{},
            "status":"not_checked","live_content_confirmed":False}
    try:
        body,headers=fetcher(BASE+NEWS)
        parser=NewsCards()
        parser.feed(body.decode("utf8","replace"))
        result["news"]={"http_200":True,"visible_news_cards":parser.cards,
                        "noindex_meta":parser.noindex,
                        "x_robots_tag":headers.get("X-Robots-Tag","")}
    except Exception as exc:
        result["news"]={"http_200":False,"error_type":type(exc).__name__}
    try:
        body,headers=fetcher(BASE+COURTS)
        data=json.loads(body)
        if not isinstance(data.get("items"),list):
            raise ValueError("Court API did not return an items list")
        result["courts"]={"http_200":True,
                          "public_api_count":len(data["items"])}
    except Exception as exc:
        result["courts"]={"http_200":False,"error_type":type(exc).__name__}
    if not result["news"].get("http_200") or not result["courts"].get("http_200"):
        result["status"]="unreachable_or_server_error"
    elif (result["news"]["visible_news_cards"]!=expected["news"] or
          result["courts"]["public_api_count"]!=expected["verified_courts"]):
        result["status"]="live_release_manifest_mismatch"
    elif result["news"]["noindex_meta"] or "noindex" in result["news"]["x_robots_tag"].lower():
        result["status"]="content_visible_but_noindex"
    else:
        result["status"]="observed_counts_match_source_and_indexable"
        result["live_content_confirmed"]=True
    return result

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--out",default=str(OUT))
    args=parser.parse_args()
    result=check()
    file=Path(args.out);file.parent.mkdir(parents=True,exist_ok=True)
    file.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n","utf8")
    print("DGI_LIVE_PUBLICATION_AUDIT",json.dumps(result,ensure_ascii=False))
    if not result["live_content_confirmed"]:
        print("::warning title=DGI live publication not confirmed::"+
              result["status"]+"; never claim site news/courts are updated")

if __name__=="__main__":
    main()
