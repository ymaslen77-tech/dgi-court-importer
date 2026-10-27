#!/usr/bin/env python3
"""Create a narrowly scoped reviewable source patch from a fresh SEO audit.

This is deliberately NOT a general SEO/legal copy editor. It changes only the
href field of existing link blocks in migrated JSON, and only when a one-hop
301/308 from the LIVE source URL to a published same-host HTTPS page was
observed on that exact published source page. Never touches slugs, legal text,
cases, PDFs, CMS, DB, or runtime deployment settings.
"""
import argparse
import copy
import glob
import json
import re
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

ORIGIN = "https://dgi-pravo.ru"
HOST = "dgi-pravo.ru"
SOURCE_GLOB = "apps/web/src/data/pages-*.json"
MAX_EDITS = 20

def normalized(url):
    try:
        value = urlsplit(url)
    except (ValueError, TypeError):
        return None
    if (value.scheme != "https" or value.netloc != HOST or
            not value.path.startswith("/") or value.query or value.fragment or
            value.username or value.password):
        return None
    return urlunsplit((value.scheme, value.netloc, value.path or "/", "", ""))

def proposed_changes(report, root):
    if report.get("site") != ORIGIN:
        raise ValueError("Audit target is not the approved production site")
    sitemap = {normalized(item) for item in report.get("sitemap_urls", [])}
    sitemap.discard(None)
    if not sitemap:
        raise ValueError("Cannot patch links without a valid production sitemap")
    allowed = {}
    for item in report.get("safe_redirect_candidates", []):
        old, new = normalized(item.get("old")), normalized(item.get("new"))
        pages = set(item.get("observed_on", []))
        if (old and new and old != new and item.get("status") in (301, 308)
                and new in sitemap and pages):
            if old in allowed and allowed[old] != (new, pages):
                raise ValueError("Ambiguous permanent redirect")
            allowed[old] = (new, pages)
    changes = []
    patches = {}
    for filename in sorted(glob.glob(str(root / SOURCE_GLOB))):
        path = Path(filename)
        before = path.read_text(encoding="utf8")
        data = json.loads(before)
        if not isinstance(data, list):
            raise ValueError("Invalid migrated page data")
        revised = copy.deepcopy(data)
        touched = False
        for page in revised:
            slug = page.get("slug", "")
            if not isinstance(slug, str) or not re.fullmatch("[a-z0-9-]*", slug):
                raise ValueError("Invalid slug")
            page_url = ORIGIN + "/" + slug
            if page_url not in sitemap:
                continue  # Historical/draft snapshot; do not propose changes.
            for block in page.get("blocks", []):
                if block.get("kind") != "link" or not isinstance(block.get("href"), str):
                    continue
                old = block["href"]
                if old not in allowed:
                    continue
                new, observed_on = allowed[old]
                if page_url not in observed_on:
                    continue  # The live CMS may override this historical snapshot.
                block["href"] = new
                touched = True
                changes.append({"file": str(path.relative_to(root)), "page": page_url,
                                "old": old, "new": new, "evidence": "live_301_or_308_and_sitemap"})
                if len(changes) > MAX_EDITS:
                    raise ValueError("Too many edits; manual inspection required")
        if touched:
            # Data JSON is already formatted with 2 spaces; refuse broad
            # reformatting to keep the PR diff tightly limited to href changes.
            after = json.dumps(revised, ensure_ascii=False, indent=2) + "\n"
            if before == after:
                raise AssertionError("Unexpected unchanged output")
            if len(after) - len(before) > 2000:
                raise ValueError("Unexpectedly broad source diff")
            # Verify all non-href information remains identical.
            for original, fixed in zip(data, revised):
                for b_original, b_fixed in zip(original.get("blocks", []), fixed.get("blocks", [])):
                    assert {k:v for k,v in b_original.items() if k != "href"} == {k:v for k,v in b_fixed.items() if k != "href"}
            patches[path] = after
    return changes, patches

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--report", required=True)
    p.add_argument("--repository", type=Path, default=Path("."))
    p.add_argument("--output", type=Path, default=Path("seo-fix-plan.json"))
    args=p.parse_args()
    report=json.loads(args.report and Path(args.report).read_text(encoding="utf8"))
    changes, patches=proposed_changes(report, args.repository)
    for path, text in patches.items():
        path.write_text(text, encoding="utf8")
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps({"kind":"safe_internal_redirect_link_updates",
        "auto_publish":False,"changes":changes}, ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print("REVIEWABLE_SEO_PR_CHANGES",len(changes))

if __name__=="__main__":
    main()
