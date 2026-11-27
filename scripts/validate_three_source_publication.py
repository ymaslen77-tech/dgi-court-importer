#!/usr/bin/env python3
"""Fail-closed gate for *new or altered* publication content, not a legal opinion.

Every newly authored statement needs three independent official publishers and
three observed verbatim source passages. Merely finding quotes cannot prove
their legal meaning matches: discrepancies must be resolved before publication.
"""
import argparse
import datetime as dt
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
# A judicial act is a unique original: three publishers cannot each issue
# the identical original text. This special release allows only the exact,
# independently staged court snapshot below, with the original official
# source and both text/PDF cryptographic fingerprints pinned. All authored
# legal statements and news remain under the three-publisher gate.
COURT_PATH = "apps/web/src/data/verified-court-static.json"
COURT_PDF_PATH = "apps/web/public/court-pdf-copies"
COURT_NEUTRAL_TEXT = {
    "court_name": "Второй кассационный суд общей юрисдикции",
    "act_type": "ruling",
    "topic": "Судебный акт по спору с Департаментом городского имущества Москвы",
    "excerpt": "Опубликован судебный акт с участием ДГИ Москвы; исход и мотивировка указаны в полном тексте.",
    "outcome_verified": "not_classified",
    "outcome_evidence": "Исход не классифицирован редакцией. Для оценки результата ознакомьтесь с резолютивной частью судебного акта.",
}
COURT_PRIMARY_RELEASE = {
    "2kas-88-3602-2026-2026-02-10": {
        "case_number": "88-3602/2026",
        "decision_date": "2026-02-10",
        "official_url": "https://2kas.sudrf.ru/modules.php?case_id=17231451&case_type=0&case_uid=794293b4-62f5-4704-ae2f-0eef6524b9d4&delo_id=2800001&name=sud_delo&name_op=case&new=2800001&srv_num=1",
        "official_source_sha256": "b2a2d3423c93fadd0ce0e195aa0e3d2f42352454f6cf3471b26946ec4644b42a",
        "full_text_sha256": "bdcd6437370138d5616c65ebc9acab56dc0b487a1133333e7443e28821457d2d",
        "pdf_sha256": "328fcc26dd4035737942d7971c57ca17417eb2f9dffd306578f53e86d86cd607",
    }
}
COURT_REQUIRED_KEYS = frozenset({
    "slug", "case_number", "court_name", "decision_date", "act_type",
    "topic", "official_url", "official_pdf_url", "pdf_origin",
    "official_source_sha256", "full_text_sha256", "full_text",
    "excerpt", "pdf_sha256", "source_checked", "privacy_screen_passed",
    "outcome_verified", "outcome_evidence"
})
COURT_REDACTION = re.compile(r"(?:\bФИО\d+\b|<адрес>|<данные изъяты>)", re.I)


