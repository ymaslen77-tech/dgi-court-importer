"""Safety checks for official-only legal evidence verification."""
import datetime as dt
import sys
import unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from validate_official_legal_changes import (allowed_source,legal_diffs,assess,
                                              official_excerpt_visible)
NOW=dt.datetime.now(dt.timezone.utc)
BASE={"slug":"privatizaciya-zhilya","title":"Юридическая информация","blocks":[
    {"kind":"h1","text":"Приватизация жилья"},
    {"kind":"p","text":"Срок ранее указан здесь и требует актуализации по закону."}]}
NEW={"slug":"privatizaciya-zhilya","title":"Юридическая информация","blocks":[
    {"kind":"h1","text":"Приватизация жилья"},
    {"kind":"p","text":"Срок изменён на основании официально опубликованного действующего акта."}]}
F="apps/web/src/data/pages-0.json"
def record():
    # Synthetic URLs/excerpts are unit-test fixtures, NEVER real legal evidence.
    sources=[]
    for host in ("publication.pravo.gov.ru","mos.ru","vsrf.ru"):
        sources.append({
            "official_source_url":f"https://{host}/document/placeholder-for-unit-test",
            "official_source_excerpt":"Этот искусственный фрагмент проверяет только работу тестового механизма сверки источников без подтверждения реального закона.",
            "source_checked_at":NOW.isoformat()
        })
    return {"file":F,"slug":BASE["slug"],"block_index":1,
      "before":BASE["blocks"][1]["text"],"after":NEW["blocks"][1]["text"],
      "sources":sources,
      "source_agreement_checked":True,
      "contradictions_checked":True,
      "source_comparison_notes":"Test fixture: three independent publications must be compared for the same legal proposition, jurisdiction and time.",
      "act_number_and_date":"TEST_FIXTURE_NO_REAL_LAW",
      "effective_date":"2026-01-01",
      "legal_reason_and_scope":"Test-only scope and source comparison; not a legal assertion.",
      "transitional_rules_checked":True,"amendment_history_checked":True}


def source_ok(url,excerpt):return True,"verified"

class VerificationTests(unittest.TestCase):
    def test_official_subdomains_allowed(self):
        self.assertTrue(allowed_source("https://publication.pravo.gov.ru/document/a"))
        self.assertTrue(allowed_source("https://zakon.mos.ru/legal/a"))
    def test_fake_mirror_not_allowed(self):
        self.assertFalse(allowed_source("https://pravo.gov.ru.attacker.com/a"))
        self.assertFalse(allowed_source("http://pravo.gov.ru/a"))
        self.assertFalse(allowed_source("https://pravo.gov.ru/"))
    def test_change_cannot_modify_slug_or_metadata(self):
        modified={**NEW,"title":"Изменено без основания"}
        with self.assertRaises(ValueError):
            legal_diffs([BASE],[modified],F)
    def test_each_changed_claim_is_recorded(self):
        self.assertEqual(len(legal_diffs([BASE],[NEW],F)),1)
    @patch("validate_official_legal_changes.git_json")
    def test_valid_evidence_is_only_candidate_not_semantic_approval(self,git):
        git.side_effect=lambda rev,path:[BASE] if rev=="base" else [NEW]
        result=assess("base","head",[F,"legal-evidence/changes.json"],{"version":1,"changes":[record()]},fetcher=source_ok)
        self.assertEqual(result["status"],"three_independent_official_excerpts_verified")
        self.assertIn("separate expert judgement",result["details"][0]["note"])
    @patch("validate_official_legal_changes.git_json")
    def test_missing_evidence_refused(self,git):
        git.side_effect=lambda rev,path:[BASE] if rev=="base" else [NEW]
        with self.assertRaises(ValueError):
            assess("base","head",[F],{"version":1,"changes":[record()]},fetcher=source_ok)
    @patch("validate_official_legal_changes.git_json")
    def test_no_real_source_refused(self,git):
        git.side_effect=lambda rev,path:[BASE] if rev=="base" else [NEW]
        with self.assertRaises(ValueError):
            assess("base","head",[F,"legal-evidence/changes.json"],{"version":1,"changes":[record()]},
                   fetcher=lambda a,b:(False,"not observable"))
    @patch("validate_official_legal_changes.git_json")
    def test_source_checked_in_future_refused(self,git):
        git.side_effect=lambda rev,path:[BASE] if rev=="base" else [NEW]
        rec=record();rec["sources"][0]["source_checked_at"]=(NOW+dt.timedelta(days=2)).isoformat()
        with self.assertRaises(ValueError):
            assess("base","head",[F,"legal-evidence/changes.json"],{"version":1,"changes":[rec]},fetcher=source_ok)
    @patch("validate_official_legal_changes.git_json")
    def test_two_sources_not_sufficient(self,git):
        git.side_effect=lambda rev,path:[BASE] if rev=="base" else [NEW]
        rec=record();rec["sources"]=rec["sources"][:2]
        with self.assertRaisesRegex(ValueError,"three independent"):
            assess("base","head",[F,"legal-evidence/changes.json"],{"version":1,"changes":[rec]},fetcher=source_ok)
    @patch("validate_official_legal_changes.git_json")
    def test_same_official_authority_mirrors_not_independent(self,git):
        git.side_effect=lambda rev,path:[BASE] if rev=="base" else [NEW]
        rec=record();rec["sources"][1]["official_source_url"]="https://pravo.gov.ru/another/test-document"
        with self.assertRaisesRegex(ValueError,"independence"):
            assess("base","head",[F,"legal-evidence/changes.json"],{"version":1,"changes":[rec]},fetcher=source_ok)
    @patch("validate_official_legal_changes.git_json")
    def test_disagreement_prevents_automatic_release(self,git):
        git.side_effect=lambda rev,path:[BASE] if rev=="base" else [NEW]
        rec=record();rec["source_agreement_checked"]=False
        with self.assertRaisesRegex(ValueError,"disagreement"):
            assess("base","head",[F,"legal-evidence/changes.json"],{"version":1,"changes":[rec]},fetcher=source_ok)
    @patch("validate_official_legal_changes.git_json")
    def test_future_law_as_current_refused(self,git):
        git.side_effect=lambda rev,path:[BASE] if rev=="base" else [NEW]
        rec=record();rec["effective_date"]="2099-01-01"
        with self.assertRaises(ValueError):
            assess("base","head",[F,"legal-evidence/changes.json"],{"version":1,"changes":[rec]},fetcher=source_ok)
    @patch("validate_official_legal_changes.git_json")
    def test_undocumented_second_change_refused(self,git):
        n={**NEW,"blocks":[*NEW["blocks"],{"kind":"p","text":"Новая инструкция"}]}
        git.side_effect=lambda rev,path:[BASE] if rev=="base" else [n]
        with self.assertRaises(ValueError):
            assess("base","head",[F,"legal-evidence/changes.json"],{"version":1,"changes":[record()]},fetcher=source_ok)
    @patch("validate_official_legal_changes.git_json")
    def test_unauthorized_mix_with_code_rejected(self,git):
        with self.assertRaises(ValueError):
            assess("base","head",[F,"legal-evidence/changes.json","apps/web/src/app/page.tsx"],
                   {"version":1,"changes":[record()]},fetcher=source_ok)
if __name__=="__main__":
    unittest.main()
