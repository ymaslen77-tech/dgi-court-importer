"""Fail-closed unit tests. Fake URLs are fixtures, not verified legal facts."""
import datetime as dt
import subprocess
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from validate_three_source_publication import (
    assess, expected_changes, check_new_public_routes, block_unverified_template_edits, keyed_records, text_leaves
)

NOW=dt.datetime.now(dt.timezone.utc)
FILE="apps/web/src/data/housing-news.json"
FACT="Тестовое утверждение о вымышленном сообщении: не предназначено для публикации."
def fixture_sources():
    quote="Это искусственная тестовая выдержка из несуществующего документа, не подтверждающая никаких реальных юридических фактов."
    return [
        {"official_source_url":"https://publication.pravo.gov.ru/document/UNIT-TEST-ONLY",
         "official_source_excerpt":quote,"source_checked_at":NOW.isoformat()},
        {"official_source_url":"https://mos.ru/document/UNIT-TEST-ONLY",
         "official_source_excerpt":quote,"source_checked_at":NOW.isoformat()},
        {"official_source_url":"https://vsrf.ru/documents/all/UNIT-TEST-ONLY",
         "official_source_excerpt":quote,"source_checked_at":NOW.isoformat()},
    ]
def evidence(sources=None):
    return {"file":FILE,"record_id":"test-news","field":"title","exact_text":FACT,
        "same_legal_conclusion_checked":True,"same_period_and_scope_checked":True,
        "contradictions_checked":True,"unresolved_contradictions":[],
        "source_comparison_notes":"Unit test: check identical test fact, place, period and legal applicability across independent publications.",
        "sources":sources if sources is not None else fixture_sources()}
def source_fetch_ok(url,excerpt):
    return True,"mocked excerpt only"

