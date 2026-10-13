import source from '../../../../migration/webflow-cms.json';

type CmsItem = {
  id: string;
  isDraft: boolean;
  isArchived: boolean;
  lastPublished?: string | null;
  fieldData: Record<string, unknown>;
};
type CmsCollection = { slug: string; items: CmsItem[] };

const collections = source.collections as CmsCollection[];
const courts = collections.find((x) => x.slug === 'dgi-court-cases')?.items || [];

function asString(input: unknown): string {
  return typeof input === 'string' ? input : '';
}
export type CourtCard = {
  id: string;
  slug: string;
  title: string;
  number: string;
  court: string;
  topic: string;
  source: string | null;
  status: string;
  lastPublished?: string | null;
};

export function publicCourts(): CourtCard[] {
  return courts.filter((item) => item.lastPublished && !item.isDraft && !item.isArchived).map((item) => {
    const data = item.fieldData;
    const source = asString(data['oficialnyy-istochnik']);
    return {
      id: item.id,
      slug: asString(data.slug),
      title: asString(data.name),
      number: asString(data['nomer-dela']),
      court: asString(data.sud),
      topic: asString(data['kategoriya-spora']),
      source: /^https:\/\//.test(source) ? source : null,
      status: asString(data['status-verifikacii']) || 'unverified',
      lastPublished: item.lastPublished,
    };
  }).filter((caseItem) => caseItem.slug);
}
export function publicCourtBySlug(slug: string): CourtCard | undefined {
  return publicCourts().find((item) => item.slug === slug);
}
