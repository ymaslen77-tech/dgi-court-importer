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
    return {"file":F,"slug":BASE["slug"],"block_index":1,
      "before":BASE["blocks"][1]["text"],"after":NEW["blocks"][1]["text"],
      "official_source_url":"https://publication.pravo.gov.ru/document/official-example",
      "official_source_excerpt":"Настоящий правовой акт содержит конкретные положения о действующих сроках и применяется к определённым отношениям.",
      "act_number_and_date":"Федеральный закон № 1-ФЗ от 01.01.2026",
      "effective_date":"2026-01-01","source_checked_at":NOW.isoformat(),
      "legal_reason_and_scope":"Корректировка только конкретного срока, установленного нормативным актом.",
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
        self.assertEqual(result["status"],"official_quote_verified")
        self.assertIn("not semantic legal approval",result["details"][0]["note"])
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
        rec=record();rec["source_checked_at"]=(NOW+dt.timedelta(days=2)).isoformat()
        with self.assertRaises(ValueError):
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
