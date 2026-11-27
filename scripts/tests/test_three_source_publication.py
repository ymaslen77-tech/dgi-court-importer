"""Fail-closed unit tests. Fake URLs are fixtures, not verified legal facts."""
import datetime as dt
import hashlib
import json
import subprocess
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from validate_three_source_publication import (
    assess, expected_changes, check_new_public_routes, block_unverified_template_edits, keyed_records, text_leaves,
    COURT_PRIMARY_RELEASE, COURT_NEUTRAL_TEXT, verify_official_court_release, verify_court_release_delta,
    FACT_NEWS_SLUG, FACT_NEWS_PATH, verify_fixed_factual_announcement, verified_factual_news_delta
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
            with self.assertRaisesRegex(ValueError,"Existing official court act immutable"):
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

    def court_release_fixture(self):
        slug="2kas-88-3602-2026-2026-02-10"
        pin=dict(COURT_PRIMARY_RELEASE[slug])
        text=("Дело № 88-3602/2026\nОПРЕДЕЛЕНИЕ\n10 февраля 2026 года г. Москва\n"
              "ФИО1 обратился в суд к Департаменту городского имущества Москвы.\n"+
              "Установлены обстоятельства, исследованы материалы, заслушаны объяснения сторон. "*70)
        pdf=b"%PDF-1.4\n/Type /Page\n"+b"x"*13000+b"\n%%EOF"
        pin["full_text_sha256"]=hashlib.sha256(text.encode("utf-8")).hexdigest()
        pin["pdf_sha256"]=hashlib.sha256(pdf).hexdigest()
        row={
            "slug":slug, **pin, **COURT_NEUTRAL_TEXT,
            "official_pdf_url":pin["official_url"],
            "full_text":text, "pdf_origin":"site_rendered_copy",
            "source_checked":True, "privacy_screen_passed":True,
        }
        return row,{slug:pin},pdf

    def test_exact_pinned_original_is_source_checked_not_a_new_legal_rule(self):
        row,pins,pdf=self.court_release_fixture()
        proof=verify_official_court_release(row,approvals=pins,pdf_reader=lambda path:pdf)
        self.assertEqual(proof["case_number"],"88-3602/2026")
        self.assertEqual(proof["pdf_sha256"],pins[row["slug"]]["pdf_sha256"])

    def test_unreviewed_original_cannot_publish(self):
        row,pins,pdf=self.court_release_fixture()
        row["slug"]="2kas-88-24964-2025-2025-11-06"
        with self.assertRaisesRegex(ValueError,"no individually reviewed"):
            verify_official_court_release(row,approvals=pins,pdf_reader=lambda path:pdf)

    def test_editorial_claim_cannot_be_added_to_court_record(self):
        row,pins,pdf=self.court_release_fixture()
        row["legal_conclusion"]="Право собственности гарантировано."
        with self.assertRaisesRegex(ValueError,"exact source-only record schema"):
            verify_official_court_release(row,approvals=pins,pdf_reader=lambda path:pdf)

    def test_court_outcome_cannot_be_invented(self):
        row,pins,pdf=self.court_release_fixture()
        row["outcome_verified"]="applicant_granted"
        with self.assertRaisesRegex(ValueError,"neutral metadata"):
            verify_official_court_release(row,approvals=pins,pdf_reader=lambda path:pdf)

    def test_full_judgment_source_sha_is_immutable(self):
        row,pins,pdf=self.court_release_fixture()
        row["full_text"]+="\\nНе подтвержденное утверждение."
        with self.assertRaisesRegex(ValueError,"SHA256"):
            verify_official_court_release(row,approvals=pins,pdf_reader=lambda path:pdf)

    def test_pdf_copy_cannot_change_independently_of_manifest(self):
        row,pins,pdf=self.court_release_fixture()
        corrupted=pdf[:-10]+b"tamper"+pdf[-10:]
        with self.assertRaisesRegex(ValueError,"SHA256"):
            verify_official_court_release(row,approvals=pins,pdf_reader=lambda path:corrupted)

    def test_pdf_copy_cannot_be_missing_or_incomplete(self):
        row,pins,pdf=self.court_release_fixture()
        with self.assertRaisesRegex(ValueError,"PDF"):
            verify_official_court_release(row,approvals=pins,pdf_reader=lambda path:b"%PDF-1.4\\n%%EOF")

    def test_sensitive_data_flags_cannot_be_forged_or_dropped(self):
        row,pins,pdf=self.court_release_fixture()
        row["privacy_screen_passed"]=False
        with self.assertRaisesRegex(ValueError,"privacy provenance"):
            verify_official_court_release(row,approvals=pins,pdf_reader=lambda path:pdf)

    def test_unverified_original_url_change_is_rejected(self):
        row,pins,pdf=self.court_release_fixture()
        row["official_url"]="https://fakesud.invalid/act"
        with self.assertRaisesRegex(ValueError,"source identity"):
            verify_official_court_release(row,approvals=pins,pdf_reader=lambda path:pdf)

    def test_court_original_metadata_date_cannot_change(self):
        row,pins,pdf=self.court_release_fixture()
        row["decision_date"]="2026-02-11"
        with self.assertRaisesRegex(ValueError,"source identity"):
            verify_official_court_release(row,approvals=pins,pdf_reader=lambda path:pdf)

    def test_existing_judgment_cannot_be_modified_in_place(self):
        row,pins,pdf=self.court_release_fixture()
        edited=dict(row);edited["pdf_sha256"]="0"*64
        path="apps/web/src/data/verified-court-static.json"
        with patch("validate_three_source_publication.git_json",
                   side_effect=lambda rev,p,default: [row] if rev=="base" else [edited]):
            with self.assertRaisesRegex(ValueError,"Existing official court act immutable"):
                verify_court_release_delta("base","head",[path])

    def test_pin_must_still_require_the_actual_pdf(self):
        row,pins,pdf=self.court_release_fixture()
        with self.assertRaisesRegex(ValueError,"PDF copy missing"):
            verify_official_court_release(row,approvals=pins,
                                          pdf_reader=lambda path: (_ for _ in ()).throw(FileNotFoundError("missing")))


    def factual_news_fixture(self):
        return json.loads(Path("research/dgi-source-bound-news-2026-11-27.json").read_text(
            encoding="utf-8"))["article"]

    def test_exact_fact_only_ministry_report_can_pass_source_bound_contract(self):
        news=self.factual_news_fixture()
        proof=verify_fixed_factual_announcement(news)
        self.assertEqual(proof["slug"],FACT_NEWS_SLUG)
        self.assertIn("not_legal_advice",proof["status"])

    def test_changed_factual_article_is_not_individually_approved(self):
        news=self.factual_news_fixture()
        news["summary"]="Подмененный текст о якобы предоставленном жилье всем гражданам."
        with self.assertRaisesRegex(ValueError,"differs from source-bound"):
            verify_fixed_factual_announcement(news)

    def test_an_extra_new_legal_rule_cannot_hide_inside_article(self):
        news=self.factual_news_fixture()
        news["sections"][0]["paragraphs"][0]+=" Теперь обязаны оплатить специальную госпошлину."
        with self.assertRaisesRegex(ValueError,"differs from source-bound"):
            verify_fixed_factual_announcement(news)

    def test_invalid_factual_ministry_contract_blob_is_rejected(self):
        news=self.factual_news_fixture()
        with self.assertRaisesRegex(ValueError,"contract has changed"):
            verify_fixed_factual_announcement(news,contract_reader=lambda path:b'{"version":1}')

    def test_change_in_factual_source_url_cannot_pass(self):
        news=self.factual_news_fixture()
        news["sourceUrl"]="https://example.com/fabricated"
        with self.assertRaisesRegex(ValueError,"differs from source-bound"):
            verify_fixed_factual_announcement(news)

    def test_one_new_original_fact_only_report_is_exempt_from_legal_claims(self):
        row=self.factual_news_fixture()
        with patch("validate_three_source_publication.git_json",
                   side_effect=lambda rev,path,default:[] if rev=="base" else [row]):
            changes=expected_changes("base","head",[FACT_NEWS_PATH])
        self.assertEqual(changes,[])

    def test_an_unreviewed_news_slug_still_requires_three_source_coverage(self):
        row=self.factual_news_fixture()
        row["slug"]="unverified-news-different-article"
        with patch("validate_three_source_publication.git_json",
                   side_effect=lambda rev,path,default:[] if rev=="base" else [row]):
            changes=expected_changes("base","head",[FACT_NEWS_PATH])
        self.assertIn("title",[x["field"] for x in changes])
        with self.assertRaisesRegex(ValueError,"matching three-source proof"):
            assess(changes,{"version":1,"claims":[]},fetcher=source_fetch_ok)

if __name__=="__main__":
    unittest.main()
