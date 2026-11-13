import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { siteIsLive, siteOrigin } from "@/data/pages";
import { factualSocialMetadata } from "@/data/seo-social";
import verifiedScenarios from "@/data/dgi-verified-scenarios.json";
import {
  getNavigatorPreviewGroups,
  getNavigatorPreviewCrossTopicPages,
  getNavigatorPreviewForms,
} from "@/data/navigator-preview";

/**
 * Public source-neutral directory. All targets are already owner-released
 * pages. It does NOT publish the research-only intake, decide legal remedies
 * or introduce unreviewed legal propositions.
 */
export const dynamic = "force-dynamic";

const title = "Темы жилищного справочника Москвы";
const description = "Каталог опубликованных страниц о жилищных вопросах Москвы, судебных материалах и существующих формах документов.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  ...factualSocialMetadata("temy-zhilishchnogo-prava", title, description),
  alternates: siteIsLive ? { canonical: new URL("/temy-zhilishchnogo-prava", siteOrigin).toString() } : undefined,
  robots: { index: siteIsLive, follow: siteIsLive },
};

export default function PublicHousingTopicDirectory() {
  const groups = getNavigatorPreviewGroups();
  const otherPages = getNavigatorPreviewCrossTopicPages();
  const forms = getNavigatorPreviewForms();

  return (
    <PageShell variant="thematic">
      <section className="hero hero--thematic"><div className="container">
        <nav className="breadcrumb" aria-label="Навигационная цепочка">
          <Link href="/">Главная</Link><span>/</span><span aria-current="page">Все темы</span>
        </nav>
        <h1>Темы жилищного справочника</h1>
        <p className="hero-lead">Каталог существующих страниц и форм документов.</p>
      </div></section>

      <div className="container navigator-preview housing-public-directory" aria-label="Каталог существующих материалов">
        <p className="navigator-preview-note">
          Раздел группирует ранее опубликованные страницы. Наличие материала в каталоге
          не подтверждает актуальность изложенных на нём норм или применимость документа
          к конкретной ситуации. Проверяйте сведения в официальных источниках.
        </p>

        {verifiedScenarios.scenarios.length>0 && <section
          className="navigator-preview-research verified-public-scenarios"
          aria-labelledby="verified-public-scenarios-heading">
          <h2 id="verified-public-scenarios-heading">Ситуации с подтверждёнными правовыми источниками</h2>
          <p className="navigator-preview-note">
            Ниже размещены ситуации, для которых проверены отдельные правовые
            утверждения, исключения и шаблоны. Выбор документа зависит от
            ответов на вопросы, а не от общего названия темы.
          </p>
          <ul className="navigator-preview-directory">
            {verifiedScenarios.scenarios.map(scenario=>
              <li key={scenario.id}><Link href={"/situatsii/"+scenario.id}>
                {scenario.title}
              </Link></li>
            )}
          </ul>
        </section>}

        <h2>Тематические разделы</h2>
        <div className="navigator-preview-grid">
          {groups.map(group => (
            <section key={group.id} className="housing-public-directory-group" aria-labelledby={"directory-" + group.id}>
              <h3 id={"directory-" + group.id}>{group.title}</h3>
              <ul>{group.items.map(item =>
                <li key={item.href}><Link href={item.href}>{item.title}</Link></li>
              )}</ul>
            </section>
          ))}
        </div>

        <section className="navigator-preview-research" aria-labelledby="directory-other-pages">
          <h2 id="directory-other-pages">Другие материалы</h2>
          <ul className="navigator-preview-directory">{otherPages.map(item =>
            <li key={item.href}><Link href={item.href}>{item.title}</Link></li>
          )}</ul>
        </section>

        <section className="navigator-preview-research" aria-labelledby="directory-document-forms">
          <h2 id="directory-document-forms">Существующие формы документов</h2>
          <p className="navigator-preview-note">
            Ссылки ведут к страницам с уже имеющимися формами. Это не автоматический
            подбор документа и не подтверждение его юридической пригодности.
          </p>
          <ul className="navigator-preview-directory">{forms.map(form =>
            <li key={form.id}><Link href={form.href}>{form.title}</Link></li>
          )}</ul>
        </section>
      </div>
    </PageShell>
  );
}
