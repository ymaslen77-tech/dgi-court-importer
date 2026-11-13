#!/usr/bin/env python3
"""Fail-closed, claim-level three-source gate for DGI scenario pages and documents.

Publishes nothing. This validates a strictly structured JSON publication
dataset; all public text including SEO, branching labels and generated-document
clauses must have a matching field-level legal-evidence record with three
independent, fresh, live-verifiable official excerpts.

Research candidates never count as approvals. No self-certified legal opinion.
"""
import argparse
import datetime as dt
import json
import re
import subprocess
from pathlib import Path

from validate_three_source_publication import MANIFEST, assess
from validate_official_legal_changes import allowed_source

PUBLIC = "apps/web/src/data/dgi-verified-scenarios.json"
RESEARCH = "research/dgi-scenario-evidence-v1.json"
KNOWN_SCENARIOS = (
    "privatization-refusal",
    "housing-registration-removal",
    "dgi-no-response",
    "social-tenancy-dispute",
    "renovation-offer-disagreement",
)
KNOWN_PROCEDURES = (
    "privatization-service",
    "housing-registration",
    "59-fz-general-correspondence",
    "210-fz-public-service",
    "social-tenancy",
    "renovation-relocation",
)
KNOWN_FORMS = (
    "privatization-service-complaint", "housing-removal", "request",
    "service-complaint", "civil-objection", "renovation-comments",
)
TEXT_FIELDS = ("title", "summary", "seoTitle", "seoDescription")
RULE_FIELDS = ("text", "scopeNote", "exceptionNote")
SAFE_ID = re.compile(r"^[a-z][a-z0-9-]{1,79}$")


def expect_string(obj, key, minimum=1):
    value = obj.get(key)
    if not isinstance(value, str) or len(value.strip()) < minimum:
        raise ValueError("Missing or short field: " + key)
    if re.search(r"[<>]|\\$\\{|\\{\\{", value):
        raise ValueError("Executable or HTML-like public field: " + key)
    return value


