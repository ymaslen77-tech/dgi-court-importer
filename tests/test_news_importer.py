import unittest
from news_importer import allowed_article, normal_url, parse_feed, is_relevant, candidate

class NewsImporterTests(unittest.TestCase):
    def test_only_allow_trusted_article_links(self):
        self.assertTrue(allowed_article("https://www.garant.ru/news/2263304/"))
        self.assertFalse(allowed_article("https://garant.ru.evil.example/news/1"))
        self.assertFalse(allowed_article("http://www.garant.ru/news/1"))
        self.assertFalse(allowed_article("https://www.garant.ru/subscribe/"))
        self.assertFalse(allowed_article("https://www.garant.ru@evil.example/news/1"))

    def test_feed_parsing_filter_and_dates(self):
        xml=b"""<rss><channel>
        <item><title>New apartment law: квартира и собственник</title>
          <link>https://www.garant.ru/news/2263304/?tracking=abc</link>
          <pubDate>Tue, 06 Oct 2026 17:15:00 +0300</pubDate></item>
        <item><title>Olympic sport results</title>
          <link>https://www.garant.ru/news/999/</link></item>
        <item><title>Untrusted link</title>
          <link>https://evil.example/news/1</link></item>
        </channel></rss>"""
        items=parse_feed(xml)
        self.assertEqual(len(items),2)
        self.assertTrue(is_relevant(items[0]))
        self.assertFalse(is_relevant(items[1]))
        self.assertEqual(items[0]["url"],"https://www.garant.ru/news/2263304/")
        self.assertTrue(items[0]["date"].startswith("2026-10-06"))

    def test_candidate_never_publishes_or_fabricates_analysis(self):
        x=candidate({"title":"Квартира и право собственности",
            "url":"https://www.garant.ru/news/2263304/","date":""})
        self.assertTrue(x["isDraft"])
        fields=x["fieldData"]
        self.assertFalse(fields["provereno-redaktorom"])
        self.assertEqual(fields["url-pervoistochnika"],fields["klyuch-pervoistochnika"])
        self.assertNotIn("chto-izmenilos",fields)
        self.assertNotIn("kogo-kasaetsya",fields)
        self.assertNotIn("chto-delat",fields)

if __name__=="__main__":
    unittest.main()
