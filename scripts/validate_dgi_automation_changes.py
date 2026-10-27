#!/usr/bin/env python3
"""Fail-closed review classifier for DGI content automation diffs.

This gate evaluates WHAT changed. Primary-source truth must be verified by the
separate research pipeline; passing this script is not legal/source approval.
"""
import argparse
import datetime
import json
import re
import subprocess
import sys
import unicodedata
from pathlib import Path
from urllib.parse import urlsplit

NEWS = "apps/web/src/data/housing-news.json"
LEGAL_SIGNAL = re.compile(
    r"вступ(?:ает|ил[аио]?) в силу|нов(?:ая|ые|ый) (?:редакци|закон|правил)|"
    r"измен(?:ил[аио]?сь|ён|ен|ения) (?:закон|порядок|срок|регламент|правил)|"
    r"госпошлин[аы] (?:увелич|сниж|измен)|"
    r"срок (?:подачи|обжалования|рассмотрения) (?:измен|увелич|сокращ)|"
    r"порядок (?:подачи|получения|обжалования) (?:измен|пересмотр)|"
    r"теперь обязаны|отменили (?:льгот|право|требован)|введ(?:ён|ен|ены) (?:запрет|обязанност)",
    re.I,
)
ALLOWED_HOSTS = ("mos.ru", "mosreg.ru", "pravo.gov.ru", "publication.pravo.gov.ru")
LEGAL_FILES = re.compile(
    r"^apps/web/(?:src/data/(?:pages-[0-5]\.json|housing-guides\.json|"
    r"housing-law[^/]*\.json)|src/app/.*|src/data/pages\\.ts)$"
)
def command(*args):
    return subprocess.check_output(args, text=True, stderr=subprocess.PIPE)
def load_at(revision, path):
    try:
        return json.loads(command("git","show",revision+":"+path))
    except subprocess.CalledProcessError:
        return []
def normalized_title(v):
    return re.sub(r"\W+"," ",unicodedata.normalize("NFC",v).casefold()).strip()
def normalized_url(url):
    p=urlsplit(url)
    if p.scheme!="https" or p.username or p.password or p.port:
        return None
    return (p.hostname or "").lower()+(p.path.rstrip("/") or "/")
def valid_news(row):
    if not isinstance(row,dict):return False
    try:
        slug,title,summary=row["slug"],row["title"],row["summary"]
        source=row["sourceUrl"]; url=urlsplit(source)
        if not (re.fullmatch("[a-z0-9-]{15,125}",slug) and
                20<=len(title)<=180 and 80<=len(summary)<=600):return False
        if url.scheme!="https" or not url.hostname or url.username or url.password:return False
        h=url.hostname.lower()
        if not any(h==d or h.endswith("."+d) for d in ALLOWED_HOSTS):return False
        if row["region"] not in ("Москва","Московская область"):return False
        if not 3<=len(row["sections"])<=8:return False
        if not row["sourceName"] or len(row["sourceName"])<3:return False
        if not row["category"] or len(row["category"])<3:return False
        pub=datetime.datetime.fromisoformat(row["publishedAt"].replace("Z","+00:00"))
        ref=datetime.datetime.fromisoformat(row["sourcePublishedAt"].replace("Z","+00:00"))
        if pub.tzinfo is None or ref.tzinfo is None:return False
        if ref>datetime.datetime.now(datetime.timezone.utc):return False
        if (pub-ref).days>7 or pub<ref:return False
        if (pub-datetime.datetime.now(datetime.timezone.utc)).total_seconds()>600:return False
        for s in row["sections"]:
            if len(s["heading"])<5 or not s["paragraphs"]:return False
            if any(not 70<=len(p)<=1200 for p in s["paragraphs"]):return False
        return True
    except (KeyError, TypeError, ValueError, AttributeError):
        return False
def assess_news(old,new):
    if not isinstance(new,list) or not isinstance(old,list):
        return "invalid","News source must remain a JSON list"
    previous={a.get("slug"):a for a in old if isinstance(a,dict)}
    current={a.get("slug"):a for a in new if isinstance(a,dict)}
    if len(previous)!=len(old) or len(current)!=len(new):
        return "invalid","Duplicate/invalid news slugs"
    if any(slug not in current or current[slug]!=row for slug,row in previous.items()):
        return "manual","Existing news articles were rewritten or deleted"
    new_rows=[item for item in new if item["slug"] not in previous]
    if len(new_rows)>5:return "invalid","More than 5 new articles in one change"
    if not new_rows:return "manual","No new articles; only restructuring"
    if not all(valid_news(x) for x in new_rows):
        return "invalid","News article failed dates, schema, source and content constraints"
    keys=[normalized_url(x["sourceUrl"]) for x in new]
    titles=[normalized_title(x["title"]) for x in new]
    if any(not k for k in keys) or len(set(keys))!=len(keys) or len(set(titles))!=len(titles):
        return "invalid","Duplicate official news URLs or headlines"
    for x in new_rows:
        prose=" ".join([x["title"],x["summary"]]+[
            p for s in x["sections"] for p in s["paragraphs"]])
        if LEGAL_SIGNAL.search(prose):
            return "evidence_required","Potential legal change needs primary-source evidence"
    return "auto_candidate","Fact-only official-source news, require independent source and CI checks"

def classify(files,base,head):
    if not files:return "noop",[]
    notes=[]
    categories=[]
    for path in files:
        if path==NEWS:
            result,reason=assess_news(load_at(base,NEWS),load_at(head,NEWS))
        elif path=="data/court-catalog.jsonl":
            result,reason="research_only","Court metadata candidate index is NEVER a verified judicial act"
        elif LEGAL_FILES.fullmatch(path):
            result,reason="evidence_required","Legal content must pass per-claim official-source verification"
        elif path.startswith(("config/","scripts/",".github/")):
            result,reason="ci_required","Automation/pipeline code needs passing CI and controlled release"
        else:
            result,reason="ci_required","Other code requires CI and controlled release"
        categories.append(result)
        notes.append({"file":path,"category":result,"reason":reason})
    if "invalid" in categories:return "invalid",notes
    if "evidence_required" in categories:return "evidence_required",notes
    if "ci_required" in categories:return "ci_required",notes
    if "research_only" in categories:return "research_only",notes
    return "auto_candidate",notes

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--base",required=True)
    parser.add_argument("--head",default="HEAD")
    parser.add_argument("--report",default="test-results/dgi-approval-classification.json")
    args=parser.parse_args()
    files=[x for x in command("git","diff","--name-only",args.base+"..."+args.head).splitlines() if x]
    result,notes=classify(files,args.base,args.head)
    obj={"classification":result,"changed_files":notes,
         "automatic_publication_confirmed":False,
         "legal_owner_review_required":False,
         "source_verification_required":result=="evidence_required",
         "reason":"This classifier is not an official-source verification or a deployment approval"}
    p=Path(args.report);p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+"\\n",encoding="utf8")
    print("DGI_CHANGE_CLASSIFICATION",result,json.dumps(notes,ensure_ascii=False))
    if result in ("invalid","research_only"):
        sys.exit(1)
    if result=="evidence_required":
        # Requires exact per-claim official-source text before the PR can pass CI.
        script=Path(__file__).with_name("validate_official_legal_changes.py")
        subprocess.run([sys.executable,str(script),"--base",args.base,
                        "--head",args.head],check=True)

if __name__=="__main__":main()
