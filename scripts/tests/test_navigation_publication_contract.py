"""Adversarial, fully synthetic tests; no fake URL is a legal citation."""
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from validate_three_source_publication import (
    PUBLIC_DIRECTORY_ROUTE, PUBLIC_NAVIGATION_BLOBS, PUBLIC_NAVIGATION_SOURCE_BLOBS,
    content_blob_sha, verify_public_navigation_contract, check_new_public_routes,
    block_unverified_template_edits,
)

class NavigationContractTests(unittest.TestCase):
    def setUp(self):
        self.route=PUBLIC_DIRECTORY_ROUTE
        self.home="apps/web/src/app/page.tsx"
        self.sitemap="apps/web/src/app/sitemap.ts"
        self.shell="apps/web/src/components/PageShell.tsx"
        self.data="apps/web/src/data/navigator-preview.ts"
        self.owner="apps/web/src/data/owner-released-legacy-pages.json"
        self.sources={
            self.route:"export const metadata={description:'Catalog of existing topics'}; export default function Page(){return <a href='/topic'>Existing title</a>}",
            self.home:"export default function Home(){return <a href='/temy-zhilishchnogo-prava'>Topics</a>}",
            self.sitemap:"export default async function sitemap(){if(!siteIsLive)return[]; return [{url:'/temy-zhilishchnogo-prava'}]}",
            self.shell:"export function PageShell(){return <footer><a href='/temy-zhilishchnogo-prava'>Topics</a></footer>}",
            self.data:"export const knownPages=[{slug:'released',title:'Existing topic'}];",
            self.owner:'{"approved_existing_slugs":["","released"]}',
        }
        for index in range(6):
            self.sources[f"apps/web/src/data/pages-{index}.json"]='[{"slug":"released","title":"Original title"}]'
        self.public={path:content_blob_sha(self.sources[path]) for path in
                     (self.route,self.home,self.shell,self.sitemap)}
        self.provenance={path:content_blob_sha(self.sources[path]) for path in
                         self.sources if path not in self.public}
        self.p1=patch.dict(PUBLIC_NAVIGATION_BLOBS,self.public,clear=True)
        self.p2=patch.dict(PUBLIC_NAVIGATION_SOURCE_BLOBS,self.provenance,clear=True)
        self.p1.start();self.p2.start()
    def tearDown(self):
        self.p2.stop();self.p1.stop()
    def reader(self,revision,path):
        return self.sources[path]
    def check(self,changed):
        return check_new_public_routes("base","head",changed,self.reader)

    def test_neutral_exact_snapshots_and_all_imported_titles_match(self):
        approved=self.check([self.route,self.home,self.sitemap,self.shell])
        self.assertEqual(approved,{self.route,self.home,self.sitemap,self.shell})
        block_unverified_template_edits([])
    def test_changed_public_meta_description_blocks(self):
        self.sources[self.route]=self.sources[self.route].replace("existing topics","a legal entitlement")
        with self.assertRaisesRegex(ValueError,"metadata changed"):
            self.check([self.route])
    def test_unreviewed_legal_copy_in_new_page_blocks(self):
        self.sources[self.route]+="; export const advice='You always win in court'"
        with self.assertRaisesRegex(ValueError,"metadata changed"):
            self.check([self.route])
    def test_hidden_alternate_ssr_branch_blocks(self):
        self.sources[self.route]+="; if(process.env.NODE_ENV==='production'){return <p>unreviewed</p>}"
        with self.assertRaisesRegex(ValueError,"metadata changed"):
            self.check([self.route])
    def test_dynamic_label_override_blocks(self):
        self.sources[self.route]=self.sources[self.route].replace("Existing title","{getSecretLegalClaim()}")
        with self.assertRaisesRegex(ValueError,"metadata changed"):
            self.check([self.route])
    def test_renamed_link_blocks(self):
        self.sources[self.shell]=self.sources[self.shell].replace("/temy-zhilishchnogo-prava","https://attacker.invalid")
        with self.assertRaisesRegex(ValueError,"unapproved"):
            self.check([self.shell])
    def test_changed_home_copy_blocks(self):
        self.sources[self.home]+="\n// injected legal text"
        with self.assertRaisesRegex(ValueError,"unapproved"):
            self.check([self.home])
    def test_changed_imported_title_or_data_helper_blocks(self):
        self.sources[self.data]+="\nexport const madeUpLegalRule='unverified';"
        with self.assertRaisesRegex(ValueError,"unapproved"):
            self.check([self.data])
    def test_changed_owner_release_allowlist_blocks(self):
        self.sources[self.owner]=self.sources[self.owner].replace("released","unreviewed")
        with self.assertRaisesRegex(ValueError,"unapproved"):
            self.check([self.owner])
    def test_changed_legacy_migrated_page_titles_block(self):
        self.sources["apps/web/src/data/pages-2.json"]='[{"slug":"released","title":"Edited legal title"}]'
        with self.assertRaisesRegex(ValueError,"unapproved"):
            self.check(["apps/web/src/data/pages-2.json"])
    def test_unknown_new_route_is_not_allowlisted(self):
        p="apps/web/src/app/unreviewed/page.tsx"
        self.sources[p]="export default function Page(){return <p>Some new claim</p>}"
        with self.assertRaisesRegex(ValueError,"New public route"):
            self.check([p])
    def test_unreviewed_component_still_fails(self):
        with self.assertRaisesRegex(ValueError,"Runtime legal content"):
            block_unverified_template_edits(["apps/web/src/components/UnreviewedLegal.tsx"])
    def test_missing_imported_data_blocks(self):
        del self.sources[self.data]
        with self.assertRaisesRegex(ValueError,"Missing source-bound"):
            self.check([self.route])
    def test_missing_public_template_blocks(self):
        del self.sources[self.route]
        with self.assertRaisesRegex(ValueError,"requires exact route"):
            self.check([self.home])
    def test_unrelated_private_research_can_stay_private(self):
        # A standalone private route still has to satisfy the preexisting 404.
        p="apps/web/src/app/navigator-dgi/page.tsx"
        self.sources[p]='if (siteIsLive) notFound(); robots: {index: false, follow: false};'
        self.assertEqual(self.check([p]),set())
    def test_git_blob_digest_matches_git_object_format(self):
        self.assertEqual(content_blob_sha("test content"),"08cf6101416f0ce0dda3c80e627f333854c4085c")

if __name__=="__main__":
    unittest.main()
