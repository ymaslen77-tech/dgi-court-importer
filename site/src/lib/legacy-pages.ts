import snapshot from '@/data/webflow-pages.json'
export type LegacyPage = { id: string; slug: string; title: string; seoTitle: string; seoDescription: string; isInternal: boolean }
export const legacyPages: readonly LegacyPage[] = snapshot
