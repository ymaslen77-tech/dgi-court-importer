import type { CollectionConfig } from 'payload'
export const News: CollectionConfig = {
  slug: 'news', versions: { drafts: true }, admin: { useAsTitle: 'title' },
  access: { read: ({ req }) => req.user ? true : { _status: { equals: 'published' }, checkedByEditor: { equals: true } },
    create: ({ req }) => Boolean(req.user), update: ({ req }) => Boolean(req.user), delete: ({ req }) => Boolean(req.user) },
  fields: [ { name: 'title', type: 'text', required: true }, { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'summary', type: 'textarea' }, { name: 'originalSourceUrl', type: 'text', required: true },
    { name: 'sourcePublishedAt', type: 'date' },
    { name: 'legalStatus', type: 'select', required: true, options: [
      { label: 'Proposal', value: 'proposal' }, { label: 'Effective regulation', value: 'effective' },
      { label: 'Court decision', value: 'court' }, { label: 'Explanation', value: 'explanation' }] },
    { name: 'analysis', type: 'textarea' }, { name: 'checkedByEditor', type: 'checkbox', defaultValue: false },
  ],
}
