#!/usr/bin/env python3
"""Compare two complete SEO crawl artifacts. Never publish changes."""
import argparse
import json
from pathlib import Path

def compare(previous, current):
    if previous.get("site") != current.get("site"):
        raise ValueError("Cannot compare reports for different hosts")
    older=set(previous.get("sitemap_urls",[]))
    newer=set(current.get("sitemap_urls",[]))
    # An empty historical sitemap is a release blocker, not a useful approved baseline.
    usable=bool(older)
    removed=sorted(older-newer) if usable else []
    added=sorted(newer-older) if usable else []
    oldpages={row["url"]:row for row in previous.get("pages",[]) if row.get("url")}
    newpages={row["url"]:row for row in current.get("pages",[]) if row.get("url")}
    changes=[]
    for url in sorted(oldpages.keys() & newpages.keys()):
        a,b=oldpages[url],newpages[url]
        for field in ("title","description","canonical"):
            if a.get(field)!=b.get(field):
                changes.append({"url":url,"field":field,"old":str(a.get(field))[:160],
                                "new":str(b.get(field))[:160]})
    olderrors={(x.get("kind"),x.get("url")) for x in previous.get("errors",[])}
    newerrors={(x.get("kind"),x.get("url")) for x in current.get("errors",[])}
    return {
        "status":"compared" if usable else "no_usable_approved_sitemap_baseline",
        "removed_sitemap_urls":removed,
        "new_sitemap_urls":added,
        "new_error_signatures":[{"kind":k,"url":u} for k,u in sorted(newerrors-olderrors)],
        "resolved_error_signatures":[{"kind":k,"url":u} for k,u in sorted(olderrors-newerrors)],
        "metadata_changes":changes,
        "release_review_required":bool(removed or (added and usable)),
        "automatic_publication_allowed":False,
    }

def main():
    a=argparse.ArgumentParser()
    a.add_argument("--previous",required=True)
    a.add_argument("--current",required=True)
    a.add_argument("--output",required=True)
    args=a.parse_args()
    prev=json.loads(Path(args.previous).read_text(encoding="utf8"))
    current=json.loads(Path(args.current).read_text(encoding="utf8"))
    result=compare(prev,current)
    Path(args.output).write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print("SEO_DIFF",json.dumps({k:len(v) if isinstance(v,list) else v for k,v in result.items()},ensure_ascii=False))
    if result["removed_sitemap_urls"]:
        raise SystemExit("Sitemap entries disappeared: investigate CMS/robots/release before publishing")
if __name__=="__main__":
    main()
