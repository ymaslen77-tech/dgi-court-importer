"""Synthetic PDF provenance tests; no file here is a genuine legal source."""
import io
import subprocess
import sys
import unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from validate_official_legal_changes import official_excerpt_visible

URL="https://www.mos.ru/upload/documents/test-only-source.pdf"
QUOTE="Тестовая строка из официального PDF доказывает исключительно надежность извлечения Unicode-текста."
PDF=b"%PDF-1.4\nsynthetic fixture, not a legal PDF\n"

class Response:
    status=200
    def __init__(self,body=PDF,media="application/pdf",url=URL):
        self._body=io.BytesIO(body)
        self.media=media
        self.url=url
        self.headers=self
    def geturl(self): return self.url
    def get(self,k,default=None):
        return self.media if k=="Content-Type" else default
    def get_content_charset(self):return None
    def read(self,n=-1):return self._body.read(n)
    def __enter__(self):return self
    def __exit__(self,*_):pass

def clear():
    official_excerpt_visible.cache_clear()

class OfficialPDFTests(unittest.TestCase):
    def tearDown(self): clear()
    @patch("validate_official_legal_changes.subprocess.run")
    @patch("validate_official_legal_changes.urlopen")
    def test_real_pdf_header_with_observed_unicode_text_passes(self,fetch,convert):
        fetch.return_value=Response()
        convert.return_value=subprocess.CompletedProcess([],0,(QUOTE+"\n").encode("utf-8"),b"")
        self.assertTrue(official_excerpt_visible(URL,QUOTE)[0])
        self.assertEqual(convert.call_args.args[0][:2],["pdftotext","-enc"])
        self.assertLessEqual(convert.call_args.kwargs["timeout"],30)

    @patch("validate_official_legal_changes.urlopen")
    def test_invalid_pdf_header_refused(self,fetch):
        fetch.return_value=Response(b"not actually a PDF")
        self.assertFalse(official_excerpt_visible(URL,QUOTE)[0])

    @patch("validate_official_legal_changes.subprocess.run")
    @patch("validate_official_legal_changes.urlopen")
    def test_scanned_or_empty_pdf_refused(self,fetch,convert):
        fetch.return_value=Response()
        convert.return_value=subprocess.CompletedProcess([],1,b"",b"no extractable text")
        self.assertFalse(official_excerpt_visible(URL,QUOTE)[0])

    @patch("validate_official_legal_changes.subprocess.run")
    @patch("validate_official_legal_changes.urlopen")
    def test_unseen_legal_quote_cannot_be_substituted(self,fetch,convert):
        fetch.return_value=Response()
        convert.return_value=subprocess.CompletedProcess([],0,b"Unrelated content only",b"")
        self.assertFalse(official_excerpt_visible(URL,QUOTE)[0])

    @patch("validate_official_legal_changes.urlopen")
    def test_overlarge_pdf_is_rejected_before_converter(self,fetch):
        fetch.return_value=Response(PDF+b"A"*18000000)
        self.assertFalse(official_excerpt_visible(URL,QUOTE)[0])

    @patch("validate_official_legal_changes.urlopen")
    def test_official_link_redirect_to_nonofficial_domain_refused(self,fetch):
        fetch.return_value=Response(url="https://attacker.invalid/redirected.pdf")
        self.assertFalse(official_excerpt_visible(URL,QUOTE)[0])

    @patch("validate_official_legal_changes.urlopen")
    def test_wrong_mime_type_does_not_extract_pdf(self,fetch):
        fetch.return_value=Response(media="application/zip")
        self.assertFalse(official_excerpt_visible(URL,QUOTE)[0])

if __name__=="__main__":
    unittest.main()
