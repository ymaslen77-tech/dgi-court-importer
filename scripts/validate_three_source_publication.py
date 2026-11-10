#!/usr/bin/env python3
"""Fail-closed gate for *new or altered* publication content, not a legal opinion.

Every newly authored statement needs three independent official publishers and
three observed verbatim source passages. Merely finding quotes cannot prove
their legal meaning matches: discrepancies must be resolved before publication.
"""
import argparse
import json
import re
import subprocess
from pathlib import Path

from validate_official_legal_changes import inspect_three_sources

MANIFEST = "legal-evidence/three-source-claims.json"
LEGAL_TEMPLATE_FILES = frozenset((
    "apps/web/src/components/LegalDocumentBuilder.tsx",
    "apps/web/src/components/SpecializedDocumentBuilder.tsx",
    "apps/web/src/components/HousingGuide.tsx",
    "apps/web/src/components/HousingLawCatalog.tsx",
    "apps/web/src/components/DgiServiceRegistry.tsx",
))
# These components blend code with legal copy. Until a typed per-sentence
# verifier is implemented, block changes rather than silently accept text.
CONTENT_PATHS = frozenset((
    "apps/web/src/data/housing-news.json",
    "apps/web/src/data/verified-court-static.json",
    "apps/web/src/data/housing-guides.json",
    "apps/web/src/data/housing-law-catalog.json",
    "apps/web/src/data/owner-released-legacy-pages.json",
))
# These fields are copied from the original official court act and checked by
# existing full-text/PDF SHA256 verification. We still require 3 publishers for
# the editorially created metadata and summaries.
SOURCE_ARTIFACT_KEYS = frozenset((
    "slug","official_url","official_pdf_url","sourceUrl","sourceName",
    "pdf_origin","official_source_sha256","full_text_sha256","pdf_sha256",
    "source_checked","privacy_screen_passed","privacy_checked","sources",
    "related","kind","status","id","editoriallyApproved",
))
def git_json(rev,path,default):
    try:
        return json.loads(subprocess.check_output(
            ["git","show",f"{rev}:{path}"],text=True,stderr=subprocess.DEVNULL))
    except subprocess.CalledProcessError:
        return default

def keyed_records(path,obj):
    if path.endswith("owner-released-legacy-pages.json"):
        values=obj.get("approved_existing_slugs",[])
        return {v:{"slug":v,"owner_release":v} for v in values}
    if isinstance(obj,list):
        key="slug"
        if path.endswith("verified-court-static.json"):
            key="slug"
        return {v[key]:v for v in obj}
    if path.endswith("housing-guides.json"):
        return {v["slug"]:v for group in ("guides","supplements")
                for v in obj.get(group,[])}
    if isinstance(obj,dict) and isinstance(obj.get("entries"),list):
        return {v["slug"]:v for v in obj["entries"]}
    if isinstance(obj,dict) and isinstance(obj.get("acts"),list):
        return {str(v.get("id")):v for v in obj["acts"]}
    raise ValueError("Unknown content data shape: "+path)

def text_leaves(record, parent=""):
    """Bind evidence to exact fields, preventing an extra claim from hiding."""
    if isinstance(record,dict):
        for key,value in record.items():
            if key in SOURCE_ARTIFACT_KEYS:
                continue
            new_key=parent+"."+key if parent else key
            yield from text_leaves(value,new_key)
    elif isinstance(record,list):
        for i,value in enumerate(record):
            yield from text_leaves(value,parent+"."+str(i))
    elif isinstance(record,str) and record.strip():
        # Full court act must be official-byte-hash verified separately; a
        # source-copied judgment is not an assistant-authored legal summary.
        if parent in ("full_text",):
            return
        yield parent,record

def expected_changes(base,head,changed_paths):
    expected=[]
    for path in sorted(set(changed_paths)&CONTENT_PATHS):
        is_legacy=path.endswith("owner-released-legacy-pages.json")
        default={} if is_legacy or path.endswith("housing-guides.json") else []
        old=keyed_records(path,git_json(base,path,default))
        new=keyed_records(path,git_json(head,path,default))
        if set(old)-set(new):
            raise ValueError("Removing published content requires independent review: "+path)
        for record_id,row in new.items():
            if record_id in old and row==old[record_id]:
                continue
            before=dict(text_leaves(old[record_id])) if record_id in old else {}
            after=dict(text_leaves(row))
            for field,statement in after.items():
                if before.get(field)!=statement:
                    expected.append({"file":path,"record_id":record_id,
                        "field":field,"exact_text":statement})
    return expected

