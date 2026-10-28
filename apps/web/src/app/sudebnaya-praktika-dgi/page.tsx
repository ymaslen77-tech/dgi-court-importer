import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { VerifiedCourtExplorer } from "@/components/VerifiedCourtExplorer";
import { factualSocialMetadata } from "@/data/seo-social";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Судебная практика по спорам с ДГИ Москвы" },
  description: "Официально опубликованные судебные акты по спорам с ДГИ: удовлетворённые и отклонённые требования, смешанные результаты и направления на новое рассмотрение. PDF-копии текстов.",
  ...factualSocialMetadata("sudebnaya-praktika-dgi",
    "Судебные решения по спорам с ДГИ Москвы",
    "Поиск по всем исходам судебных дел и PDF-копиям опубликованных актов.", "website"),
  robots: { index: false, follow: false },
};

export default function CourtPracticePage() {
  return <PageShell variant="thematic">
    <section className="hero hero--thematic">
      <div className="container">
        <h1>Судебная практика по спорам с ДГИ</h1>
        <p className="hero-lead">Каталог судебных актов с любым исходом: удовлетворение требований, отказ, частичное удовлетворение и направление дела на новое рассмотрение. Поиск по номеру, теме и тексту. Результат отдельных дел может требовать ознакомления с полным актом; это не полный реестр судов.</p>
      </div>
    </section>
    <VerifiedCourtExplorer />
  </PageShell>;
}