def _validate_public_structure(data):
    if not isinstance(data, dict) or set(data) != {"version", "scenarios"}:
        raise ValueError("Scenario publication data must have only version/scenarios")
    if data["version"] != 1 or not isinstance(data["scenarios"], list):
        raise ValueError("Unsupported scenario publication version")
    if len(data["scenarios"]) > len(KNOWN_SCENARIOS):
        raise ValueError("Unknown or duplicated scenario count")
    expected = []
    seen = set()
    for s in data["scenarios"]:
        if not isinstance(s, dict) or set(s) != {
            "id", "procedure", "jurisdiction", "title", "summary", "seoTitle",
            "seoDescription", "questions", "rules", "generator"
        }:
            raise ValueError("Unknown public scenario object field")
        ident = s.get("id")
        if ident not in KNOWN_SCENARIOS or ident in seen:
            raise ValueError("Unknown or duplicate public scenario")
        seen.add(ident)
        procedure = s.get("procedure")
        if procedure not in KNOWN_PROCEDURES:
            raise ValueError("Unapproved public procedure class")
        if s.get("jurisdiction") != "Москва":
            raise ValueError("Moscow scenario jurisdiction may not be widened")
        if ident == "dgi-no-response" and procedure not in (
            "59-fz-general-correspondence", "210-fz-public-service"
        ):
            raise ValueError("Correspondence requires general-vs-service separation")
        for field in TEXT_FIELDS:
            value = expect_string(s, field, 12)
            expected.append({
                "file": PUBLIC, "record_id": ident, "field": field,
                "exact_text": value, "procedure": procedure,
            })
        questions = s["questions"]
        if not isinstance(questions, list) or not (1 <= len(questions) <= 15):
            raise ValueError("Public scenario questions must be explicit")
        qids = set()
        for i, q in enumerate(questions):
            if not isinstance(q, dict) or set(q) != {"id", "prompt", "options"}:
                raise ValueError("Unapproved public question structure")
            qid = q.get("id")
            if not isinstance(qid, str) or not SAFE_ID.fullmatch(qid) or qid in qids:
                raise ValueError("Duplicate/invalid question ID")
            qids.add(qid)
            expected.append({
                "file": PUBLIC, "record_id": ident,
                "field": f"questions.{i}.prompt",
                "exact_text": expect_string(q, "prompt", 12), "procedure": procedure
            })
            if (not isinstance(q["options"], list) or
                    not (2 <= len(q["options"]) <= 7) or
                    len(set(map(str,q["options"]))) != len(q["options"])):
                raise ValueError("Invalid question options")
            for j,option in enumerate(q["options"]):
                if not isinstance(option,str):
                    raise ValueError("Question option must be a string")
                expect_string({"value": option}, "value", 2)
                expected.append({
                    "file": PUBLIC, "record_id": ident,
                    "field": f"questions.{i}.options.{j}",
                    "exact_text": option, "procedure": procedure
                })
        rules = s["rules"]
        if not isinstance(rules, list) or not (1 <= len(rules) <= 20):
            raise ValueError("Public scenario must have checked legal rules")
        rule_ids = set()
        for i,rule in enumerate(rules):
            if not isinstance(rule,dict) or set(rule) != {
                "id", "text", "scopeNote", "exceptionNote", "procedure",
                "requiredAnswers"
            }:
                raise ValueError("Unknown rule field")
            rid = rule.get("id")
            if not isinstance(rid,str) or not SAFE_ID.fullmatch(rid) or rid in rule_ids:
                raise ValueError("Invalid/duplicate rule ID")
            rule_ids.add(rid)
            if rule["procedure"] != procedure:
                raise ValueError("Rule procedure cannot differ from scenario")
            if not isinstance(rule["requiredAnswers"],dict) or not rule["requiredAnswers"]:
                raise ValueError("Legal rule cannot fire unconditionally")
            for key,value in rule["requiredAnswers"].items():
                if key not in qids or not isinstance(value,str):
                    raise ValueError("Rule must reference a typed question answer")
                question = next(q for q in questions if q["id"] == key)
                if value not in question["options"]:
                    raise ValueError("Unknown question answer gates a legal rule")
            for field in RULE_FIELDS:
                expected.append({
                    "file": PUBLIC, "record_id": ident,
                    "field": f"rules.{i}.{field}",
                    "exact_text": expect_string(rule, field, 15),
                    "procedure": procedure
                })
        gen = s["generator"]
        if not isinstance(gen,dict) or set(gen) != {"kind", "title", "clauses", "scopeNote"}:
            raise ValueError("Unknown generator structure")
        if gen["kind"] not in KNOWN_FORMS:
            raise ValueError("Unknown existing document builder")
        clauses = gen["clauses"]
        if not isinstance(clauses,list) or not (1 <= len(clauses) <= 20):
            raise ValueError("Every public generator clause requires source evidence")
        for field in ("title","scopeNote"):
            expected.append({
                "file": PUBLIC, "record_id": ident,
                "field": "generator."+field,
                "exact_text": expect_string(gen,field,12),
                "procedure":procedure
            })
        for i,clause in enumerate(clauses):
            if not isinstance(clause,dict) or set(clause) != {"ruleId","text"}:
                raise ValueError("Only source-backed document clauses are allowed")
            if clause["ruleId"] not in rule_ids:
                raise ValueError("Generator clause has no corresponding verified rule")
            expected.append({
                "file": PUBLIC, "record_id": ident,
                "field": f"generator.clauses.{i}.text",
                "exact_text": expect_string(clause,"text",20),
                "procedure":procedure
            })
    return expected


