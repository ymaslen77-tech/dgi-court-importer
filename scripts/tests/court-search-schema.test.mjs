import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
const migration=readFileSync(new URL("../../db/migrations/0004_court_search.sql",import.meta.url),"utf8");
test("court search uses PostgreSQL indexes for text and case number",()=>{
 assert.match(migration,/pg_trgm/);
 assert.match(migration,/gin_trgm_ops/);
 assert.match(migration,/to_tsvector\('russian'/);
});
