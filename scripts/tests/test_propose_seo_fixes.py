"""Tests for the strictly limited SEO redirect-autofix proposal builder."""
import json
import sys
import tempfile
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from propose_seo_fixes import proposed_changes, ORIGIN

class AutoFixTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root=Path(self.temp.name)
        p=self.root/"apps/web/src/data"
        p.mkdir(parents=True)
        self.file=p/"pages-0.json"
        self.original=[{"slug":"privatizaciya-zhilya","title":"Право","blocks":[
            {"kind":"h1","text":"Законная информация"},
            {"kind":"link","text":"Официальный источник","href":ORIGIN+"/old"},
            {"kind":"p","text":"Правовое разъяснение не должно меняться."}]}]
        self.file.write_text(json.dumps(self.original,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
        self.report={"site":ORIGIN,"sitemap_urls":[ORIGIN+"/privatizaciya-zhilya",ORIGIN+"/new"],
            "safe_redirect_candidates":[{"old":ORIGIN+"/old","new":ORIGIN+"/new","status":301,
               "observed_on":[ORIGIN+"/privatizaciya-zhilya"]}]}
    def tearDown(self):self.temp.cleanup()
    def test_only_href_changes(self):
        changes,patches=proposed_changes(self.report,self.root)
        self.assertEqual(len(changes),1)
        updated=json.loads(patches[self.file])
        self.assertEqual(updated[0]["blocks"][1]["href"],ORIGIN+"/new")
        self.assertEqual(updated[0]["blocks"][2]["text"],self.original[0]["blocks"][2]["text"])
        self.assertEqual(updated[0]["title"],self.original[0]["title"])
    def test_no_live_page_evidence(self):
        self.report["safe_redirect_candidates"][0]["observed_on"]=[ORIGIN+"/other"]
        self.assertEqual(proposed_changes(self.report,self.root)[0],[])
    def test_offsite_destination_rejected(self):
        self.report["safe_redirect_candidates"][0]["new"]="https://example.org/new"
        self.assertEqual(proposed_changes(self.report,self.root)[0],[])
    def test_missing_sitemap_fails_closed(self):
        self.report["sitemap_urls"]=[]
        with self.assertRaises(ValueError):proposed_changes(self.report,self.root)
    def test_unpublished_draft_not_edited(self):
        self.report["sitemap_urls"]=[ORIGIN+"/new"]
        self.assertEqual(proposed_changes(self.report,self.root)[0],[])
    def test_temporary_redirect_not_edited(self):
        self.report["safe_redirect_candidates"][0]["status"]=302
        self.assertEqual(proposed_changes(self.report,self.root)[0],[])

if __name__=="__main__":
    unittest.main()