def validate_research_matrix(data):
    if not isinstance(data,dict) or set(data) != {"version","scenarios"} or data["version"] != 1:
        raise ValueError("Research matrix schema/version mismatch")
    rows=data["scenarios"]
    if not isinstance(rows,list) or len(rows)!=len(KNOWN_SCENARIOS):
        raise ValueError("Research matrix must enumerate all five scenarios")
    ids=set()
    for row in rows:
        if not isinstance(row,dict) or set(row) != {
            "id", "title", "publication_status", "existing_form_kind",
            "procedure_questions", "claims"
        }:
            raise ValueError("Unrecognized research matrix fields")
        ident=row["id"]
        if ident not in KNOWN_SCENARIOS or ident in ids:
            raise ValueError("Unexpected/duplicate research scenario")
        ids.add(ident)
        expect_string(row,"title",5)
        if row["publication_status"]!="research_only":
            raise ValueError("Research matrix may not grant legal approval")
        if row["existing_form_kind"] not in KNOWN_FORMS:
            raise ValueError("Unknown existing draft form")
        questions=row["procedure_questions"]
        if not isinstance(questions,list) or not questions:
            raise ValueError("Research scenario lacks procedure distinguishing questions")
        for q in questions:
            if not isinstance(q,str) or len(q)<10:
                raise ValueError("Research question malformed")
        if not isinstance(row["claims"],list):
            raise ValueError("Research claim candidates must be a list")
        for claim in row["claims"]:
            if not isinstance(claim,dict) or set(claim) != {
                "id","text","procedure","publication_status",
                "scope_note","exclusions","source_candidates"
            }:
                raise ValueError("Malformed research-only claim")
            if not SAFE_ID.fullmatch(claim["id"]):
                raise ValueError("Malformed research claim ID")
            expect_string(claim,"text",25)
            if claim["procedure"] not in KNOWN_PROCEDURES:
                raise ValueError("Research claim missing typed procedure")
            if claim["publication_status"]!="research_only":
                raise ValueError("Research source candidates cannot auto-publish")
            expect_string(claim,"scope_note",25)
            expect_string(claim,"exclusions",25)
            if not isinstance(claim["source_candidates"],list):
                raise ValueError("Invalid official source candidates")
            for url in claim["source_candidates"]:
                if not isinstance(url,str) or not allowed_source(url):
                    raise ValueError("Invalid official research URL")
    return {v["id"] for v in rows}


def _check_evidence_metadata(evidence, expected, now):
    for item in expected:
        row = evidence[(item["file"],item["record_id"],item["field"],item["exact_text"])]
        if row.get("procedure") != item["procedure"] or row.get("jurisdiction") != "Москва":
            raise ValueError("Claim procedure/jurisdiction differs from rendered field")
        for field in ("act_number_and_date","legal_reason_and_scope"):
            if not isinstance(row.get(field),str) or len(row[field].strip()) < 16:
                raise ValueError("Missing act identity and legal application explanation")
        try:
            start = dt.date.fromisoformat(row["effective_date"])
        except (TypeError,ValueError,KeyError):
            raise ValueError("Invalid effective date")
        if start > now.date():
            raise ValueError("Future law not effective")
        if row.get("amendment_history_checked") is not True or row.get("transitional_rules_checked") is not True:
            raise ValueError("Act version or transitional law not reviewed")
        if item["procedure"] == "59-fz-general-correspondence" and (
            row.get("special_public_services_excluded") is not True
        ):
            raise ValueError("59-FZ general rule cannot assert a public-service complaint deadline")


