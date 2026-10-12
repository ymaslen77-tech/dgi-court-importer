import Link from "next/link";
import type { Metadata } from "next";
import { getCourtCandidates } from "@/lib/court-catalog";
import { robotsRule } from "@/lib/seo";

export const runtime = "nodejs";
export const metadata: Metadata = {
  title: "Судебная практика Москвы — поиск жилищных дел",
  description: "Поиск по номерам дел, судам, темам и официальным карточкам судебных производств. Результаты актов требуют проверки.",
  robots: robotsRule, alternates: { canonical: "/sudebnaya-praktika-dgi" },
};
type Props = { searchParams: Promise<{ q?: string; topic?: string; page?: string }> };
const perPage = 10;
export default async function CourtCasesPage({ searchParams }: Props) {
  const search = await searchParams;
  const q = (search.q || "").trim().slice(0, 120).toLocaleLowerCase("ru");
  const topic = (search.topic || "").slice(0, 90);
  const all = await getCourtCandidates();
  const topics = Array.from(new Set(all.flatMap((x) => x.topics))).sort((a,b) => a.localeCompare(b,"ru"));
  const matches = all.filter((row) => {
    if (topic && !row.topics.includes(topic)) return false;
    if (!q) return true;
    return [row.number, row.court, row.category, row.uid, ...row.topics]
      .join(" ").toLocaleLowerCase("ru").includes(q);
  });
  const requested = Number(search.page || "1");
  const maxPages = Math.max(1, Math.ceil(matches.length / perPage));
  const page = Number.isInteger(requested) ? Math.max(1, Math.min(requested,maxPages)) : 1;
  const paramsFor = (n: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q",q);
    if (topic) params.set("topic",topic);
    params.set("page",String(n));
    return "/sudebnaya-praktika-dgi?" + params.toString();
  };
  return <main>
    <section className="inner-hero"><div className="wrap"><p className="eyebrow">ПОИСК / СУДЕБНАЯ ПРАКТИКА</p><h1>Судебная практика по жилищным вопросам.</h1><p>Проверяемые карточки дел. Исходы решений не заявляются без изучения первичного судебного акта.</p></div></section>
    <section className="section"><div className="wrap">
      <form role="search" className="court-filter" method="get">
        <label htmlFor="q">Номер дела, суд или ключевое слово<input id="q" name="q" defaultValue={search.q || ""} maxLength={120} placeholder="Например: выселение, 88-522/2026"/></label>
        <label htmlFor="topic">Категория<select id="topic" name="topic" defaultValue={topic}><option value="">Все категории</option>{topics.map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
        <button type="submit" className="button button-red">НАЙТИ ДЕЛА</button>
      </form>
      <p className="result-count">Найдено карточек-кандидатов: <strong>{matches.length}</strong>. Они ещё не являются проверенными публикациями судебных актов.</p>
      <div className="court-list">{matches.slice((page-1)*perPage,page*perPage).map((item) =>
        <article key={item.id} className="court-card">
          <p className="eyebrow eyebrow-light">{item.topics.join(" · ")}</p>
          <h2>Дело № {item.number}</h2>
          <p><strong>Суд:</strong> {item.court}</p>
          {item.uid && <p><strong>УИД:</strong> {item.uid}</p>}
          <p><strong>Правовая категория:</strong> {item.category}</p>
          <p className="review-warning">Текст судебного акта и исход дела не проверены редакцией.</p>
          <a href={item.official_case_url} target="_blank" rel="noopener noreferrer">ОТКРЫТЬ КАРТОЧКУ НА САЙТЕ СУДА ↗</a>
        </article>)}</div>
      {matches.length === 0 && <p>По этим параметрам карточки не найдены. Попробуйте более общий запрос.</p>}
      {maxPages > 1 && <nav className="pager" aria-label="Страницы результатов">
        {page > 1 && <Link href={paramsFor(page-1)}>← Назад</Link>}
        <span>Страница {page} из {maxPages}</span>
        {page < maxPages && <Link href={paramsFor(page+1)}>Вперёд →</Link>}
      </nav>}
      <p className="editorial-note">Это индекс кандидатов из официальных источников, а не полный реестр судов России. Прежние проверенные материалы Webflow будут перенесены отдельной редакционной миграцией.</p>
    </div></section>
  </main>;
}
