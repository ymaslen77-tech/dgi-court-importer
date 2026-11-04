"""Offline regression checks for official-source discovery: fail closed."""
import datetime as dt
import unittest
from bs4 import BeautifulSoup
from scripts.discover_dgi_official_news import (
    discover_listing, normalized_article, published_date, summarize_candidate,
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

    def test_no_date_never_eligible(self):
        page = BeautifulSoup("<h1>В Подмосковье строят жилые дома</h1>" +
            "<p>Большой подробный текст о недвижимости и жилищной инфраструктуре региона.</p>", "html.parser")
        self.assertIsNone(summarize_candidate(page,
            "https://mosreg.ru/sobytiya/novosti/news-submoscow/dom/",
            "", dt.date(2026, 11, 4), 7))

if __name__ == "__main__":
    unittest.main()
