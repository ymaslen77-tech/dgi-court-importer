import json
import tempfile
import unittest
from pathlib import Path
from court_catalog import normalize, merge_records, stream_json, write_index, court_url

OFFICIAL="https://data.mos-gorsud.ru/api/opendata/1577116594824-casesgroupfirstcivilhxvgb/latest/data/json/"
CASE_URL="https://mos-gorsud.ru/rs/presnenskij/services/cases/civil/details/example-100"

class CatalogTests(unittest.TestCase):
    def test_open_data_row_with_broad_housing_subject(self):
        row={"Наименование суда":"Пресненский районный суд",
             "Номер дела":"02-1111/2025",
             "Уникальный идентификатор дела":"77RS0123-02-2025-01111-33",
             "Категория дела":"Споры, связанные с жилищными отношениями - Выселение",
             "Стороны":[{"ФИО/Наименование":"Гражданин А."}],
             "Ссылка на карточку дела":CASE_URL}
        item=normalize(row,OFFICIAL)
        self.assertIsNotNone(item)
        self.assertIn("Выселение",item["topics"])
        self.assertFalse(item["dgi_party"])
        self.assertFalse(item["act_reviewed"])
        self.assertNotIn("parties",item)
        self.assertNotIn("result",item)
        self.assertEqual(item["official_case_url"],CASE_URL)

    def test_dgi_is_a_candidate_even_if_category_missing(self):
        row={"courtName":"Суд","number":"2-100/2026","category":"Прочие",
             "participants":[{"displayName":"Департамент городского имущества г. Москвы"}],
             "url":"https://mos-gorsud.ru/case/123"}
        item=normalize(row,OFFICIAL)
        self.assertTrue(item["dgi_party"])
        self.assertEqual(item["topics"],["ДГИ — предмет требует классификации"])

    def test_non_housing_no_dgi_rejected(self):
        row={"courtName":"Суд","number":"2-100/2026",
             "category":"Взыскание долга по потребительскому кредиту",
             "participants":[{"displayName":"Банк"}],
             "url":CASE_URL}
        self.assertIsNone(normalize(row,OFFICIAL))

    def test_disallows_dangerous_links(self):
        self.assertEqual(court_url("https://mos-gorsud.ru.evil.test/x"),"")
        self.assertEqual(court_url("http://mos-gorsud.ru/x"),"")
        self.assertEqual(court_url("https://example.com/a"),"")

    def test_metadata_only_and_resume_without_duplicates(self):
        row={"courtName":"Суд","number":"2-200/2025","category":"Приватизация квартиры",
             "url":CASE_URL,"participants":[{"displayName":"ДГИ г. Москвы"}]}
        candidate=normalize(row,OFFICIAL)
        with tempfile.TemporaryDirectory() as tmp:
            dest=Path(tmp)/"index.jsonl"
            before,first=merge_records(dest,[candidate,candidate],10)
            self.assertEqual(first["new"],1)
            write_index(dest,before)
            after,second=merge_records(dest,[candidate],10)
            self.assertEqual(second["new"],0)
            self.assertEqual(second["total"],1)

    def test_json_root_arrays(self):
        row={"courtName":"Суд","number":"2-100/2025","category":"Жилищные споры",
             "url":CASE_URL}
        with tempfile.TemporaryDirectory() as tmp:
            dest=Path(tmp)/"cases.json"
            dest.write_text(json.dumps({"data":[row]},ensure_ascii=False),encoding="utf-8")
            records=list(stream_json(dest))
        self.assertEqual(len(records),1)

if __name__=="__main__":
    unittest.main()
