"""Selected PDF text, no OCR: synthetic bounded provenance tests."""
import io
import sys
import unittest
from email.message import Message
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from validate_official_legal_changes import (
    _extract_official_pdf_text, official_excerpt_visible, MAX_PDF_BYTES
)

QUOTE="Official evidence repeated for automated legal text verification on a specific government document page number seventeen."

def make_pdf(text):
    # Minimal, valid, text-selectable single-page PDF generated without
    # external services. Evidence only in synthetic tests, never a real law.
    escaped=text.replace("\\","\\\\").replace("(","\\(").replace(")","\\)")
    stream=f"BT /F1 12 Tf 60 700 Td ({escaped}) Tj ET".encode("ascii")
    objects=[
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"<< /Length "+str(len(stream)).encode()+b" >>\nstream\n"+stream+b"\nendstream",
    ]
    result=bytearray(b"%PDF-1.4\n")
    offsets=[0]
    for i,obj in enumerate(objects,1):
        offsets.append(len(result))
        result.extend(f"{i} 0 obj\n".encode()+obj+b"\nendobj\n")
    xref=len(result)
    result.extend(f"xref\n0 {len(offsets)}\n".encode())
    result.extend(b"0000000000 65535 f \n")
    for off in offsets[1:]:
        result.extend(f"{off:010d} 00000 n \n".encode())
    result.extend(f"trailer\n<< /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode())
    return bytes(result)

class FakeResponse:
    status=200
    def __init__(self,body,url,media="application/pdf"):
        self.stream=io.BytesIO(body);self.url=url
        self.headers=Message();self.headers["Content-Type"]=media
    def geturl(self):return self.url
    def read(self,n=-1):return self.stream.read(n)
    def __enter__(self):return self
    def __exit__(self,*args):return False

class OfficialPdfTests(unittest.TestCase):
    URL="https://www.mos.ru/upload/documents/tests/evidence.pdf"
    def test_real_pdf_parser_extracts_selectable_text(self):
        self.assertIn(QUOTE,_extract_official_pdf_text(make_pdf(QUOTE)))
    def test_real_pdf_source_with_exact_quote_is_accepted(self):
        with patch("validate_official_legal_changes.urlopen",
                   return_value=FakeResponse(make_pdf(QUOTE),self.URL)):
            ok,reason=official_excerpt_visible(self.URL,QUOTE)
        self.assertTrue(ok,reason)
    def test_mismatched_official_quote_rejected(self):
        wrong=QUOTE.replace("seventeen","eighteen")
        with patch("validate_official_legal_changes.urlopen",
                   return_value=FakeResponse(make_pdf(QUOTE),self.URL)):
            ok,_=official_excerpt_visible(self.URL,wrong)
        self.assertFalse(ok)
    def test_pdf_with_no_text_is_rejected(self):
        with self.assertRaisesRegex(ValueError,"PDF"):
            _extract_official_pdf_text(b"%PDF-1.4\n%%EOF")
    def test_official_pdf_exceeding_size_limit_is_rejected(self):
        oversized=b"%PDF-1.4"+b"x"*(MAX_PDF_BYTES+1)
        with patch("validate_official_legal_changes.urlopen",
                   return_value=FakeResponse(oversized,self.URL)):
            ok,reason=official_excerpt_visible(self.URL,QUOTE)
        self.assertFalse(ok);self.assertIn("exceeds",reason)
    def test_redirect_to_non_official_site_is_rejected(self):
        with patch("validate_official_legal_changes.urlopen",
                   return_value=FakeResponse(make_pdf(QUOTE),"https://attacker.invalid/forged.pdf")):
            ok,_=official_excerpt_visible(self.URL,QUOTE)
        self.assertFalse(ok)
    def test_html_masquerading_as_pdf_is_rejected(self):
        with patch("validate_official_legal_changes.urlopen",
                   return_value=FakeResponse(b"<html>fake law</html>",self.URL)):
            ok,_=official_excerpt_visible(self.URL,QUOTE)
        self.assertFalse(ok)
    def test_unknown_content_type_is_not_a_pdf_bypass(self):
        with patch("validate_official_legal_changes.urlopen",
                   return_value=FakeResponse(make_pdf(QUOTE),self.URL,"image/png")):
            ok,_=official_excerpt_visible(self.URL,QUOTE)
        self.assertFalse(ok)

if __name__=="__main__":
    unittest.main()
