import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { VerifiedCourtExplorer } from "@/components/VerifiedCourtExplorer";
import { factualSocialMetadata } from "@/data/seo-social";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Положительная судебная практика по спорам с ДГИ Москвы" },
  description: "Только проверенные судебные акты, в которых требования заявителя к ДГИ удовлетворены полностью или частично. PDF-копии опубликованных текстов.",
  ...factualSocialMetadata("sudebnaya-praktika-dgi",
    "Проверенные судебные решения по жилищным спорам Москвы",
    "Поиск положительных решений по жилищным спорам и PDF-копий судебных актов.", "website"),
  robots: { index: false, follow: false },
};

export default function CourtPracticePage() {
  return <PageShell variant="thematic">
    <section className="hero hero--thematic">
      <div className="container">
        <h1>Положительная судебная практика</h1>
        <p className="hero-lead">Подборка дел, в которых требования граждан к ДГИ удовлетворены полностью или частично. Поиск по номеру, теме и тексту судебного акта. Это не полный реестр судебной практики.</p>
      </div>
    </section>
    <VerifiedCourtExplorer />
  </PageShell>;
}
