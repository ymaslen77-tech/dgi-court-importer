import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { VerifiedCourtExplorer } from "@/components/VerifiedCourtExplorer";
import { factualSocialMetadata } from "@/data/seo-social";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Проверенные судебные решения по жилищным спорам Москвы" },
  description: "Поиск только подтверждённых решений суда по полным текстам, номерам дел и темам. Оригинальные PDF доступны для просмотра на странице.",
  ...factualSocialMetadata("sudebnaya-praktika-dgi",
    "Проверенные судебные решения по жилищным спорам Москвы",
    "Поиск по проверенным судебным актам с оригинальными PDF на сайте.", "website"),
  robots: { index: false, follow: false },
};

export default function CourtPracticePage() {
  return <PageShell variant="thematic">
    <section className="hero hero--thematic">
      <div className="container">
        <h1>Судебная практика по жилищным спорам</h1>
        <p className="hero-lead">Решения судов с проверенным текстом и официальным PDF. Ищите по теме, номеру дела или словам из судебного акта.</p>
      </div>
    </section>
    <VerifiedCourtExplorer />
  </PageShell>;
}
