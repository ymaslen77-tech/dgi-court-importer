import type { CollectionConfig } from 'payload'
import { isOfficialCourtLink } from '../lib/official-link'
export const CourtCases: CollectionConfig = {
  slug: 'court-cases', versions: { drafts: true }, admin: { useAsTitle: 'caseNumber' },
  access: { read: ({ req }) => req.user ? true : { and: [{ _status: { equals: 'published' } }, { verifiedAct: { equals: true } }] },
    create: ({ req }) => Boolean(req.user), update: ({ req }) => Boolean(req.user), delete: ({ req }) => Boolean(req.user) },
  hooks: { beforeChange: [({ data, originalDoc }) => {
    if (data.verifiedAct ?? originalDoc?.verifiedAct) {
      const url = data.officialActUrl ?? originalDoc?.officialActUrl
      const reviewedAt = data.reviewedAt ?? originalDoc?.reviewedAt
      if (!url || !isOfficialCourtLink(url) || !reviewedAt) throw new Error('Verified judicial act requires official document link and review date')
    }
    return data
  }] },
  fields: [ { name: 'caseNumber', type: 'text', required: true, index: true },
    { name: 'slug', type: 'text', required: true, unique: true }, { name: 'court', type: 'text', required: true, index: true },
    { name: 'caseUid', type: 'text', index: true }, { name: 'topic', type: 'text', index: true },
    { name: 'instance', type: 'select', options: ['first', 'appeal', 'cassation', 'supreme'] },
    { name: 'officialCaseUrl', type: 'text' }, { name: 'officialActUrl', type: 'text' },
    { name: 'verifiedAct', type: 'checkbox', defaultValue: false }, { name: 'reviewedAt', type: 'date' },
    { name: 'judgmentSummary', type: 'textarea' }, { name: 'reviewHistory', type: 'textarea' },
    { name: 'sourceWebflowId', type: 'text' },
  ],
}
