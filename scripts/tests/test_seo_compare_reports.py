import unittest
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from seo_compare_reports import compare

class SeoCompareTests(unittest.TestCase):
    def setUp(self):
        self.before={"site":"https://dgi-pravo.ru",
          "sitemap_urls":["https://dgi-pravo.ru/","https://dgi-pravo.ru/privatizaciya-zhilya"],
          "errors":[],"pages":[{"url":"https://dgi-pravo.ru/privatizaciya-zhilya",
                                    "title":"Приватизация","description":"Старая аннотация","canonical":["https://dgi-pravo.ru/privatizaciya-zhilya"]}]}
    def test_removed_page_is_release_blocker(self):
        now={**self.before,"sitemap_urls":["https://dgi-pravo.ru/"]}
        result=compare(self.before,now)
        self.assertTrue(result["release_review_required"])
        self.assertEqual(result["removed_sitemap_urls"],["https://dgi-pravo.ru/privatizaciya-zhilya"])
        self.assertFalse(result["automatic_publication_allowed"])
    def test_new_page_triggers_manual_review(self):
        now={**self.before,"sitemap_urls":self.before["sitemap_urls"]+["https://dgi-pravo.ru/new"]}
        self.assertTrue(compare(self.before,now)["release_review_required"])
    def test_metadata_change_discovered(self):
        now={**self.before,"pages":[{**self.before["pages"][0],"description":"Новое описание"}]}
        self.assertEqual(compare(self.before,now)["metadata_changes"][0]["field"],"description")
    def test_resolved_and_new_errors(self):
        self.before["errors"]=[{"kind":"old_error","url":"https://dgi-pravo.ru/"}]
        now={**self.before,"errors":[{"kind":"new_error","url":"https://dgi-pravo.ru/"}]}
        r=compare(self.before,now)
        self.assertEqual(r["resolved_error_signatures"][0]["kind"],"old_error")
        self.assertEqual(r["new_error_signatures"][0]["kind"],"new_error")
    def test_empty_historical_sitemap_cannot_be_approved_baseline(self):
        self.before["sitemap_urls"]=[]
        now={**self.before,"sitemap_urls":["https://dgi-pravo.ru/"]}
        result=compare(self.before,now)
        self.assertEqual(result["status"],"no_usable_approved_sitemap_baseline")
        self.assertFalse(result["release_review_required"])
    def test_other_domain_is_rejected(self):
        now={**self.before,"site":"https://other.example"}
        with self.assertRaises(ValueError):compare(self.before,now)
if __name__=="__main__":unittest.main()
