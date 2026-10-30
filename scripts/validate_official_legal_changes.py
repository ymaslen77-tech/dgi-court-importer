#!/usr/bin/env python3
"""Fail closed when proposed legal copy lacks verifiable current official text.

This checks *evidence provenance*, NOT a guarantee that a legal interpretation is
correct. All changed strings must be accounted for and evidence publicly
retrievable. Unknown layouts, conflicting texts and CMS records are not silently
promoted.
"""
import argparse
import datetime as dt
import html
from html.parser import HTMLParser
import json
import re
import subprocess
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

LEGAL_FILE = re.compile(r"apps/web/src/data/pages-[0-5]\.json")
OFFICIAL = (
    "pravo.gov.ru", "publication.pravo.gov.ru", "mos.ru", "mosreg.ru",
    "vsrf.ru", "ksrf.ru", "sudrf.ru", "rosreestr.gov.ru",
    "nalog.gov.ru", "gosuslugi.ru"
)
MAX_SOURCE_AGE_DAYS = 7

def norm(s):
    return re.sub(r"\s+", " ", html.unescape(str(s))).strip().casefold()

def allowed_source(address):
    try:
        p = urlsplit(address)
        host = (p.hostname or "").lower()
        return (p.scheme == "https" and host and
                any(host == d or host.endswith("." + d) for d in OFFICIAL)
                and not p.username and not p.password and not p.port
                and (p.path or "/") != "/" and not p.fragment)
    except (ValueError, AttributeError):
        return False

class PublicText(HTMLParser):
    def __init__(self):
        super().__init__();self.values=[];self.ignore=0
    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"): self.ignore += 1
    def handle_endtag(self, tag):
        if tag in ("script", "style"): self.ignore=max(0,self.ignore-1)
    def handle_data(self, data):
        if not self.ignore:self.values.append(data)

def official_excerpt_visible(url, excerpt):
    if not allowed_source(url):
        return False, "URL is not a specific official source"
    try:
        req=Request(url, headers={"User-Agent":"DGI-Official-Evidence-Reviewer/1.0"})
        with urlopen(req, timeout=20) as response:
            final=response.geturl()
            if response.status != 200 or not allowed_source(final):
                return False,"Official source HTTP response/redirect is invalid"
            media=response.headers.get("Content-Type","").split(";")[0].strip().lower()
            if media not in ("text/html", "application/xhtml+xml", "text/plain"):
                return False,"Cannot independently verify official text in non-HTML source"
            data=response.read(3000000).decode(response.headers.get_content_charset() or "utf-8","replace")
        if "html" in media:
            parser=PublicText();parser.feed(data);text=" ".join(parser.values)
        else:text=data
        if norm(excerpt) not in norm(text):
            return False,"Exact quoted excerpt not visible in fetched official source"
        return True,"Official text excerpt observed on allowed host"
    except Exception as e:
        return False,"Official source unavailable: "+type(e).__name__

def git_json(rev,path):
    return json.loads(subprocess.check_output(["git","show",f"{rev}:{path}"],text=True))
def legal_diffs(old,new,path):
    if not isinstance(old,list) or not isinstance(new,list) or len(old)!=len(new):
        raise ValueError("Legal content structure/number of pages changed")
    changes=[]
    for a,b in zip(old,new):
        slug=a.get("slug")
        if not isinstance(slug,str) or slug != b.get("slug") or len(a.get("blocks",[]))!=len(b.get("blocks",[])):
            raise ValueError("Legal page slug or block structure changed")
        if {k:v for k,v in a.items() if k!="blocks"}!={k:v for k,v in b.items() if k!="blocks"}:
            raise ValueError("Legal metadata or page structure changed")
        for index,(before,after) in enumerate(zip(a["blocks"],b["blocks"])):
            if before==after:continue
            if (before.get("kind") not in ("p","h2","h3","h4") or
                {k:v for k,v in before.items() if k!="text"} !=
                {k:v for k,v in after.items() if k!="text"} or
                not before.get("text") or not after.get("text")):
                raise ValueError("Only replacement of existing legal paragraph/heading text is allowed")
            changes.append({"file":path,"slug":slug,"block_index":index,
                            "before":before["text"],"after":after["text"]})
    return changes

