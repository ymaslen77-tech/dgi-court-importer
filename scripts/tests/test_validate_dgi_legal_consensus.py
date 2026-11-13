"""Three-source legal consensus: adversarial synthetic tests without network."""
import copy
import json
import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from validate_dgi_legal_consensus import verify

def fixture():
    return json.loads(Path("research/dgi-59fz-30day-consensus.json").read_text("utf-8"))
def observed(_url,_excerpt):
    return True,"synthetic fetched HTML"
class ConsensusTests(unittest.TestCase):
    def setUp(self):
        self.data=fixture()
    def check(self):
        return verify(self.data,fetcher=observed)
    def test_three_independent_excerpts_with_matching_atomic_rule_pass(self):
        result=self.check()
        self.assertEqual(result["independent_publishers"],3)
        self.assertEqual(result["numeric_days"],30)
        self.assertEqual(result["publication_status"],"research_only")
    def test_same_publisher_other_subdomain_does_not_count(self):
        self.data["claims"][0]["sources"][2]["official_source_url"]="https://other.nalog.gov.ru/rn77/faq"
        with self.assertRaisesRegex(ValueError,"publisher"):
            self.check()
    def test_60_days_in_one_source_rejected(self):
        self.data["claims"][0]["sources"][1]["official_source_excerpt"]=self.data["claims"][0]["sources"][1]["official_source_excerpt"].replace("30 дней","60 дней")
        with self.assertRaisesRegex(ValueError,"does not independently"):
            self.check()
    def test_from_sending_instead_of_registration_rejected(self):
        self.data["claims"][0]["sources"][0]["official_source_excerpt"]=self.data["claims"][0]["sources"][0]["official_source_excerpt"].replace("со дня регистрации","со дня отправки")
        with self.assertRaisesRegex(ValueError,"does not independently"):
            self.check()
    def test_unknown_legal_procedure_is_rejected(self):
        self.data["claims"][0]["procedure"]="210-fz-public-service"
        with self.assertRaisesRegex(ValueError,"cannot expand its scope"):
            self.check()
    def test_excluding_public_services_is_mandatory(self):
        self.data["claims"][0]["exclusions"]=["Иное","Судебные дела","Специальные процедуры","Абстрактное"]
        with self.assertRaisesRegex(ValueError,"exclusions missing"):
            self.check()
    def test_actual_source_quote_must_be_live_retrievable(self):
        with self.assertRaisesRegex(ValueError,"Official excerpt mismatch"):
            verify(self.data,fetcher=lambda url,excerpt:(False,"HTTP 503"))
    def test_cannot_forge_prior_approval_status(self):
        self.data["claims"][0]["publication_status"]="approved"
        with self.assertRaisesRegex(ValueError,"cannot expand"):
            self.check()
    def test_missing_publisher_fails(self):
        self.data["claims"][0]["sources"].pop()
        with self.assertRaisesRegex(ValueError,"exactly three"):
            self.check()
    def test_non_official_domain_fails(self):
        self.data["claims"][0]["sources"][2]["official_source_url"]="https://example.com/fake"
        with self.assertRaisesRegex(ValueError,"publisher duplicated or unverifiable"):
            self.check()
    def test_unexpected_dynamic_field_fails(self):
        self.data["claims"][0]["sources"][0]["override"]="unverified"
        with self.assertRaisesRegex(ValueError,"Invalid source"):
            self.check()
    def test_same_publisher_alternate_can_rescue_transient_http_error(self):
        primary=self.data["claims"][0]["sources"][2]["official_source_url"]
        result=verify(self.data,fetcher=lambda url,excerpt:
            (False,"unavailable/unverifiable: HTTPError") if url==primary else (True,"synthetic"))
        self.assertEqual(result["independent_publishers"],3)
        self.assertEqual(result["sources"][2]["used_alternate"],True)
        self.assertEqual(result["sources"][2]["publisher"],"mos.ru")
    def test_alternate_from_fourth_authority_cannot_replace_moscow(self):
        self.data["claims"][0]["sources"][2]["alternates"][0]["official_source_url"] = "https://epp.genproc.gov.ru/ru/proc_63/activity/legal-education/explain/e8341917/"
        with self.assertRaisesRegex(ValueError,"same official publisher"):
            verify(self.data,fetcher=lambda url,excerpt:(False,"unavailable/unverifiable: HTTPError"))
    def test_fallback_quote_cannot_change_deadline_to_sixty_days(self):
        alternate=self.data["claims"][0]["sources"][2]["alternates"][0]
        alternate["official_source_excerpt"]=alternate["official_source_excerpt"].replace("30 дней","60 дней")
        with self.assertRaisesRegex(ValueError,"does not independently"):
            self.check()
    def test_temporary_official_outage_only_blocks_this_claim(self):
        report=verify(self.data,fetcher=lambda url,excerpt:
            (False,"Official source unavailable/unverifiable: URLError"))
        self.assertEqual(report["status"],"research_only_source_temporarily_unavailable")
        self.assertEqual(report["independent_publishers"],0)
    def test_wrong_official_excerpt_still_fails_hard(self):
        with self.assertRaisesRegex(ValueError,"Official excerpt mismatch"):
            verify(self.data,fetcher=lambda url,excerpt:
                (False,"Exact quoted excerpt not visible in fetched official source"))
if __name__=="__main__":
    unittest.main()
