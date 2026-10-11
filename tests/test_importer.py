import unittest
from importer import normalize, official, dataset_url

class ImporterTest(unittest.TestCase):
    def test_source_domains(self):
        self.assertTrue(official("https://data.mos-gorsud.ru/opendata/example.json"))
        self.assertFalse(official("https://data.mos-gorsud.ru.attacker.example/file"))
        self.assertFalse(official("http://mos-gorsud.ru/data.json"))
    def test_registry_export_rejected(self):
        self.assertFalse(dataset_url("https://data.mos-gorsud.ru/api/opendata/json"))
        self.assertTrue(dataset_url("https://data.mos-gorsud.ru/api/opendata/example-case-dataset.json"))

    def test_dgi_and_draft(self):
        case = {
            "Номер дела":"02-1234/2025",
            "Наименование суда":"Пресненский районный суд Москвы",
            "Стороны":[{"Наименование":"Департамент городского имущества города Москвы"}],
            "Судебные акты":[{"Ссылка":"https://mos-gorsud.ru/rs/example/case/123","Наименование":"Решение"}]
        }
        item = normalize(case,"https://data.mos-gorsud.ru/opendata")
        self.assertIsNotNone(item)
        self.assertEqual(item["status-verifikacii"],"pending_review_of_resolutive_part")
        self.assertNotIn("rezultat-rassmotreniya",item)
        case["Стороны"]=[{"Наименование":"Посторонняя организация"}]
        self.assertIsNone(normalize(case,"https://data.mos-gorsud.ru/opendata"))
    def test_official_first_instance_schema_candidate(self):
        row = {
            "Наименование суда": "Пресненский районный суд города Москвы",
            "Номер дела": "02-1234/2025",
            "Уникальный идентификатор дела": "77RS0000-01-2025-000000-00",
            "Стороны": [{"ФИО/Наименование": "Департамент городского имущества города Москвы",
                         "Категория участника": "Ответчик"}],
            "Судебные акты": [{"Наименование": "Решение", "Дата": "2025-09-10",
                                 "Ссылка на акт": "https://mos-gorsud.ru/rs/example/case/act/42"}]
        }
        result = normalize(row, "https://data.mos-gorsud.ru/opendata")
        self.assertIsNotNone(result)
        self.assertEqual(result["nomer-dela"], "02-1234/2025")
        self.assertEqual(result["status-verifikacii"], "pending_review_of_resolutive_part")
        self.assertNotIn("rezultat-rassmotreniya", result)

    def test_actual_english_schema_with_case_page_only(self):
        case = {
            "courtName": "Лефортовский районный суд",
            "number": "02-4049/2018",
            "uid": "77RS0014-01-2018-007614-36",
            "participants": [
                {"displayName": "Департамент городского имущества г. Москвы", "categoryName": "Истец"},
                {"displayName": "Ответчик А.", "categoryName": "Ответчик"}
            ],
            "publishingState": "Удовлетворено, 26.10.2018",
            "category": "127 - Иные жилищные споры",
            "url": "https://mos-gorsud.ru/rs/lefortovskij/services/cases/civil/details/example"
        }
        case_record = normalize(case, "https://data.mos-gorsud.ru/opendata")
        self.assertIsNotNone(case_record)
        self.assertEqual(case_record["status-verifikacii"], "pending_case_no_act")
        self.assertEqual(case_record["nomer-dela"], "02-4049/2018")
        self.assertNotIn("publikaciya-sudebnogo-akta", case_record)
        self.assertNotIn("rezultat-rassmotreniya", case_record)
        self.assertTrue(case_record["oficialnyy-istochnik"].startswith("https://mos-gorsud.ru/"))

    def test_actual_english_schema_with_attachment(self):
        case = {
            "courtName": "Пресненский районный суд",
            "number": "02-9999/2025",
            "participants": [{"displayName": "Департамент городского имущества города Москвы", "categoryName": "Ответчик"}],
            "url": "https://mos-gorsud.ru/rs/presnenskij/services/cases/civil/details/example",
            "attachments": [{"displayName": "Решение суда", "date": "2025-09-01",
                             "link": "https://mos-gorsud.ru/rs/example/attachment/download"}]
        }
        case_record = normalize(case, "official data")
        self.assertEqual(case_record["status-verifikacii"], "pending_review_of_resolutive_part")
        self.assertEqual(case_record["publikaciya-sudebnogo-akta"], case["attachments"][0]["link"])

    def test_non_dgi_english_case_rejected(self):
        case = {"courtName": "Суд", "number": "02-1/2025",
                "participants": [{"displayName": "ООО Частный дом", "categoryName": "Истец"}],
                "url": "https://mos-gorsud.ru/rs/example/details/1"}
        self.assertIsNone(normalize(case, "official data"))

    def test_link_instances_only_when_same_uid(self):
        base = {
            "courtName": "Пресненский районный суд",
            "number": "02-3333/2025",
            "uid": "77RS0000-01-2025-000001-01",
            "participants": [{"displayName": "Департамент городского имущества города Москвы"}],
            "url": "https://mos-gorsud.ru/rs/court/services/cases/civil/details/first"
        }
        first = normalize(base, "https://data.mos-gorsud.ru/api/opendata/1577116594824-casesgroupfirstcivilhxvgb/latest/data/json/")
        appeal = normalize(dict(base, number="33-1111/2026",
                                courtName="Московский городской суд",
                                url="https://mos-gorsud.ru/mgs/cases/appeal"), "Moscow appeal dataset")
        self.assertEqual(first["identifikator-sudebnogo-spora"], appeal["identifikator-sudebnogo-spora"])
        self.assertEqual(first["sudebnaya-instanciya"], "Первая инстанция")
        self.assertEqual(appeal["sudebnaya-instanciya"], "Не определена")
        self.assertFalse(first["sudebnyy-akt-proveren"])
        self.assertNotIn("rezultat-rassmotreniya", appeal)

    def test_distinct_cases_without_uid_are_not_merged(self):
        row = {
            "courtName": "Один суд",
            "number": "02-3333/2025",
            "participants": [{"displayName": "Департамент городского имущества города Москвы"}],
            "url": "https://mos-gorsud.ru/rs/court/services/cases/civil/details/1"
        }
        first = normalize(row, "official first instance")
        other = normalize(dict(row, url="https://mos-gorsud.ru/rs/court/services/cases/civil/details/2"), "official first instance")
        self.assertNotEqual(first["identifikator-sudebnogo-spora"], other["identifikator-sudebnogo-spora"])

    def test_missing_link_rejected(self):
        case={"Номер дела":"2/2025","Суд":"Суд","Стороны":"Департамент городского имущества города Москвы","Акты":[]}
        self.assertIsNone(normalize(case,"official source"))

if __name__=="__main__":
    unittest.main()
