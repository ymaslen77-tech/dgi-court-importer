import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeApprovedPage } from "../src/lib/promotion";

const example = () => ({
  slug:"home",kind:"landing",title:"Жилищное право",seoTitle:"Жилищное право",
  seoDescription:"Guide",_status:"published",reviewState:"approved",
  reviewedAt:"2026-10-13T09:00:00.000Z",reviewedBy:15,
  blocks:[{kind:"h2",text:"Правовая помощь"}, {kind:"link",text:"Источник",href:"https://mos-gorsud.ru/"}],
  sourceUrls:[{url:"https://dgimos.webflow.io/"}],
});
test("only reviewed published pages reach the SQL projection",()=>{
  const p=normalizeApprovedPage(example());
  assert.equal(p.slug,"");
  assert.equal(p.reviewedBy,"payload-user:15");
  assert.equal(p.blocks.length,2);
  assert.equal(p.sourceUrl,"https://dgimos.webflow.io/");
});
test("drafts and unreviewed documents are rejected",()=>{
  assert.throws(()=>normalizeApprovedPage({...example(),_status:"draft"}));
  assert.throws(()=>normalizeApprovedPage({...example(),reviewState:"needs-review"}));
  assert.throws(()=>normalizeApprovedPage({...example(),reviewedAt:null}));
  assert.throws(()=>normalizeApprovedPage({...example(),reviewedBy:null}));
});
test("unsafe links, missing text and invalid URLs are rejected",()=>{
  assert.throws(()=>normalizeApprovedPage({...example(),blocks:[{kind:"link",text:"Unsafe",href:"javascript:alert(1)"}]}));
  assert.throws(()=>normalizeApprovedPage({...example(),sourceUrls:[{url:"http://example.com"}]}));
  assert.throws(()=>normalizeApprovedPage({...example(),blocks:[]}));
});

test("reviewed CMS articles can use their original two-segment collection URLs", () => {
  const p=normalizeApprovedPage({...example(),slug:"housing-law-news/moscow-update"});
  assert.equal(p.slug,"housing-law-news/moscow-update");
  assert.throws(()=>normalizeApprovedPage({...example(),slug:"housing-law-news//bad"}));
  assert.throws(()=>normalizeApprovedPage({...example(),slug:"../../bad"}));
});
