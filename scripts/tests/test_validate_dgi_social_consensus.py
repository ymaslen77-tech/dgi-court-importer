"""Article 69 equal-rights proof, synthetic adversarial negatives."""
import json
import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from validate_dgi_social_consensus import verify
def fixture():
    return json.loads(Path("research/dgi-social-tenancy-equality-consensus.json").read_text("utf8"))
class Tests(unittest.TestCase):
    def setUp(self):self.item=fixture()
    def check(self):return verify(self.item,fetcher=lambda url,excerpt:(True,"synthetic"))
    def test_three_authority_publisher_pass(self):
        result=self.check()
        self.assertEqual(len(result["sources"]),3)
        self.assertEqual(result["publication_status"],"research_only")
    def test_changing_right_to_no_rights_blocks(self):
        self.item["sources"][0]["official_source_excerpt"]=self.item["sources"][0]["official_source_excerpt"].replace("равные с нанимателем права и обязанности","обязанности без прав")
        with self.assertRaisesRegex(ValueError,"does not support"):
            self.check()
    def test_family_qualification_is_mandatory(self):
        self.item["scope"]="нет"
        with self.assertRaisesRegex(ValueError,"qualifications missing"):
            self.check()
    def test_duplicate_official_authority_blocks(self):
        self.item["sources"][1]["official_source_url"]="https://another.vsrf.ru/documents/all/8112"
        with self.assertRaisesRegex(ValueError,"Duplicate"):
            self.check()
    def test_missing_latest_official_moscow_pdf_blocks(self):
        self.item["sources"].pop()
        with self.assertRaisesRegex(ValueError,"Three official"):
            self.check()
    def test_unavailable_pdf_halts_only_this_claim(self):
        result=verify(self.item,fetcher=lambda url,excerpt:
            (False,"Official source unavailable/unverifiable: URLError"))
        self.assertEqual(result["status"],"research_only_source_temporarily_unavailable")
        self.assertEqual(result["independent_publishers_confirmed"],0)
    def test_excerpt_mismatch_still_fails_explicitly(self):
        with self.assertRaisesRegex(ValueError,"not observed"):
            verify(self.item,fetcher=lambda url,excerpt:
                (False,"Exact quoted excerpt not visible in fetched official source"))
    def test_unknown_publication_status_not_auto_approved(self):
        self.item["publication_status"]="approved"
        with self.assertRaisesRegex(ValueError,"Unreviewed"):
            self.check()
    def test_expanding_social_tenancy_to_privatisation_rejected(self):
        self.item["procedure"]="privatization-service"
        with self.assertRaisesRegex(ValueError,"Unreviewed"):
            self.check()
if __name__=="__main__":
    unittest.main()
