import assert from "node:assert/strict";

const base=process.env.DGI_TEST_BASE_URL || "http://127.0.0.1:3001";
const liveOrigin="https://example.org";
const cases=[
  {path:"/situatsii/dgi-no-response",title:"Ответ на обращение в ДГИ не получен"},
  {path:"/situatsii/social-tenancy-dispute",title:"Разногласия по социальному найму жилья"},
];

async function request(path) {
  const response=await fetch(base+path,{signal:AbortSignal.timeout(15000)});
  return {response,body:await response.text()};
}

for(const entry of cases){
  const {response,body}=await request(entry.path);
  assert.equal(response.status,200,`Expected 200 for ${entry.path}`);
  assert.match(body,new RegExp(entry.title),"H1 missing from "+entry.path);
  assert.ok(!response.headers.get("x-robots-tag")?.includes("noindex"),
    "A released public route still has X-Robots-Tag noindex");
  const canonical=liveOrigin+entry.path;
  assert.ok(body.includes('rel="canonical"')&&body.includes(canonical),
    "Canonical missing for "+entry.path);
  assert.ok(!/<meta[^>]+name="robots"[^>]+content="noindex/.test(body),
    "Released page accidentally indexed as preview");
  assert.match(body,/name="robots"[^>]+content="index, follow"/,
    "Approved live scenario needs page-level indexing");
  assert.match(body,/Официальные источники/);
  assert.match(body,/verified-scenario-intake/);
  console.log("LIVE_SMOKE_OK",entry.path,response.status);
}

const catalog=await request("/temy-zhilishchnogo-prava");
assert.equal(catalog.response.status,200);
for(const entry of cases)assert.ok(catalog.body.includes(entry.path),"Catalog missing "+entry.path);
assert.ok(catalog.body.includes("rel=\"canonical\""),"Catalog canonical missing");

const privateRoute=await request("/navigator-dgi");
assert.equal(privateRoute.response.status,404,"Private research must 404 under production flags");
const guessed=await request("/situatsii/unverified-new-recommendation");
assert.equal(guessed.response.status,404,"Unverified scenario slug should 404");

console.log("LIVE_SMOKE_ALL_OK",cases.length);
