import { getPayload } from 'payload'
import config from '../src/payload.config'
import pages from '../src/data/webflow-pages.json'

// Running without --execute prints the intended changes. No published content is created.
const execute = process.argv.includes('--execute')
const candidates = pages.filter((page) => page.slug && !page.isInternal)
if (!execute) {
  console.log(JSON.stringify({ mode: 'dry-run', source: 'Webflow metadata snapshot', total: candidates.length, slugs: candidates.map(page => page.slug) }, null, 2))
} else {
  if (!process.env.DATABASE_URL || !process.env.PAYLOAD_SECRET) throw new Error('DATABASE_URL and PAYLOAD_SECRET required')
  const payload = await getPayload({ config })
  let created = 0
  let unchanged = 0
  for (const page of candidates) {
    const existing = await payload.find({ collection: 'pages', where: { slug: { equals: page.slug } }, limit: 1, depth: 0 })
    if (existing.totalDocs) { unchanged++; continue }
    await payload.create({ collection: 'pages', draft: true, data: {
      title: page.title, slug: page.slug, seoTitle: page.seoTitle,
      seoDescription: page.seoDescription, webflowPageId: page.id,
      originalUrl: 'https://dgimos.webflow.io/' + page.slug,
      migrationStatus: 'metadata_only',
    } })
    created++
  }
  console.log(JSON.stringify({ mode: 'draft-only', created, unchanged, published: 0 }))
}
