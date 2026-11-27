import sys
import tempfile
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from audit_dgi_existing_content import court_record, digest, text_fields, pdf_check, valid_official_url

class ExistingContentAudit(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.root=Path(self.temp.name)
        self.text="Судебный текст. "*500
        self.pdf=b"%PDF-1.4\n"+b"0"*500+b"\n%%EOF"
        self.row={"slug":"court-1","case_number":"1","official_url":"https://2kas.sudrf.ru/modules.php",
                  "full_text":self.text,"full_text_sha256":digest(self.text.encode("utf-8")),
                  "pdf_sha256":digest(self.pdf),"source_checked":True,"privacy_screen_passed":True}
        self.file=self.root/"apps/web/public/court-pdf-copies/court-1.pdf"
        self.file.parent.mkdir(parents=True)
        self.file.write_bytes(self.pdf)
    def tearDown(self):
        self.temp.cleanup()
    def test_automated_flag_not_manual_review_or_missing(self):
        result=court_record(self.root,self.row)
        self.assertEqual(result["problems"],[])
        self.assertEqual(result["privacy_review"],"recorded_automated_screen_flag")
        self.assertEqual(result["substantive_source_review"],"not_certified_by_this_audit")
    def test_legacy_and_missing_distinct(self):
        row=dict(self.row,privacy_checked=True)
        self.assertEqual(court_record(self.root,row)["privacy_review"],"recorded_legacy_review_flag")
        row=dict(self.row,privacy_screen_passed=False)
        self.assertIn("missing_privacy_flag",court_record(self.root,row)["problems"])
    def test_tampering_detected(self):
        self.file.write_bytes(self.pdf+b"changed")
        row=dict(self.row,full_text=self.text+"changed")
        result=court_record(self.root,row)
        self.assertIn("local_pdf_digest_or_format_mismatch",result["problems"])
        self.assertIn("full_text_digest_mismatch",result["problems"])
    def test_invalid_slug_and_url(self):
        self.assertEqual(court_record(self.root,dict(self.row,slug="../foo"))["slug"],"invalid")
        self.assertFalse(valid_official_url("https://sudrf.ru.evil.example/a"))
        self.assertFalse(valid_official_url("https://x:s@sudrf.ru/a"))
    def test_exact_field_hashes_are_not_signoff(self):
        fields=list(text_fields({"blocks":[{"text":"Правило"}]}))
        self.assertEqual(fields,[{"field":"blocks.0.text","sha256":digest("Правило".encode("utf-8")),"status":"requires_substantive_source_review"}])
        self.assertFalse(pdf_check(b"foo",digest(b"foo")))
