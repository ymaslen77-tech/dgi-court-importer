"""No manual intervention needed for verified fact-only news; legal route edits require owner."""
import copy
import datetime
import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from validate_dgi_automation_changes import assess_news, classify, normalized_title

def article(slug="moskva-imushchestvo-test-news-2026", url="https://tender.mos.ru/news/verified-example"):
    now=datetime.datetime.now(datetime.timezone.utc)
    pub=(now-datetime.timedelta(hours=2)).isoformat()
    source=(now-datetime.timedelta(hours=5)).isoformat()
    return {"slug":slug,"title":"В Москве объявили о проведении нового имущественного аукциона",
      "summary":"На официальном портале опубликована информация об объекте городского имущества и дате проведения аукциона. Условия участия указаны в документах торгов.",
      "region":"Москва","category":"Городская недвижимость","publishedAt":pub,"sourcePublishedAt":source,
      "sourceName":"Департамент города Москвы","sourceUrl":url,
      "sections":[{"heading":"Подробности объявления","paragraphs":["По информации официального организатора опубликована карточка конкретного объекта, а участникам следует проверить данные и документацию непосредственно на сайте."]} for _ in range(3)]}

class ClassificationTests(unittest.TestCase):
    def test_new_verified_source_news_candidate(self):
        self.assertEqual(assess_news([],[article()])[0],"auto_candidate")
    def test_rewritten_article_needs_manual(self):
        old=article();new=copy.deepcopy(old);new["summary"]="Исправленный текст"
        self.assertEqual(assess_news([old],[new])[0],"manual")
    def test_legal_procedure_change_requires_owner(self):
        entry=article();entry["title"]="Вступает в силу новая редакция порядка подачи заявлений в Москве"
        self.assertEqual(assess_news([],[entry])[0],"manual")
    def test_more_than_five_news_blocked(self):
        items=[article(slug="moskva-imushchestvo-test-news-"+str(i),url="https://tender.mos.ru/news/x-"+str(i)) for i in range(6)]
        self.assertEqual(assess_news([],items)[0],"invalid")
    def test_fabricated_unofficial_source_blocked(self):
        entry=article();entry["sourceUrl"]="https://example.com/fake"
        self.assertEqual(assess_news([],[entry])[0],"invalid")
    def test_duplicate_source_blocked(self):
        rows=[article(),article(slug="moskva-imushchestvo-test-another-news")]
        self.assertEqual(assess_news([],rows)[0],"invalid")
    def test_legal_route_changes_need_manual_review(self):
        self.assertEqual(classify(["apps/web/src/data/pages-0.json"],"fake","fake")[0],"manual")
        self.assertEqual(classify(["apps/web/src/data/housing-guides.json"],"fake","fake")[0],"manual")
    def test_court_metadata_cannot_autopublish(self):
        self.assertEqual(classify(["data/court-catalog.jsonl"],"fake","fake")[0],"research_only")
    def test_normalized_headline(self):
        self.assertEqual(normalized_title(" ЗАКОН!  2026 "), "закон 2026")

if __name__=="__main__":unittest.main()
