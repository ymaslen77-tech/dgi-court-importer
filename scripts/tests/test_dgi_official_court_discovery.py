"""Offline safety tests for 2kas official case discovery (no publication)."""
import unittest
from bs4 import BeautifulSoup
from scripts.discover_dgi_official_courts import case_link, case_links, full_text_is_dgi

URL = ("https://2kas.sudrf.ru/modules.php?case_id=17922794&"
       "case_uid=e7b0d6f3-6f17-4210-a204-0530f61ee1e6&delo_id=2800001&"
       "name=sud_delo&name_op=case&new=2800001&srv_num=1")

class CourtDiscoveryTests(unittest.TestCase):
    def test_exact_urls_and_case_numbers_only(self):
        html=BeautifulSoup(
            "<a href='"+URL+"'>8Г-1234/2026 [88-12218/2026]</a>"
            "<a href='https://evil.example/'>88-19000/2026</a>"
            "<a href='"+URL+"#bad'>88-9999/2026</a>", "html.parser")
        self.assertEqual(case_links(html), {"88-12218/2026": URL})
        self.assertEqual(case_link(URL), URL)
        self.assertIsNone(case_link("https://2kas.sudrf.ru.evil.example/modules.php?name_op=case"))

    def test_requires_full_official_document_and_dgi(self):
        body=("Дело № 88-12218/2026 О П Р Е Д Е Л Е Н И Е "
              "Департамент городского имущества города Москвы " + "официальный текст дела "*240)
        good=BeautifulSoup("<div id='cont_doc1'>"+body+"</div>", "html.parser")
        self.assertTrue(full_text_is_dgi(good,"88-12218/2026"))
        self.assertFalse(full_text_is_dgi(good,"88-12345/2026"))
        self.assertFalse(full_text_is_dgi(BeautifulSoup(
            "<div id='content'>"+body+"</div>", "html.parser"), "88-12218/2026"))
        self.assertFalse(full_text_is_dgi(BeautifulSoup(
            "<div id='cont_doc1'>Дело № 88-12218/2026</div>", "html.parser"),
            "88-12218/2026"))

if __name__=="__main__":
    unittest.main()