def private_new_route_only(path,source):
    return (path.endswith("/page.tsx") and
            "if (siteIsLive) notFound();" in source and
            "index: false" in source and "follow: false" in source and
            "notFound" in source)

def check_new_public_routes(base,head,changed_paths,reader):
    for path in changed_paths:
        if not re.fullmatch(r"apps/web/src/app/(?:[^/]+/)+page\.tsx",path):
            continue
        try:
            subprocess.check_output(["git","cat-file","-e",f"{base}:{path}"],stderr=subprocess.DEVNULL)
            continue  # existing routes handled by normal PR review + content tests
        except subprocess.CalledProcessError:
            pass
        content=reader(head,path)
        if not private_new_route_only(path,content):
            raise ValueError("New public route requires source-checked release plan: "+path)

def assess(changes,manifest,fetcher=None):
    if manifest.get("version")!=1 or not isinstance(manifest.get("claims"),list):
        raise ValueError("Malformed three-source manifest")
    submitted=manifest["claims"]
    indexed={}
    for claim in submitted:
        if not isinstance(claim,dict):
            raise ValueError("Malformed evidence claim")
        key=(claim.get("file"),claim.get("record_id"),claim.get("field"),claim.get("exact_text"))
        if key in indexed:
            raise ValueError("Duplicate claim verification")
        indexed[key]=claim
    expected_keys={(c["file"],c["record_id"],c["field"],c["exact_text"]) for c in changes}
    if set(indexed)!=expected_keys:
        raise ValueError("Every changed factual field needs matching three-source proof")
    verified=[]
    for key,claim in indexed.items():
        if claim.get("same_legal_conclusion_checked") is not True or claim.get("same_period_and_scope_checked") is not True:
            raise ValueError("Legal meaning, jurisdiction and period not compared")
        if claim.get("contradictions_checked") is not True or claim.get("unresolved_contradictions") not in ([],None):
            raise ValueError("Unresolved source contradictions prohibit publication")
        if len(str(claim.get("source_comparison_notes","")).strip())<40:
            raise ValueError("Detailed comparison missing")
        provenance=inspect_three_sources({
            "sources":claim.get("sources"),
            "source_agreement_checked":claim["same_legal_conclusion_checked"],
            "contradictions_checked":claim["contradictions_checked"],
            "source_comparison_notes":claim["source_comparison_notes"],
        },fetcher=fetcher) if fetcher else inspect_three_sources({
            "sources":claim.get("sources"),
            "source_agreement_checked":claim["same_legal_conclusion_checked"],
            "contradictions_checked":claim["contradictions_checked"],
            "source_comparison_notes":claim["source_comparison_notes"],
        })
        verified.append({"file":key[0],"item":key[1],"field":key[2],
            "publishers":[s["publisher"] for s in provenance]})
    return {"status":"three_source_provenance_passed_not_semantic_legal_opinion",
            "claims_verified":len(verified),"details":verified}

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--base",required=True)
    parser.add_argument("--head",default="HEAD")
    parser.add_argument("--output",default="test-results/three-source-publication.json")
    args=parser.parse_args()
    changed=subprocess.check_output(["git","diff","--name-only",args.base+"..."+args.head],text=True).splitlines()
    check_new_public_routes(args.base,args.head,changed,lambda revision,path:
        subprocess.check_output(["git","show",f"{revision}:{path}"],text=True))
    unverified_templates=sorted(set(changed)&LEGAL_TEMPLATE_FILES)
    if unverified_templates:
        raise ValueError("Legal template edits require a dedicated three-source claim audit; held unpublished: "+
                         ", ".join(unverified_templates))
    changed_content=sorted(set(changed)&CONTENT_PATHS)
    manifest_path=Path(MANIFEST)
    if changed_content and MANIFEST not in changed:
        raise ValueError("Modified publication data without a new three-source evidence manifest")
    manifest=json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.exists() else {"version":1,"claims":[]}
    expected=expected_changes(args.base,args.head,changed)
    result=assess(expected,manifest)
    Path(args.output).parent.mkdir(parents=True,exist_ok=True)
    Path(args.output).write_text(json.dumps({
        **result,"changed_content_files":changed_content,
        "caveat":"Three observed official quotes are provenance; no automatic semantic equivalence or judicial review has been invented."
    },ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("THREE_SOURCE_PUBLICATION_GATE",result["status"],result["claims_verified"])

if __name__=="__main__":
    main()
