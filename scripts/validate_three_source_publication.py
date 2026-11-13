#!/usr/bin/env python3
"""Fail-closed gate for *new or altered* publication content, not a legal opinion.

Every newly authored statement needs three independent official publishers and
three observed verbatim source passages. Merely finding quotes cannot prove
their legal meaning matches: discrepancies must be resolved before publication.
"""
import argparse
import hashlib
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
    "apps/web/src/data/pages-0.json",
    "apps/web/src/data/pages-1.json",
    "apps/web/src/data/pages-2.json",
    "apps/web/src/data/pages-3.json",
    "apps/web/src/data/pages-4.json",
    "apps/web/src/data/pages-5.json",
))
# These fields are copied from the original official court act and checked by
# existing full-text/PDF SHA256 verification. We still require 3 publishers for
# the editorially created metadata and summaries.
SOURCE_ARTIFACT_KEYS = frozenset((
    "slug","official_url","official_pdf_url","sourceUrl",
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
            if record_id in old and set(before)-set(after):
                raise ValueError("Removing previously published factual fields needs separate review: "+
                                 path+" "+record_id)
            if path.endswith("verified-court-static.json") and record_id in old:
                if old[record_id].get("full_text")!=row.get("full_text"):
                    raise ValueError("Replacing an original court act requires fresh primary evidence: "+
                                     path+" "+record_id)
            for field,statement in after.items():
                if before.get(field)!=statement:
                    expected.append({"file":path,"record_id":record_id,
                        "field":field,"exact_text":statement})
    return expected


# A strictly content-addressed *nonlegal-navigation-only* TSX contract.
# This is NOT a generic exemption for TSX, SEO copy, or legal statements.
# Any changed literal, import, conditional or dynamic expression (including
# metadata) changes the Git blob digest and FAILS closed. A new legal assertion
# still requires a separate typed, field-scoped three-source publication review.
# These exact audited files contain only a catalog of 33 owner-released routes,
# 10 already-rendered forms and explicitly neutral descriptive UI labels.
PUBLIC_DIRECTORY_ROUTE = "apps/web/src/app/temy-zhilishchnogo-prava/page.tsx"
PUBLIC_NAVIGATION_BLOBS = {
    PUBLIC_DIRECTORY_ROUTE: "d6983675b056e4dea61b45d984df8563eaf7d5c7",
    "apps/web/src/app/page.tsx": "1112dc00b788e30b3ba3ca7f0793519009c432f5",
    "apps/web/src/components/PageShell.tsx": "483a052e7e319b99fbb0a0fcefdb43031000887e",
    "apps/web/src/app/sitemap.ts": "988e8c307a0628bff7a3eb3f40150c0fc6e325c9",
}
PUBLIC_NAVIGATION_SOURCE_BLOBS = {
    "apps/web/src/data/navigator-preview.ts": "56fc91849a136582a1b646adc63e9e96ef31cfe1",
    "apps/web/src/data/owner-released-legacy-pages.json": "d4e9d259a6904baf64ec9b72fd25693710edcd00",
    "apps/web/src/data/pages-0.json": "5e17431a8bf454d056aedb2ce10fd020966b9c97",
    "apps/web/src/data/pages-1.json": "476401f34dc3814ca98f1b40368a866e4f30ffdf",
    "apps/web/src/data/pages-2.json": "643857193af0e72d72e51d3133f6e73755879e92",
    "apps/web/src/data/pages-3.json": "9e4c65b124db99ba6293a51ce73facdf1de5a53a",
    "apps/web/src/data/pages-4.json": "8d975d98bcb5c43bf1bb72a2bee46bcbe4667316",
    "apps/web/src/data/pages-5.json": "d8a6480db234c7472addad3916e48995cf968fc1",
}

def content_blob_sha(source):
    """Git-compatible content digest, covering all TSX and SEO text/branches."""
    if isinstance(source,str):
        source=source.encode("utf-8")
    return hashlib.sha1(b"blob "+str(len(source)).encode("ascii")+b"\0"+source).hexdigest()

def verify_public_navigation_contract(head, changed_paths, reader):
    """Accept only exact reviewed byte snapshots with immutable title provenance.

    Unlike naive 'no suspicious keywords' scanners, this rejects *every*
    unreviewed character in TSX, metadata or runtime data. Imported titles are
    restricted to the unchanged 33-page owner-release dataset. New legal TSX
    text is never auto-approved by this contract.
    """
    changed=set(changed_paths)
    relevant=changed.intersection(PUBLIC_NAVIGATION_BLOBS)
    source_changes=changed.intersection(PUBLIC_NAVIGATION_SOURCE_BLOBS)
    if not relevant and not source_changes:
        return set()
    try:
        candidate=reader(head,PUBLIC_DIRECTORY_ROUTE)
    except (subprocess.CalledProcessError,FileNotFoundError,KeyError):
        # Source changes before this public directory exists may be validated
        # by the *other* content gates, but do not imply a public approval.
        if relevant:
            raise ValueError("Public navigation contract requires exact route source")
        return set()
    if content_blob_sha(candidate)!=PUBLIC_NAVIGATION_BLOBS[PUBLIC_DIRECTORY_ROUTE]:
        raise ValueError("Public navigator TSX / metadata changed without independent review")
    for path,digest in {**PUBLIC_NAVIGATION_BLOBS,**PUBLIC_NAVIGATION_SOURCE_BLOBS}.items():
        try:
            body=reader(head,path)
        except (subprocess.CalledProcessError,FileNotFoundError,KeyError):
            raise ValueError("Missing source-bound navigation artifact: "+path)
        if content_blob_sha(body)!=digest:
            raise ValueError("Source-bound navigation artifact is unapproved: "+path)
    return relevant

# Hard quarantine for changes that could embed legal statements in app code.
# No automatic publishing of a changed public React page, metadata/route
# handler or component until a separate typed per-claim TS/TSX verifier exists.
# This also blocks legal assertions hidden in an unrelated new UI component.
PRIVATE_NAVIGATOR_PATH = "apps/web/src/app/navigator-dgi/page.tsx"
PRIVATE_NAVIGATOR_DATA = "apps/web/src/data/navigator-preview.ts"
def private_new_route_only(path,source):
    return (path==PRIVATE_NAVIGATOR_PATH and
            "if (siteIsLive) notFound();" in source and
            "index: false" in source and "follow: false" in source and
            "notFound" in source)

def check_new_public_routes(base,head,changed_paths,reader):
    del base  # Check both *new and existing* public TS/TSX routes.
    verified_neutral=verify_public_navigation_contract(head,changed_paths,reader)
    for path in changed_paths:
        if path.startswith("apps/web/src/app/") and path.endswith((".ts",".tsx")):
            if path==PRIVATE_NAVIGATOR_PATH and private_new_route_only(path,reader(head,path)):
                continue
            if path in verified_neutral:
                continue
            raise ValueError("New public route or altered page/metadata requires source-checked release plan: "+path)
    return verified_neutral


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

def block_unverified_template_edits(paths):
    unverified=sorted(set(paths)&LEGAL_TEMPLATE_FILES)
    if unverified:
        raise ValueError("Legal template edits require a dedicated three-source claim audit; held unpublished: "+
                         ", ".join(unverified))
    # A new component or a helper can embed a legal instruction without
    # changing a page. Quarantine all runtime TS(X) publication code for now;
    # neutral content grouping from existing slugs is the only explicit safe
    # exception in this first sprint.
    other=sorted(p for p in set(paths)
                 if (p.startswith("apps/web/src/components/") and p.endswith((".ts",".tsx")))
                 or (p.startswith("apps/web/src/data/") and p.endswith((".ts",".tsx"))
                     and p!=PRIVATE_NAVIGATOR_DATA))
    if other:
        raise ValueError("Runtime legal content/code needs dedicated claim review: "+", ".join(other))

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--base",required=True)
    parser.add_argument("--head",default="HEAD")
    parser.add_argument("--output",default="test-results/three-source-publication.json")
    args=parser.parse_args()
    changed=subprocess.check_output(["git","diff","--name-only",args.base+"..."+args.head],text=True).splitlines()
    verified_neutral=check_new_public_routes(args.base,args.head,changed,lambda revision,path:
        subprocess.check_output(["git","show",f"{revision}:{path}"],text=True))
    # A reviewed, byte-locked neutral shell-link edit cannot carry arbitrary
    # code or legal prose. Any other component stays quarantined.
    block_unverified_template_edits([p for p in changed if p not in verified_neutral])
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
