"""Regression tests for official full-document parsing and daily DGI quota."""
import datetime
import json
import sys
import unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import prepare_dgi_all_outcome_courts as prep
import validate_dgi_court_publication_queue as queue

URL_CASE = "https://2kas.sudrf.ru/modules.php?case_id=16744768&case_uid=87460272-91d5-4830-8fb7-41ddb9df6a58&delo_id=2800001&n_c=1&name=sud_delo&name_op=case&new=2800001&srv_num=1"
URL_DOC = "https://2kas.sudrf.ru/modules.php?case_type=0&delo_id=2800001&name=sud_delo&name_op=doc&new=2800001&number=15616142&srv_num=1&text_number=1"

class Reply:
    status=200
    def __init__(self,data,url=URL_CASE):
        self.data=data
        self.url=url
    def read(self,n):
        return self.data[:n]
    def __enter__(self):
        return self
    def __exit__(self,*args):
        return False

def court_page(prepared_date="23 января 2025 года",decision_date="« 15 » января 2026 года",
               heading="О П Р Е Д Е Л Е Н И Е",mask="ФИО1"):
    head=(f"Дело № 88-1737/2026\nОпределение в окончательной форме изготовлено {prepared_date}.\n"
          f"{heading}\n{decision_date} город Москва\n"
          "Судебная коллегия по гражданским делам Второго кассационного суда общей юрисдикции\n")
    legal=("По иску ФИО1 к Департаменту городского имущества г. Москвы, "
          "коллегия рассмотрела доводы сторон и установила обстоятельства судебного дела.\n")
    body=head+(legal*85)+mask+"\nРуководствуясь ГПК РФ, определила: оставить жалобу без удовлетворения."
    return ("<html><body><div id='cont_doc1'>"+body+"</div></body></html>").encode("utf8")

class OfficialDocumentTests(unittest.TestCase):
    def test_case_and_document_url_are_allowed(self):
        self.assertTrue(queue.official_url(URL_CASE))
        self.assertTrue(queue.official_url(URL_DOC))
        for url in (URL_CASE,URL_DOC):
            self.assertTrue(url.startswith("https://2kas.sudrf.ru/"))
    def test_reject_untrusted_or_partial_url_parameters(self):
        for bad in (URL_CASE.replace("2kas.sudrf.ru","2kas.sudrf.ru.evil.test"),
                    URL_CASE.replace("name_op=case","name_op=case_typo"),
                    URL_DOC.replace("name_op=doc","name_op=doc_typo"),
                    URL_DOC.replace("number=15616142","number=abc"),
                    URL_DOC+"#fragment"):
            self.assertFalse(queue.official_url(bad),bad)
            with self.assertRaises(ValueError):
                prep.full_official_court_act(bad,"88-1737/2026")
    def test_year_typo_in_preparation_line_does_not_override_decision_heading(self):
        raw=court_page()
        self.assertGreater(len(raw),12000)
        with patch.object(prep,"urlopen",return_value=Reply(raw)):
            original,body,date=prep.full_official_court_act(URL_CASE,"88-1737/2026")
        self.assertEqual(original,raw)
        self.assertEqual(date,"2026-01-15")
        warnings=prep.source_date_warnings(body,date)
        self.assertTrue(warnings and "2025" in warnings[0])
    def test_heading_date_with_short_russian_year_suffix(self):
        raw=court_page(decision_date="город Москва 14 апреля 2026 г.")
        with patch.object(prep,"urlopen",return_value=Reply(raw)):
            _,_,date=prep.full_official_court_act(URL_CASE,"88-1737/2026")
        self.assertEqual(date,"2026-04-14")

    def test_reject_missing_full_text_and_wrong_date(self):
        with patch.object(prep,"urlopen",return_value=Reply(b"<html>card only</html>")):
            with self.assertRaises(ValueError):
                prep.full_official_court_act(URL_CASE,"88-1737/2026")
        raw=court_page(decision_date="15 января 2025 года")
        with patch.object(prep,"urlopen",return_value=Reply(raw)):
            with self.assertRaisesRegex(ValueError,"year differs"):
                prep.full_official_court_act(URL_CASE,"88-1737/2026")
    def test_reject_unredacted_phone(self):
        raw=court_page(mask="+7 (999) 111-22-33 ФИО1")
        with patch.object(prep,"urlopen",return_value=Reply(raw)):
            with self.assertRaisesRegex(ValueError,"personal identifier"):
                prep.full_official_court_act(URL_CASE,"88-1737/2026")
    def test_daily_quota_matches_both_config_and_queue(self):
        policy=json.loads((prep.ROOT/"config/dgi-daily-publication.json").read_text())
        q=json.loads(prep.QUEUE.read_text())
        self.assertEqual(policy["publication_limits"]["new_verified_court_acts_per_run"],10)
        self.assertEqual(q["limit_per_daily_release"],10)
        self.assertEqual(queue.validate() and 10,10)

if __name__=="__main__":
    unittest.main()
