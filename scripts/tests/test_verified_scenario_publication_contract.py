"""Adversarial validation of real source-locked scenario renderer and manifest.

Mocking applies ONLY to the *legal network verifier* in this unit suite.
The independent official-source job always checks the actual live sources.
"""
import json
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from validate_three_source_publication import (
    VERIFIED_SCENARIO_CODE_BLOBS, VERIFIED_SCENARIO_PUBLIC,
    MANIFEST, check_new_public_routes, content_blob_sha,
    block_unverified_template_edits,
)
from verify_dgi_scenario_evidence import validate

ROOT=Path(__file__).resolve().parents[2]
ROUTE="apps/web/src/app/situatsii/[scenarioId]/page.tsx"
COMPONENT="apps/web/src/components/VerifiedScenarioIntake.tsx"
SCENARIO_RESEARCH="research/dgi-scenario-evidence-v1.json"

def read_actual(_,path):
    return (ROOT/path).read_text(encoding="utf-8")

def synthetic_verified(*args,**kwargs):
    return {"status":"publication_evidence_passed"}

class SourceLockedVerifiedScenarioTests(unittest.TestCase):
    def setUp(self):
        self.original={}
        for p in (*VERIFIED_SCENARIO_CODE_BLOBS,VERIFIED_SCENARIO_PUBLIC,
                  SCENARIO_RESEARCH,MANIFEST):
            self.original[p]=read_actual("HEAD",p)
        self.mutated=dict(self.original)

    def reader(self,revision,path):
        return self.mutated.get(path,read_actual(revision,path))

    def verify(self,paths):
        with patch("verify_dgi_scenario_evidence.validate",synthetic_verified):
            return check_new_public_routes("base","HEAD",paths,self.reader)

    def test_real_route_and_intake_match_pinned_git_source_hashes(self):
        for path,digest in VERIFIED_SCENARIO_CODE_BLOBS.items():
            self.assertEqual(content_blob_sha(self.original[path]),digest)

    def test_new_route_and_client_are_approved_only_as_a_locked_pair(self):
        approved=self.verify([ROUTE,COMPONENT,VERIFIED_SCENARIO_PUBLIC,MANIFEST])
        self.assertEqual(approved,{ROUTE,COMPONENT})
        block_unverified_template_edits([p for p in [ROUTE,COMPONENT] if p not in approved])

    def test_injected_new_legal_sentence_into_page_fails(self):
        self.mutated[ROUTE]+="\nexport const unsupportedCourtAdvice='Иск удовлетворяется всегда';"
        with self.assertRaisesRegex(ValueError,"Unreviewed React"):
            self.verify([ROUTE])

    def test_new_dynamic_client_branch_fails(self):
        self.mutated[COMPONENT]+="\n// Hidden condition about a procedural deadline"
        with self.assertRaisesRegex(ValueError,"Unreviewed React"):
            self.verify([COMPONENT])

    def test_changed_official_source_link_fails(self):
        self.mutated[ROUTE]=self.original[ROUTE].replace(
            "https://mintrud.gov.ru/docs/laws/108",
            "https://example.invalid/replacement"
        )
        with self.assertRaisesRegex(ValueError,"Unreviewed React"):
            self.verify([ROUTE])

    def test_changed_seo_or_answer_data_reenters_claim_verifier(self):
        def reject(*args,**kwargs):
            raise ValueError("Every changed legal and SEO field needs three official sources")
        with patch("verify_dgi_scenario_evidence.validate",reject):
            with self.assertRaisesRegex(ValueError,"Source-verified scenario publication failed"):
                check_new_public_routes("base","HEAD",[VERIFIED_SCENARIO_PUBLIC],self.reader)

    def test_manifest_revocation_is_not_silently_ignored(self):
        def reject(*args,**kwargs):
            raise ValueError("Missing original official quote")
        with patch("verify_dgi_scenario_evidence.validate",reject):
            with self.assertRaisesRegex(ValueError,"Source-verified scenario publication failed"):
                check_new_public_routes("base","HEAD",[MANIFEST],self.reader)

    def test_no_unlocked_react_component_in_publication(self):
        with self.assertRaisesRegex(ValueError,"Runtime legal content"):
            block_unverified_template_edits(["apps/web/src/components/UnreviewedAdviser.tsx"])

    def test_no_unreviewed_public_route_sneaks_around_pin(self):
        path="apps/web/src/app/situatsii/unsourced/page.tsx"
        self.mutated[path]="export default function Page(){return <p>Unverified legal advice</p>}"
        with self.assertRaisesRegex(ValueError,"New public route"):
            self.verify([path])

    def test_stored_verification_records_alone_do_not_trust_source_changes(self):
        self.mutated[COMPONENT]=self.original[COMPONENT].replace(
            "setDraft", "setAutoGuaranteedCourtOutcome"
        )
        with self.assertRaisesRegex(ValueError,"Unreviewed React"):
            self.verify([COMPONENT])


if __name__=="__main__":
    unittest.main()
