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
    def test_missing_link_rejected(self):
        case={"Номер дела":"2/2025","Суд":"Суд","Стороны":"Департамент городского имущества города Москвы","Акты":[]}
        self.assertIsNone(normalize(case,"official source"))

if __name__=="__main__":
    unittest.main()
