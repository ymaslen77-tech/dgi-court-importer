import part1 from '../../../../migration/pages-part-1.json';
import part2 from '../../../../migration/pages-part-2.json';
import part3 from '../../../../migration/pages-part-3.json';
import part4 from '../../../../migration/pages-part-4.json';

export type PageBlock = {
  type: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'li';
  text: string;
};
export type SourceLink = { label: string; href: string };
export type SourcePage = {
  webflowId: string;
  slug: string;
  title: string;
  seo: { title: string; description: string };
  blocks: PageBlock[];
  links: SourceLink[];
};

const pages = [...part1, ...part2, ...part3, ...part4] as SourcePage[];
const bySlug = new Map(pages.map((page) => [page.slug, page]));

export function getPages(): readonly SourcePage[] {
  return pages;
}

export function getPage(slug: string): SourcePage | undefined {
  // No generated or user-supplied slug is used in a filesystem query.
  return bySlug.get(slug);
}

export function getPageHeading(page: SourcePage): string {
  if (page.slug === '') return 'Единая справочная служба Москвы по жилищным вопросам';
  return page.blocks.find((block) => block.type === 'h1')?.text || page.title;
}

export function safeHref(href: string): string | null {
  if (href.startsWith('/') && !href.startsWith('//')) return href;
  if (href.startsWith('#')) return href;
  try {
    const parsed = new URL(href);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    if (['dgimos.webflow.io', 'rpn-585571.webflow.io'].includes(parsed.hostname)) {
      return parsed.pathname + parsed.search + parsed.hash;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export const primaryNav = [
  { label: 'Жилищный учёт', href: '/zhilishchnyj-uchet' },
  { label: 'Приватизация', href: '/privatizaciya-zhilya' },
  { label: 'Социальный наём', href: '/socialnyj-naem' },
  { label: 'Судебная практика', href: '/sudebnaya-praktika-dgi' },
  { label: 'Новости', href: '/novosti-zhilishchnogo-prava' },
] as const;

export const topicCards = [
  { title: 'Приватизация квартиры', href: '/privatizaciya-zhilya', desc: 'Участники, документы, отказы и судебная защита', number: '01' },
  { title: 'Жилищный учёт и очередь', href: '/zhilishchnyj-uchet', desc: 'Постановка, перерегистрация, снятие с учёта', number: '02' },
  { title: 'Социальный наём', href: '/socialnyj-naem', desc: 'Права членов семьи и споры о проживании', number: '03' },
  { title: 'Реновация Москвы', href: '/renovaciya-pereselenie', desc: 'Переселение, квартира взамен, оформление', number: '04' },
  { title: 'Споры с ДГИ', href: '/spory-s-dgi', desc: 'Отказ, обжалование, документы, судебные дела', number: '05' },
  { title: 'Документы на квартиру', href: '/dokumenty-na-kvartiru', desc: 'Подтверждение прав и архивные сведения', number: '06' },
] as const;
