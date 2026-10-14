import {test} from "node:test";
import assert from "node:assert/strict";
import {selectPrivateSource} from "../src/lib/private-webflow-content";
const id="a".repeat(24);
const pinned={id,slug:"test",status:"draft" as const,verified:false as const};
const item=()=>({id,isDraft:true,lastUpdated:"2026-10-12T11:00:00Z",
  fieldData:{name:"Test",slug:"test","opisanie-problemy":"<p>Original</p>"}});
test("source preserved privately with digest",()=>{
  const v=selectPrivateSource("dgi-legal-situations",item(),pinned);
  assert.equal(v.sourceFields["opisanie-problemy"],"<p>Original</p>");
  assert.match(v.sourceDigest,/^[a-f0-9]{64}$/);
  assert.equal(v.sourceStatus,"draft");
});
test("slug, draft status and unknown keys are rejected",()=>{
  assert.throws(()=>selectPrivateSource("dgi-legal-situations",
    {...item(),isDraft:false},pinned));
  assert.throws(()=>selectPrivateSource("dgi-legal-situations",
    {...item(),fieldData:{...item().fieldData,slug:"other"}},pinned));
  assert.throws(()=>selectPrivateSource("dgi-legal-situations",
    {...item(),fieldData:{...item().fieldData,privatePhone:"000"}},pinned));
});
test("digest changes with text",()=>{
  const a=selectPrivateSource("dgi-legal-situations",item(),pinned);
  const b=selectPrivateSource("dgi-legal-situations",
    {...item(),fieldData:{...item().fieldData,"opisanie-problemy":"changed"}},pinned);
  assert.notEqual(a.sourceDigest,b.sourceDigest);
});