def assess(base,head,changed_files,manifest,fetcher=official_excerpt_visible):
    legal_files=sorted(p for p in changed_files if LEGAL_FILE.fullmatch(p))
    if not legal_files: return {"status":"not_applicable","claims":0,"details":[]}
    if any(p != "legal-evidence/changes.json" and p not in legal_files for p in changed_files):
        raise ValueError("Cannot mix legal content modifications with other files")
    if "legal-evidence/changes.json" not in changed_files:
        raise ValueError("Legal copy changes require a per-claim official evidence manifest")
    claims=manifest.get("changes")
    if manifest.get("version") != 1 or not isinstance(claims,list):
        raise ValueError("Malformed claim evidence manifest")
    expected=[]
    for p in legal_files:
        expected+=legal_diffs(git_json(base,p),git_json(head,p),p)
    if not expected:raise ValueError("No legal text replacements identified")
    if len(expected)>30:raise ValueError("Too many legal claims in one batch")
    now=dt.datetime.now(dt.timezone.utc)
    details=[]; seen=set()
    for row in claims:
        if not isinstance(row,dict):raise ValueError("Invalid claim record")
        identity=(row.get("file"),row.get("slug"),row.get("block_index"),
                  row.get("before"),row.get("after"))
        if identity in seen:raise ValueError("Duplicate evidence record")
        seen.add(identity)
        if not isinstance(row.get("after"),str) or len(row["after"])<20:
            raise ValueError("Empty or unsupported legal replacement")
        if not all(isinstance(row.get(k),str) and len(row[k].strip())>=8 for k in
                   ("official_source_url","act_number_and_date","legal_reason_and_scope",
                    "official_source_excerpt")):
            raise ValueError("Missing specific authoritative source or reasoning")
        if len(row["official_source_excerpt"])<60:
            raise ValueError("Official excerpt too short to support a legal assertion")
        if row.get("transitional_rules_checked") is not True or row.get("amendment_history_checked") is not True:
            raise ValueError("Current amendments/transitional rules were not verified")
        try:
            checked=dt.datetime.fromisoformat(row["source_checked_at"].replace("Z","+00:00"))
            effective=dt.date.fromisoformat(row["effective_date"])
        except (ValueError,TypeError,KeyError):
            raise ValueError("Invalid checked/effective date")
        if checked.tzinfo is None or not (0 <= (now-checked).total_seconds() <= MAX_SOURCE_AGE_DAYS*86400):
            raise ValueError("Official source verification is missing/stale")
        if effective>now.date():
            raise ValueError("Future act cannot be described as currently effective")
        ok,explanation=fetcher(row["official_source_url"],row["official_source_excerpt"])
        if not ok:raise ValueError(explanation)
        details.append({"file":row["file"],"slug":row["slug"],
            "source_url":row["official_source_url"],"effective_date":row["effective_date"],
            "source_retrieved":True,"note":"Exact excerpt match is not semantic legal approval"})
    target={(v["file"],v["slug"],v["block_index"],v["before"],v["after"]) for v in expected}
    if target!=seen:raise ValueError("Some changed text lacks matching source evidence, or manifest has unrelated claims")
    return {"status":"official_quote_verified","claims":len(expected),"details":details,
            "caveat":"Official excerpt was fetched, but legal applicability and current amendment history also require independent cross-check before publishing"}

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--base",required=True)
    p.add_argument("--head",default="HEAD")
    p.add_argument("--output",default="test-results/legal-evidence-verification.json")
    args=p.parse_args()
    changed=subprocess.check_output(["git","diff","--name-only",args.base+"..."+args.head],text=True).splitlines()
    legal=any(LEGAL_FILE.fullmatch(x) for x in changed)
    manifest=json.loads(Path("legal-evidence/changes.json").read_text()) if legal else {}
    result=assess(args.base,args.head,changed,manifest)
    Path(args.output).parent.mkdir(parents=True,exist_ok=True)
    Path(args.output).write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n")
    print("LEGAL_OFFICIAL_SOURCE_GATE",result["status"],result["claims"])

if __name__=="__main__":
    main()
