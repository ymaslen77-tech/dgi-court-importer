"""Read-only public visibility test fixtures, no network or publication claims."""
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import check_dgi_live_publication as smoke

class PublicVisibilityTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        root=Path(self.temp.name)
        news=root/"apps/web/src/data/housing-news.json"
        cases=root/"apps/web/src/data/verified-court-static.json"
        news.parent.mkdir(parents=True)
        news.write_text(json.dumps([{"slug":"a"},{"slug":"b"}]),"utf8")
        cases.write_text(json.dumps([{"slug":"c"}]),"utf8")
        self.patcher=patch.object(smoke,"ROOT",root)
        self.patcher.start()
        self.addCleanup(self.patcher.stop)
        self.html=(
            '<html><meta name="robots" content="index, follow"><body>'
            '<article class="housing-news-card">A</article>'
            '<article class="housing-news-card">B</article></body></html>'
        ).encode()
    def fetch(self,url):
        if url.endswith("/api/courts/verified"):
            return json.dumps({"items":[{"slug":"c"}]}).encode(),{}
        return self.html,{}
    def test_counts_are_verified_from_actual_html_and_api(self):
        result=smoke.check(fetcher=self.fetch)
        self.assertTrue(result["live_content_confirmed"])
        self.assertEqual(result["status"],"observed_counts_match_source_and_indexable")
        self.assertEqual(result["news"]["visible_news_cards"],2)
        self.assertEqual(result["courts"]["public_api_count"],1)
    def test_silent_missing_courts_is_reported_as_mismatch(self):
        def fetch(url):
            if url.endswith("/api/courts/verified"):
                return b'{"items":[]}',{}
            return self.html,{}
        result=smoke.check(fetcher=fetch)
        self.assertEqual(result["status"],"live_release_manifest_mismatch")
        self.assertFalse(result["live_content_confirmed"])
    def test_docker_success_is_not_live_evidence_if_site_unavailable(self):
        result=smoke.check(fetcher=lambda url: (_ for _ in ()).throw(OSError("DNS")))
        self.assertEqual(result["status"],"unreachable_or_server_error")
        self.assertFalse(result["live_content_confirmed"])
    def test_noindex_is_detected_even_when_counts_match(self):
        self.html=self.html.replace(b"index, follow",b"noindex, nofollow")
        result=smoke.check(fetcher=self.fetch)
        self.assertEqual(result["status"],"content_visible_but_noindex")
        self.assertFalse(result["live_content_confirmed"])
    def test_header_noindex_is_detected(self):
        def fetch(url):
            data,headers=self.fetch(url)
            if not url.endswith("/api/courts/verified"):
                headers={"X-Robots-Tag":"noindex"}
            return data,headers
        result=smoke.check(fetcher=fetch)
        self.assertEqual(result["status"],"content_visible_but_noindex")
    def test_malformed_court_api_cannot_be_counted_as_success(self):
        def fetch(url):
            if url.endswith("/api/courts/verified"):
                return b'{"items":{"x":"y"}}',{}
            return self.html,{}
        result=smoke.check(fetcher=fetch)
        self.assertEqual(result["status"],"unreachable_or_server_error")
        self.assertFalse(result["courts"]["http_200"])

if __name__=="__main__":
    unittest.main()