def validate(public, research, manifest, fetcher=None, now=None):
    now=now or dt.datetime.now(dt.timezone.utc)
    validate_research_matrix(research)
    expected=_validate_public_structure(public)
    if not isinstance(manifest,dict) or manifest.get("version") != 1 or not isinstance(manifest.get("claims"),list):
        raise ValueError("Legal evidence manifest malformed")
    claims=[c for c in manifest["claims"] if isinstance(c,dict) and c.get("file")==PUBLIC]
    index={}
    for row in claims:
        key=(row.get("file"),row.get("record_id"),row.get("field"),row.get("exact_text"))
        if key in index:
            raise ValueError("Duplicate scenario evidence")
        index[key]=row
    exact={(v["file"],v["record_id"],v["field"],v["exact_text"]) for v in expected}
    if set(index) != exact:
        raise ValueError("Public scenario fields must have exact and complete three-source evidence")
    _check_evidence_metadata(index, expected, now)
    # Existing official-source validator verifies fresh (<7d) live HTML excerpts,
    # three distinct official publishers and manually reconciled scope/meaning.
    # The reporting status is provenance, not a fabricated legal opinion.
    report=assess(
        [{k:v[k] for k in ("file","record_id","field","exact_text")} for v in expected],
        {"version":1,"claims":claims},
        fetcher=fetcher
    )
    return {
        "status":"publication_evidence_passed" if expected else "research_only_no_public_claims",
        "published_scenarios":len(public["scenarios"]),
        "public_text_fields_checked":len(expected),
        "official_sources":report["details"],
        "research_scenarios":len(research["scenarios"]),
        "caveat":"Three independent official quotations are provenance; validate legal meaning/scope and current version before asserting outcomes."
    }



def build_verified_document_plan(public, research, manifest, scenario_id, answers, fetcher=None):
    """Return only verified matching clauses, never decide an unverified remedy.

    The gate is repeated *before* building any payload; a caller may not pass a
    cached 'verified' status or a bare claim ID as a substitute for current
    official sources. No personal data, file output or network submission is
    performed; the result is an in-memory structured plan.
    """
    checked=validate(public,research,manifest,fetcher=fetcher)
    if checked["status"]!="publication_evidence_passed":
        raise ValueError("No published source-verified legal scenarios")
    if not isinstance(answers,dict):
        raise ValueError("Answers must be a typed mapping")
    scenario=next((s for s in public["scenarios"] if s["id"]==scenario_id),None)
    if not scenario:
        raise ValueError("Unknown or unverified scenario")
    questions={q["id"]:q for q in scenario["questions"]}
    if set(answers)-set(questions):
        raise ValueError("An answer references an unknown question")
    for qid,choice in answers.items():
        if not isinstance(choice,str) or choice not in questions[qid]["options"]:
            raise ValueError("Unexpected answer option")
    matched=[
        rule for rule in scenario["rules"]
        if all(answers.get(qid)==choice for qid,choice in rule["requiredAnswers"].items())
    ]
    if not matched:
        return {"scenario_id":scenario_id, "can_generate":False,
                "matched_rule_ids":[], "clauses":[]}
    matched_ids={rule["id"] for rule in matched}
    clauses=[
        {"rule_id":c["ruleId"],"text":c["text"]}
        for c in scenario["generator"]["clauses"]
        if c["ruleId"] in matched_ids
    ]
    # A generic header alone must not masquerade as a valid legal document.
    if not clauses:
        return {"scenario_id":scenario_id, "can_generate":False,
                "matched_rule_ids":sorted(matched_ids), "clauses":[]}
    return {
        "scenario_id":scenario_id,"can_generate":True,
        "generator_kind":scenario["generator"]["kind"],
        "title":scenario["generator"]["title"],
        "scope_note":scenario["generator"]["scopeNote"],
        "matched_rule_ids":sorted(matched_ids),"clauses":clauses,
    }

def _load(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--public", default=PUBLIC)
    parser.add_argument("--research", default=RESEARCH)
    parser.add_argument("--manifest", default=MANIFEST)
    parser.add_argument("--output",default="test-results/dgi-scenario-evidence.json")
    args=parser.parse_args()
    result=validate(_load(args.public),_load(args.research),_load(args.manifest))
    outfile=Path(args.output)
    outfile.parent.mkdir(parents=True,exist_ok=True)
    outfile.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\\n",encoding="utf-8")
    print("DGI_SCENARIO_EVIDENCE",result["status"],
          result["published_scenarios"],result["public_text_fields_checked"])


if __name__=="__main__":
    main()