class SourceGateTests(unittest.TestCase):
    def test_claim_requires_exact_field_coverage(self):
        with self.assertRaisesRegex(ValueError,"matching three-source"):
            assess([{"file":FILE,"record_id":"test-news","field":"title","exact_text":FACT}],
                   {"version":1,"claims":[]},fetcher=source_fetch_ok)
    def test_three_distinct_publishers_pass_provenance_only(self):
        record=evidence()
        result=assess([dict((k,record[k]) for k in ("file","record_id","field","exact_text"))],
                      {"version":1,"claims":[record]},fetcher=source_fetch_ok)
        self.assertEqual(result["claims_verified"],1)
        self.assertIn("not_semantic_legal_opinion",result["status"])
    def test_two_sources_are_rejected(self):
        record=evidence(fixture_sources()[:2])
        with self.assertRaisesRegex(ValueError,"three independent"):
            assess([dict((k,record[k]) for k in ("file","record_id","field","exact_text"))],
                   {"version":1,"claims":[record]},fetcher=source_fetch_ok)
    def test_subdomains_of_one_official_authority_do_not_count_twice(self):
        sources=fixture_sources()
        sources[1]["official_source_url"]="https://pravo.gov.ru/document/UNIT-TEST-ONLY"
        record=evidence(sources)
        with self.assertRaisesRegex(ValueError,"independence"):
            assess([dict((k,record[k]) for k in ("file","record_id","field","exact_text"))],
                   {"version":1,"claims":[record]},fetcher=source_fetch_ok)
    def test_unresolved_conflict_blocks(self):
        record=evidence();record["unresolved_contradictions"]=["Divergent rule"]
        with self.assertRaisesRegex(ValueError,"contradictions"):
            assess([dict((k,record[k]) for k in ("file","record_id","field","exact_text"))],
                   {"version":1,"claims":[record]},fetcher=source_fetch_ok)
    def test_invalid_source_excerpts_block(self):
        record=evidence()
        with self.assertRaisesRegex(ValueError,"Source"):
            assess([dict((k,record[k]) for k in ("file","record_id","field","exact_text"))],
                   {"version":1,"claims":[record]},fetcher=lambda u,q:(False,"Quote not observed"))
    def test_all_article_text_fields_must_be_checked(self):
        article={"slug":"test-news","title":FACT,"summary":"Вымышленный обзор, служащий только для проверки сопоставления полей.",
                 "sections":[{"heading":"Тестовый заголовок","paragraphs":["Вымышленное содержание только для тестирования."]}]}
        with patch("validate_three_source_publication.git_json",side_effect=lambda rev,p,default: [] if rev=="base" else [article]):
            changes=expected_changes("base","head",[FILE])
        fields={v["field"] for v in changes}
        self.assertEqual(fields,{"title","summary","sections.0.heading","sections.0.paragraphs.0"})
    def test_new_public_route_blocked_without_source_gate(self):
        name="apps/web/src/app/new-public-route/page.tsx"
        with patch("validate_three_source_publication.subprocess.check_output",
                   side_effect=subprocess.CalledProcessError(1,["git"])):
            with self.assertRaisesRegex(ValueError,"New public route"):
                check_new_public_routes("base","head",[name],lambda rev,path:
                    "export default function P(){return <p>Unverified public text</p>}")
    def test_new_preview_route_allowed_only_with_live_404_and_noindex(self):
        name="apps/web/src/app/navigator-dgi/page.tsx"
        content='if (siteIsLive) notFound(); robots: {index: false, follow: false};'
        with patch("validate_three_source_publication.subprocess.check_output",
                   side_effect=subprocess.CalledProcessError(1,["git"])):
            check_new_public_routes("base","head",[name],lambda rev,path:content)
    def test_existing_public_route_edit_cannot_bypass_claim_verification(self):
        name="apps/web/src/app/privatizaciya-zhilya/page.tsx"
        with self.assertRaisesRegex(ValueError,"altered page"):
            check_new_public_routes("base","head",[name],lambda rev,path:
                "export default function P(){return <p>Unverified legal rule</p>}")
    def test_arbitrary_new_private_route_not_allowlisted(self):
        name="apps/web/src/app/unreviewed-private/page.tsx"
        with self.assertRaisesRegex(ValueError,"New public route"):
            check_new_public_routes("base","head",[name],lambda rev,path:
                'if (siteIsLive) notFound(); robots: {index: false, follow: false};')
    def test_injected_legal_copy_in_non_template_component_fails_closed(self):
        with self.assertRaisesRegex(ValueError,"Runtime legal content"):
            block_unverified_template_edits(["apps/web/src/components/UnexpectedLawAdvice.tsx"])
    def test_removed_published_field_fails_closed(self):
        old={"slug":"test-news","title":FACT,"summary":"Previously published fact to remove"}
        new={"slug":"test-news","title":FACT}
        with patch("validate_three_source_publication.git_json",
                   side_effect=lambda rev,p,default: [old] if rev=="base" else [new]):
            with self.assertRaisesRegex(ValueError,"Removing previously published"):
                expected_changes("base","head",[FILE])
    def test_existing_court_official_full_text_cannot_be_silently_rewritten(self):
        path="apps/web/src/data/verified-court-static.json"
        old={"slug":"test-case","full_text":"Original official court text", "topic":"Test case"}
        new={"slug":"test-case","full_text":"Different court text", "topic":"Test case"}
        with patch("validate_three_source_publication.git_json",
                   side_effect=lambda rev,p,default: [old] if rev=="base" else [new]):
            with self.assertRaisesRegex(ValueError,"Replacing an original court act"):
                expected_changes("base","head",[path])
    def test_legal_generator_cannot_change_without_three_source_template_review(self):
        with self.assertRaisesRegex(ValueError,"Legal template edits"):
            block_unverified_template_edits(["apps/web/src/components/SpecializedDocumentBuilder.tsx"])
    def test_nonlegal_css_change_is_not_blocked(self):
        block_unverified_template_edits(["apps/web/src/app/globals.css"])
    def test_source_url_is_not_a_legal_claim_field(self):
        fields=dict(text_leaves({"slug":"slug","title":FACT,"sourceUrl":"https://mos.ru/path"}))
        self.assertEqual(fields,{"title":FACT})
    def test_empty_manifest_never_fake_claim_approval(self):
        result=assess([],{"version":1,"claims":[]},fetcher=source_fetch_ok)
        self.assertEqual(result["claims_verified"],0)
if __name__=="__main__":
    unittest.main()
