"use client";

import { useMemo, useState } from "react";

export type CourtListing = {
  id: string;
  number: string;
  court: string;
  category: string;
  url?: string;
  source: "published-legacy" | "official-candidate";
};

export function CourtExplorer({ cases }: { cases: CourtListing[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const categories = useMemo(() => [...new Set(cases.map((item) => item.category).filter(Boolean))].sort(), [cases]);
  const visible = useMemo(() => {
    const search = query.trim().toLocaleLowerCase("ru");
    return cases.filter((item) =>
      (category === "all" || item.category === category) &&
      (!search || [item.number, item.court, item.category].join(" ").toLocaleLowerCase("ru").includes(search)),
    );
  }, [query, category, cases]);

  return (
    <div className="container court-browser">
      <div className="filter-row">
        <label htmlFor="case-search">
          Поиск по номеру дела, суду или категории
          <input id="case-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Например, 88-21277/2026" />
        </label>
        <label htmlFor="case-category">
          Категория
          <select id="case-category" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">Все категории</option>
            {categories.map((item) => <option value={item} key={item}>{item}</option>)}
          </select>
        </label>
      </div>
      <p className="results-count" aria-live="polite">Найдено карточек: {visible.length}. Результаты судебных дел не подтверждены без текста соответствующего акта.</p>
      <div className="case-grid">
        {visible.map((item) => (
          <article className="case-card" key={item.id}>
            <p className="case-tag">{item.source === "official-candidate" ? "ОФИЦИАЛЬНАЯ КАРТОЧКА · ТРЕБУЕТ ПРОВЕРКИ" : "АРХИВ WEBFLOW · ВТОРИЧНЫЙ ИСТОЧНИК"}</p>
            <h2>Дело № {item.number || "номер уточняется"}</h2>
            <p>{item.court || "Суд уточняется"}</p>
            <p className="case-category">{item.category || "Категория требует проверки"}</p>
            {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer">Открыть источник ↗</a>}
          </article>
        ))}
      </div>
      {!visible.length && <p>По выбранным фильтрам карточек нет. Попробуйте другой номер или категорию.</p>}
    </div>
  );
}
