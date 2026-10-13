import type { CollectionConfig } from 'payload'
export const Pages: CollectionConfig = {
  slug: 'pages', admin: { useAsTitle: 'title' }, versions: { drafts: true },
  access: {
    read: ({ req }) => req.user ? true : { _status: { equals: 'published' }, migrationStatus: { equals: 'editorial_verified' } },
    create: ({ req }) => Boolean(req.user), update: ({ req }) => Boolean(req.user), delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: 'title', type: 'text', required: true }, { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'description', type: 'textarea' }, { name: 'seoTitle', type: 'text' }, { name: 'seoDescription', type: 'textarea' },
    { name: 'bodyText', type: 'textarea', admin: { description: 'Editorial text; do not paste raw unverified HTML.' } },
    { name: 'webflowPageId', type: 'text', index: true }, { name: 'originalUrl', type: 'text' },
    { name: 'migrationStatus', type: 'select', required: true, defaultValue: 'metadata_only', options: [
      { label: 'SEO metadata only', value: 'metadata_only' },
      { label: 'Content imported, pending review', value: 'content_imported' },
      { label: 'Content checked by editor', value: 'editorial_verified' },
    ] },
  ],
}
