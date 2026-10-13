import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const pages = JSON.parse(readFileSync(new URL('../src/data/webflow-pages.json', import.meta.url), 'utf8'));

test('public Webflow slugs are preserved without duplicates', () => {
  assert.ok(pages.length >= 30);
  assert.equal(new Set(pages.map((p) => p.slug)).size, pages.length);
  for (const p of pages) {
    assert.match(p.slug, /^[a-z0-9-]+$/);
    assert.ok(p.webflowId);
    assert.ok(p.title.length > 10);
    assert.ok(!p.slug.startsWith('detail_'));
  }
});
test('pilot pages match the accepted migration scope', () => {
  const ready = pages.filter((p) => p.migrated).map((p) => p.slug).sort();
  assert.deepEqual(ready, ['kontakty-dgi', 'privatizaciya-zhilya', 'zhaloba-na-dgi-moskvy']);
  assert.ok(pages.some((p) => p.slug === 'sudebnaya-praktika-dgi' && !p.migrated));
});
