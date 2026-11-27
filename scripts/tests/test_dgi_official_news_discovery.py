"""Offline regression checks for official-source discovery: fail closed."""
import datetime as dt
import unittest
import json
import tempfile
from pathlib import Path
from unittest.mock import patch
from bs4 import BeautifulSoup
from scripts.discover_dgi_official_news import (
    LISTINGS, discover_listing, normalized_article, published_date, summarize_candidate, run,
)

class DiscoveryChecks(unittest.TestCase):
    def test_only_exact_official_news_links(self):
        self.assertEqual(
            normalized_article("https://tender.mos.ru/news/novoe-pomeshchenie/?utm=1"),
            "https://tender.mos.ru/news/novoe-pomeshchenie/")
        self.assertTrue(normalized_article(
            "https://mosreg.ru/sobytiya/novosti/news-submoscow/kak-zhit-v-kvartire"))
        for url in (
            "http://tender.mos.ru/news/novoe-pomeshchenie/",
            "https://tender.mos.ru.evil.example/news/novoe-pomeshchenie/",
            "https://tender.mos.ru/admin/",
            "https://mosreg.ru@bad.example/sobytiya/novosti/news-submoscow/novost",
            "https://tender.mos.ru/news/novoe-pomeshchenie/#anchor",
        ):
            self.assertIsNone(normalized_article(url), url)

    def test_listing_rejects_bad_host_and_unrelated_headlines(self):
        page = BeautifulSoup("""<main>
          <a href='/news/novost-pro-prodazhu-kvartiry/'>Продажа квартиры на торгах Москвы</a>
          <a href='https://evil.example/news/dom/'>Новости про строительство домов</a>
          <a href='/news/sport/'>В футболе новая команда и победитель</a>
        </main>""", "html.parser")
        urls = discover_listing(page, "https://tender.mos.ru/news/")
        self.assertEqual(list(urls), [
            "https://tender.mos.ru/news/novost-pro-prodazhu-kvartiry/"])

    def test_actual_article_requires_date_and_excerpt(self):
        page = BeautifulSoup("""<main><h1>В Подмосковье провели модернизацию водоснабжения</h1>
          <p>2 ноября 2026 г., 15:20</p>
          <p>В Московской области специалисты выполнили комплекс плановых ремонтных работ на сетях водоснабжения и водоотведения для жителей региона, сообщает региональное министерство.</p>
        </main>""", "html.parser")
        url = "https://mosreg.ru/sobytiya/novosti/news-submoscow/novye-seti/"
        self.assertEqual(published_date(page, ""), dt.date(2026, 11, 2))
        item = summarize_candidate(page, url, "", dt.date(2026, 11, 4), 7)
        self.assertIsNotNone(item)
        self.assertFalse(item["eligible_for_publication"])
        self.assertIsNone(summarize_candidate(page, url, "", dt.date(2026, 11, 20), 7))

    def test_mgkh_mosreg_official_home_in_discovery(self):
        self.assertIn("https://mgkh.mosreg.ru/", LISTINGS)
        article = normalized_article(
            "https://mgkh.mosreg.ru/sobytiya/novosti-ministerstva/v-pavlovskom-posade-zavershena-realizaciya-godovogo-plana-kapitalnogo-remonta"
        )
        self.assertTrue(article and article.startswith("https://mgkh.mosreg.ru/"))

    def test_official_mgkh_capital_repairs_and_water_mains_are_not_filtered(self):
        page = BeautifulSoup("""
          <main>
          <a href="/sobytiya/novosti-ministerstva/v-pavlovskom-posade-zavershena-realizaciya-godovogo-plana-kapitalnogo-remonta">
            В Павловском Посаде завершена реализация годового плана капитального ремонта
          </a>
          <a href="/sobytiya/novosti-ministerstva/gotovnost-novogo-uchastka-vodovoda-v-naro-fominske-dostigla">
            Готовность нового участка водовода в Наро-Фоминске достигла 50%
          </a>
          <a href="/sobytiya/novosti-ministerstva/nesvyazannaya-tema">
            Спортсмены региона выиграли ежегодный турнир по настольному теннису
          </a>
          </main>
        """, "html.parser")
        found = discover_listing(page, "https://mgkh.mosreg.ru/")
        self.assertEqual(len(found), 2)
        self.assertTrue(all(url.startswith("https://mgkh.mosreg.ru/") for url in found))

    def test_all_official_sources_unavailable_cannot_report_successful_zero(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "research.json"
            with patch("scripts.discover_dgi_official_news.fetch_html", side_effect=OSError("network")):
                with self.assertRaisesRegex(RuntimeError, "All official news listings unavailable"):
                    run(limit=2, lookback=7, output=path)
            report=json.loads(path.read_text(encoding="utf-8"))
            self.assertTrue(report["all_listings_unavailable"])
            self.assertEqual(report["reachable_official_listings"], 0)
            self.assertEqual(report["new_publications"], 0)
            self.assertFalse(report["publication_allowed"])
            self.assertEqual(len(report["unavailable_sources"]),len(LISTINGS))

    def test_one_reachable_but_empty_official_feed_is_not_an_outage(self):
        with tempfile.TemporaryDirectory() as temp:
            path=Path(temp) / "research.json"
            def source(url):
                if url == LISTINGS[0]:
                    return BeautifulSoup("<h1>Пустые новости</h1>", "html.parser")
                raise OSError("network")
            with patch("scripts.discover_dgi_official_news.fetch_html", side_effect=source):
                report=run(limit=2, lookback=7, output=path)
            self.assertFalse(report["all_listings_unavailable"])
            self.assertEqual(report["reachable_official_listings"],1)
            self.assertEqual(report["candidate_count"],0)

    def test_no_date_never_eligible(self):
        page = BeautifulSoup("<h1>В Подмосковье строят жилые дома</h1>" +
            "<p>Большой подробный текст о недвижимости и жилищной инфраструктуре региона.</p>", "html.parser")
        self.assertIsNone(summarize_candidate(page,
            "https://mosreg.ru/sobytiya/novosti/news-submoscow/dom/",
            "", dt.date(2026, 11, 4), 7))

if __name__ == "__main__":
    unittest.main()
