import type { Metadata } from "next";
import Link from "next/link";
import { courtFullTextReadsEnabled,listPublishedCourtActSummaries,courtActBasePath } from "@/data/court-fulltext";
import { PageShell } from "@/components/PageShell";
import { CourtExplorer, type CourtListing } from "@/components/CourtExplorer";
import { legacyCases, listOfficialCandidates } from "@/data/courts";
import { getMigratedPage } from "@/data/pages";
import { CourtDatabaseExplorer } from "@/components/CourtDatabaseExplorer";
import { factualSocialMetadata } from "@/data/seo-social";

const page = getMigratedPage("sudebnaya-praktika-dgi");
// When enabled, this is a dynamic database-backed view.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: page?.seoTitle || "Судебная практика Москвы" },
  description: page?.description || "Поиск карточек судебных дел по жилищным вопросам Москвы.",
  ...factualSocialMetadata("sudebnaya-praktika-dgi", page?.seoTitle || "Судебная практика Москвы", page?.description || "Поиск карточек судебных дел по жилищным вопросам Москвы.", "website"),
  robots: { index: false, follow: false },
};

export default async function CourtPracticePage() {
  const catalog = listOfficialCandidates();
  const snapshots: CourtListing[] = [
    ...legacyCases.map((c) => ({
      id: `legacy:${c.id}`,
      detailHref: `/dgi-court-cases/${c.slug}`,
      number: c.caseNumber,
      court: c.court,
      category: c.category,
      // A legacy URL can point to a generic court search (e.g. appeal-civil?page=14).
      // Do not present it as evidence of this specific judicial act.
      url: undefined,
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
  const databaseMode = process.env.COURT_DB_READS === "true";
  const hasPublishedCourtActs = courtFullTextReadsEnabled && (await listPublishedCourtActSummaries(1)).length>0;
  return (
    <PageShell variant="thematic">
      <section className="hero hero--thematic">
        <div className="container">
          <div className="hero-eyebrow">ЖИЛИЩНЫЕ СПОРЫ · СУДЕБНЫЕ ИСТОЧНИКИ</div>
          <h1>Судебная практика по делам ДГИ</h1>
          <p className="hero-lead">
            Ищите судебные дела по номеру, названию суда или теме спора.
            Для подтверждения результата необходимо ознакомиться с официальным судебным актом.
          </p>
          <p className="editorial-notice">Карточки приводятся для поиска и проверки. Дата, исход спора, мотивировка и дальнейшие инстанции не считаются подтверждёнными без официального текста судебного акта.</p>
        </div>
      </section>
      {hasPublishedCourtActs && <div className="container">
        <p className="article-p"><Link href={courtActBasePath}>Открыть полные тексты опубликованных судебных актов и поиск по формулировкам →</Link></p>
      </div>}
      {databaseMode ? <CourtDatabaseExplorer /> : <CourtExplorer cases={snapshots} />}
    </PageShell>
  );
}
