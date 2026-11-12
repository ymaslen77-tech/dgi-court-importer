import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { siteIsLive } from "@/data/pages";
import { getNavigatorPreviewGroups, getNavigatorPreviewScenarios, getNavigatorPreviewCrossTopicPages, getNavigatorPreviewForms, getNavigatorResearchFactQuestionnaires } from "@/data/navigator-preview";

// Private prototype, never a newly indexable or published legal page.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { absolute:"Навигатор жилищных тем — закрытый прототип" },
  description:"Навигационный прототип на основе уже опубликованных разделов справочника.",
  robots: { index: false, follow: false },
};

export default function NavigatorPreviewPage() {
  if (siteIsLive) notFound();
  const groups=getNavigatorPreviewGroups();
  const scenarios=getNavigatorPreviewScenarios();
  const crossTopicPages=getNavigatorPreviewCrossTopicPages();
  const forms=getNavigatorPreviewForms();
  const factQuestionnaires=getNavigatorResearchFactQuestionnaires();
  return <PageShell variant="thematic">
    <section className="hero hero--thematic"><div className="container">
      <nav className="breadcrumb" aria-label="Навигационная цепочка">
        <Link href="/">Главная</Link><span>/</span><span aria-current="page">Навигатор тем</span>
      </nav>
      <h1>Навигатор жилищных тем</h1>
      <p className="hero-lead">Выберите тему, чтобы перейти к существующим материалам справочника.</p>
    </div></section>
    <section className="container navigator-preview" aria-label="Темы жилищного справочника">
      <p className="navigator-preview-note">Это закрытый прототип навигации, а не инструмент определения прав, сроков или выбора способа защиты. Новые юридические рекомендации здесь не публикуются.</p>
      <div className="navigator-preview-grid">
        {groups.map(group=><details key={group.id} className="navigator-preview-group">
          <summary>{group.title}</summary>
          <ul>{group.items.map(item=><li key={item.href}>
            <Link href={item.href}>{item.title}</Link>
          </li>)}</ul>
        </details>)}
      </div>
      <div className="navigator-preview-research">
        <h2>Исследуемые ситуации</h2>
        <p className="navigator-preview-note">Ни один сценарий не содержит юридической рекомендации: до проверки утверждений по трём независимым официальным источникам показываются только уже существующие тематические материалы.</p>
        <div className="navigator-preview-grid">
          {scenarios.map(scenario=><details key={scenario.id} className="navigator-preview-scenario" data-research-status={scenario.evidenceStatus}>
            <summary>{scenario.title}</summary>
            <p className="navigator-preview-status">Проверка источников не завершена</p>
            <ul>{scenario.items.map(item=><li key={item.href}>
              <Link href={item.href}>{item.title}</Link>
            </li>)}</ul>
          </details>)}
        </div>
        <p className="navigator-preview-note">Связи с конкретными решениями судов и выбор процессуального документа появятся только после проверки правовых утверждений. <Link href="/sudebnaya-praktika-dgi">Общий каталог уже опубликованных судебных актов</Link>.</p>
      </div>
      <section className="navigator-preview-research" aria-labelledby="navigator-private-intake">
        <h2 id="navigator-private-intake">Исследовательские анкеты: известные факты</h2>
        <p className="navigator-preview-note">
          Эти вопросы не определяют права, сроки, порядок обжалования или необходимый документ.
          Они не требуют ФИО, адресов, дат и загрузки файлов. Ни одна анкета не отправляет ответы.
          Это закрытый черновик без индивидуальной юридической рекомендации.
        </p>
        <div className="navigator-preview-facts">
          {factQuestionnaires.map(scenario=><details key={scenario.id} className="navigator-preview-fact" data-research-status="research_only">
            <summary>{scenario.title}</summary>
            <div className="navigator-preview-fact-questions">
              {scenario.questions.map(question=><fieldset key={question.id}>
                <legend>{question.title}</legend>
                <div className="navigator-preview-fact-options">
                  {question.options.map((answer,index)=><label key={answer}>
                    <input type="radio" name={scenario.id + "-" + question.id}
                      value={String(index)} />
                    <span>{answer}</span>
                  </label>)}
                </div>
              </fieldset>)}
            </div>
          </details>)}
        </div>
        <p className="navigator-preview-note">
          Выбор варианта здесь не приводит к правовому выводу. Конкретные процедуры
          и судебные решения будут связаны с анкетами только после проверки источников.
        </p>
      </section>
      <section className="navigator-preview-research" aria-labelledby="navigator-existing-directory">
        <h2 id="navigator-existing-directory">Другие существующие справочные страницы</h2>
        <p className="navigator-preview-note">Перечень дополняет семь тематических групп до полного каталога 32 внутренних адресов исходного сайта. Главная страница учитывается отдельно. Раздел не означает повторной юридической проверки материалов.</p>
        <ul className="navigator-preview-directory">
          {crossTopicPages.map(item=><li key={item.href}><Link href={item.href}>{item.title}</Link></li>)}
        </ul>
      </section>
      <section className="navigator-preview-research" aria-labelledby="navigator-existing-forms">
        <h2 id="navigator-existing-forms">Существующие формы документов</h2>
        <p className="navigator-preview-note">Ниже указаны десять уже реализованных форм и страницы, на которых они размещены. Это каталог функций, а не подбор правильного документа для конкретной ситуации. Проверьте назначение и ограничения каждой формы до использования.</p>
        <ul className="navigator-preview-directory">
          {forms.map(item=><li key={item.id}><Link href={item.href}>{item.title}</Link></li>)}
        </ul>
      </section>
      <p className="navigator-preview-note">Содержание существующих страниц требует самостоятельной проверки актуальности. Наличие ссылки не означает юридического подтверждения её текста.</p>
    </section>
  </PageShell>;
}
