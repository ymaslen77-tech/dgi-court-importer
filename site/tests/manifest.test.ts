import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const pages = JSON.parse(readFileSync(new URL('../src/data/webflow-pages.json', import.meta.url), 'utf8')) as Array<{ id: string; slug: string; title: string; seoTitle: string; isInternal: boolean }>
test('Webflow snapshot preserves one homepage, unique safe routes, and stable source ids', () => {
  assert.ok(pages.length >= 30)
  assert.equal(pages.filter(x => x.slug === '').length, 1)
  assert.equal(new Set(pages.map(x => x.slug)).size, pages.length)
  assert.equal(new Set(pages.map(x => x.id)).size, pages.length)
  for (const p of pages) {
    assert.match(p.slug, /^[a-z0-9-]*$/)
    assert.ok(p.title.trim())
    assert.ok(p.seoTitle.trim())
    assert.equal(p.isInternal, false)
  }
})
test('key historic addresses retained', () => {
  for (const slug of ['privatizaciya-zhilya', 'socialnyj-naem', 'sudebnaya-praktika-dgi', 'kontakty-dgi', 'novosti-zhilishchnogo-prava', 'zhaloba-na-dgi-moskvy']) {
    assert.ok(pages.some(p => p.slug === slug), 'Missing: ' + slug)
  }
})
