#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const parts = [1,2,3,4].map(n => JSON.parse(fs.readFileSync(path.join(root,'migration','pages-part-'+n+'.json'),'utf8')));
const pages = parts.flat();
const cms = JSON.parse(fs.readFileSync(path.join(root,'migration/webflow-cms.json'),'utf8'));
assert.equal(pages.length,33,'Expected 33 published non-template pages');
assert.equal(new Set(pages.map(x => x.slug)).size,pages.length,'Page slugs must be unique');
assert.equal(pages.filter(x => x.slug === '').length,1,'Homepage must be present');
assert.ok(pages.every(x => typeof x.seo.title==='string' && Array.isArray(x.blocks)), 'Missing SEO/content');
assert.ok(pages.every(x => x.blocks.some(b => b.type==='h1')), 'Missing H1 in source page');
assert.equal(cms.collections.length,4);
const cases=cms.collections.find(x=>x.slug==='dgi-court-cases').items;
assert.equal(cases.length,37);
assert.equal(cases.filter(x=>!!x.lastPublished&&!x.isDraft).length,22);
const drafts=cases.filter(x=>x.isDraft).length;
assert.equal(drafts,15);
const docs=cms.collections.find(x=>x.slug==='dgi-legal-documents').items;
assert.equal(docs.length,4);
const situations=cms.collections.find(x=>x.slug==='dgi-legal-situations').items;
assert.equal(situations.length,6);
const news=cms.collections.find(x=>x.slug==='housing-law-news').items;
assert.equal(news.length,3);
console.log(JSON.stringify({ok:true,pages:pages.length,cms:cms.collections.length,cases:cases.length,publishedCases:22,drafts}));
