import config from '@payload-config'
import { getPayload } from 'payload'

export type VerifiedPage = {
  title: string
  seoTitle?: string | null
  seoDescription?: string | null
  bodyText?: string | null
}

/** Never expose a draft even when the Local API is used from server code. */
export async function getVerifiedPage(slug: string): Promise<VerifiedPage | null> {
  if (!process.env.PAYLOAD_SECRET || !process.env.DATABASE_URL) return null
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'pages',
    where: { and: [{ slug: { equals: slug } }, { migrationStatus: { equals: 'editorial_verified' } }, { _status: { equals: 'published' } }] },
    limit: 1,
    overrideAccess: false,
  })
  const document = result.docs.at(0)
  if (!document || document.migrationStatus !== 'editorial_verified' || document._status !== 'published') return null
  return { title: document.title, seoTitle: document.seoTitle, seoDescription: document.seoDescription, bodyText: document.bodyText }
}