def verify_official_court_release(row, approvals=None, pdf_reader=None):
    """Prove exact court source-copy identity, never authorize new legal claims.

    An editorial summary, a reclassified outcome, an added author-created
    legal interpretation, or a second unreviewed case is NOT permitted.
    """
    if approvals is None:
        approvals = COURT_PRIMARY_RELEASE
    if not isinstance(row, dict) or set(row) != COURT_REQUIRED_KEYS:
        raise ValueError("Court release requires exact source-only record schema")
    slug = row["slug"]
    if slug not in approvals:
        raise ValueError("Court has no individually reviewed official-primary release contract")
    pin = approvals[slug]
    if set(pin) != {"case_number", "decision_date", "official_url",
                    "official_source_sha256", "full_text_sha256", "pdf_sha256"}:
        raise ValueError("Court primary release pin schema mismatch")
    if any(row.get(k) != v for k, v in {**pin, **COURT_NEUTRAL_TEXT}.items()):
        raise ValueError("Court source identity or neutral metadata does not match release pin")
    if row["official_pdf_url"] != row["official_url"]:
        raise ValueError("Court original URL must match provenance URL")
    if (row["pdf_origin"] != "site_rendered_copy" or
            row["source_checked"] is not True or
            row["privacy_screen_passed"] is not True):
        raise ValueError("Court source or privacy provenance missing")
    number = row["case_number"]
    date = row["decision_date"]
    match = re.fullmatch(r"88-(\d{1,6})/(20\d{2})", number)
    if not match:
        raise ValueError("Unrecognized court case identifier")
    try:
        decision_date = dt.date.fromisoformat(date)
    except (ValueError,TypeError):
        raise ValueError("Invalid court decision date")
    if decision_date > dt.datetime.now(dt.timezone.utc).date():
        raise ValueError("Court decision is dated in the future")
    if int(match.group(2)) != decision_date.year:
        raise ValueError("Court case year differs from dated decision")
    if slug != "2kas-" + number.replace("/", "-").lower() + "-" + date:
        raise ValueError("Court PDF slug differs from source identification")
    text = row["full_text"]
    if not isinstance(text, str) or not 4000 <= len(text) <= 140000:
        raise ValueError("Full official judicial text absent")
    if hashlib.sha256(text.encode("utf-8")).hexdigest() != pin["full_text_sha256"]:
        raise ValueError("Full official judicial text does not match reviewed SHA256")
    if number not in text[:2200] or not re.search(
            r"департамент[а-я]*\s+городского\s+имущества", text, re.I):
        raise ValueError("Court text does not establish exact case and DGI participation")
    if not COURT_REDACTION.search(text):
        raise ValueError("Unmasked court act needs independent privacy review")
    if not re.search(r"ОПРЕДЕЛЕНИЕ\s*0?10\s+февраля\s+2026",text[:1100],re.I):
        raise ValueError("Court heading and date not confirmed from full text")
    if re.search(r"[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\+7|8)[\s(.-]*\d{3}[\s).\-]*\d{3}[\s.\-]*\d{2}[\s.\-]*\d{2}|\b\d{3}[-\s]\d{3}[-\s]\d{3}\s?\d{2}\b",text):
        raise ValueError("Court original has a potentially exposed personal identifier")
    if pdf_reader is None:
        pdf_reader = lambda file_path: file_path.read_bytes()
    path = Path(COURT_PDF_PATH) / (slug+".pdf")
    try:
        pdf = pdf_reader(path)
    except (OSError,ValueError):
        raise ValueError("Verified PDF copy missing")
    if (not isinstance(pdf,bytes) or not 12000 <= len(pdf) <= 15_728_640 or
            not pdf.startswith(b"%PDF-") or b"%%EOF" not in pdf[-1024:]):
        raise ValueError("Official-act reading copy is not a complete PDF")
    if hashlib.sha256(pdf).hexdigest() != pin["pdf_sha256"]:
        raise ValueError("Court reading copy SHA256 mismatch")
    return {"slug":slug, "case_number":number,
            "official_text_sha256":pin["full_text_sha256"],
            "pdf_sha256":pin["pdf_sha256"]}


def verify_court_release_delta(base,head,paths):
    if COURT_PATH not in paths:
        return []
    old = keyed_records(COURT_PATH, git_json(base,COURT_PATH,[]))
    new = keyed_records(COURT_PATH, git_json(head,COURT_PATH,[]))
    if set(old)-set(new):
        raise ValueError("Removing an already published official act is prohibited")
    for slug, row in old.items():
        if new.get(slug) != row:
            raise ValueError("Existing official court act immutable: "+slug)
    added = sorted(set(new)-set(old))
    if len(added) > 10:
        raise ValueError("Court daily release may add at most ten official originals")
    return [verify_official_court_release(new[slug]) for slug in added]


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
        # Original court judgments are individually SHA-pinned and are not
        # new author-written legal guidance. Their release is validated apart
        # from authored legal copy; never silently whitelist arbitrary cases.
        if path == COURT_PATH:
            verify_court_release_delta(base,head,changed_paths)
            continue
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
    for path in changed_paths:
        if path.startswith("apps/web/src/app/") and path.endswith((".ts",".tsx")):
            if path==PRIVATE_NAVIGATOR_PATH and private_new_route_only(path,reader(head,path)):
                continue
            raise ValueError("New public route or altered page/metadata requires source-checked release plan: "+path)


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
    check_new_public_routes(args.base,args.head,changed,lambda revision,path:
        subprocess.check_output(["git","show",f"{revision}:{path}"],text=True))
    block_unverified_template_edits(changed)
    changed_content=sorted(set(changed)&CONTENT_PATHS)
    manifest_path=Path(MANIFEST)
    # This additional check is unconditional even when only a new PDF or
    # court data has changed. It enforces the exact original court release.
    court_audit=verify_court_release_delta(args.base,args.head,changed)
    expected=expected_changes(args.base,args.head,changed)
    if expected and MANIFEST not in changed:
        raise ValueError("Authored publication text lacks new three-source evidence manifest")
    manifest=json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.exists() else {"version":1,"claims":[]}
    result=assess(expected,manifest)
    result["original_court_acts_checked"]=court_audit
    Path(args.output).parent.mkdir(parents=True,exist_ok=True)
    Path(args.output).write_text(json.dumps({
        **result,"changed_content_files":changed_content,
        "caveat":"Three observed official quotes are provenance; no automatic semantic equivalence or judicial review has been invented."
    },ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("THREE_SOURCE_PUBLICATION_GATE",result["status"],result["claims_verified"])

if __name__=="__main__":
    main()
