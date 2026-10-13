import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { CourtExplorer, type CourtListing } from "@/components/CourtExplorer";
import { legacyCases, listOfficialCandidates } from "@/data/courts";
import { canonicalUrl, getMigratedPage, siteIsLive } from "@/data/pages";

const page = getMigratedPage("sudebnaya-praktika-dgi");

export const metadata: Metadata = {
  title: { absolute: page?.seoTitle || "Судебная практика Москвы" },
  description: page?.description || "Поиск карточек судебных дел по жилищным вопросам Москвы.",
  alternates: page ? { canonical: canonicalUrl(page) } : undefined,
  robots: siteIsLive ? { index: true, follow: true } : { index: false, follow: false },
};

export default function CourtPracticePage() {
  const catalog = listOfficialCandidates();
  const entries: CourtListing[] = [
    ...legacyCases.map((c) => ({
      id: `legacy:${c.id}`,
      number: c.caseNumber,
      court: c.court,
      category: c.category,
      url: c.officialUrl || undefined,
      source: "published-legacy" as const,
    })),
    ...catalog.map((c) => ({
      id: `candidate:${c.id}`,
      number: c.number,
      court: c.court,
      category: c.category,
      url: c.official_case_url,
      source: "official-candidate" as const,
    })),
  ];
  return (
    <PageShell>
      <section className="hero">
        <div className="container">
          <div className="hero-eyebrow">ЖИЛИЩНЫЕ СПОРЫ · СУДЕБНЫЕ ИСТОЧНИКИ</div>
          <h1>Судебная практика по жилищным вопросам Москвы</h1>
          <p className="hero-lead">
            Поиск по номеру дела, суду и категории. Архив Webflow и новые официальные карточки
            показаны раздельно по происхождению. Наличие дела не подтверждает содержание решения.
          </p>
        </div>
      </section>
      <CourtExplorer cases={entries} />
    </PageShell>
  );
}
