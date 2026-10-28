"use client";

import { useEffect, useRef, useState } from "react";
import type { VerifiedCase } from "@/data/verified-courts";

type SearchResult = { items: VerifiedCase[] };
const outcomeLabels: Record<string, string> = {
  applicant_granted: "Требования гражданина удовлетворены",
  applicant_partially_granted: "Требования удовлетворены частично",
  claim_granted: "Иск удовлетворён",
  claim_denied: "В иске отказано",
  mixed: "Смешанный результат",
  remanded: "Направлено на новое рассмотрение",
  not_classified: "Исход — см. текст судебного акта",
};
const actNames: Record<string, string> = {
  decision: "Решение", ruling: "Определение", judgment: "Приговор",
  order: "Постановление", other: "Судебный акт",
};

export function VerifiedCourtExplorer() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<VerifiedCase[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [active, setActive] = useState<VerifiedCase | null>(null);
  const dialogClose = useRef<HTMLButtonElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setBusy(true); setError("");
      try {
        const response = await fetch("/api/courts/verified?q=" + encodeURIComponent(query.trim()), {
          signal: controller.signal, cache: "no-store",
        });
        if (!response.ok) throw new Error("Не удалось выполнить поиск");
        const data = await response.json() as SearchResult;
        if (!Array.isArray(data.items)) throw new Error("Некорректный ответ");
        setItems(data.items);
      } catch (cause) {
        if (controller.signal.aborted) return;
        setItems([]);
        setError(cause instanceof Error ? cause.message : "Ошибка поиска");
      } finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    }, query ? 280 : 0);
    return () => { controller.abort(); window.clearTimeout(timeout); };
  }, [query]);

  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogClose.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", handleKey);
      searchInput.current?.focus();
    };
  }, [active]);

  return <section className="container verified-courts">
    <form role="search" className="verified-search" onSubmit={e => e.preventDefault()}>
      <label htmlFor="verified-case-q">Поиск по тексту решения, номеру дела, суду и теме</label>
      <input ref={searchInput} id="verified-case-q" type="search" value={query}
        autoComplete="off" maxLength={100} onChange={e => setQuery(e.target.value)}
        placeholder="Например: отказ в приватизации, жилищный учёт, выселение" />
      <p>Результаты обновляются при вводе запроса.</p>
    </form>
    <p className="results-count" role="status" aria-live="polite">
      {busy ? "Поиск…" : error ? error :
        items.length ? `Найдено судебных актов: ${items.length}` :
        query.trim() ? "По вашему запросу судебных актов пока нет." :
        "Судебные акты пока не опубликованы."}
    </p>
    {!busy && !error && items.length === 0 && <div className="verified-empty">
      <p>В каталоге размещаются официально опубликованные судебные акты с различными исходами. PDF является копией для чтения, а не заверенным судом документом.</p>
      <a href="https://mos-gorsud.ru/search" target="_blank" rel="noopener noreferrer">
        Поиск на официальном портале московских судов ↗
      </a>
    </div>}
    {items.length > 0 && <div className="verified-case-grid">
      {items.map(item => <article className="verified-case" key={item.slug}>
        <div className="verified-case-meta"><span>{outcomeLabels[item.outcome_verified] || outcomeLabels.not_classified}</span>
          <time dateTime={item.decision_date}>{item.decision_date}</time></div>
        <h2>{actNames[item.act_type] || "Судебный акт"} по делу № {item.case_number}</h2>
        <p>{item.court_name}</p>
        <p className="verified-case-topic">{item.topic}</p>
        <p className="verified-outcome-summary">{item.outcome_evidence}</p>
        {query.trim() && item.excerpt && <p className="verified-excerpt">{item.excerpt}</p>}
        <div className="verified-case-actions">
          <button type="button" onClick={() => setActive(item)}>Открыть PDF решения</button>
          <a href={item.official_url} target="_blank" rel="noopener noreferrer">
            Источник ↗
          </a>
        </div>
      </article>)}
    </div>}
    {active && <div className="court-pdf-overlay" role="presentation"
      onMouseDown={event => { if (event.target === event.currentTarget) setActive(null); }}>
      <div className="court-pdf-dialog" role="dialog" aria-modal="true"
        aria-label={`Судебный акт по делу № ${active.case_number}`}>
        <header className="court-pdf-header">
          <div><strong>Дело № {active.case_number}</strong><span>{active.court_name}</span>{active.pdf_origin === "site_rendered_copy" && <span>PDF-копия текста, опубликованного судом. Не заверенный судом оригинал.</span>}</div>
          <div className="court-pdf-actions">
            <a href={active.official_pdf_url} target="_blank" rel="noopener noreferrer">Официальный текст суда ↗</a>
            <button type="button" ref={dialogClose} onClick={() => setActive(null)}
              aria-label="Закрыть PDF">Закрыть ✕</button>
          </div>
        </header>
        <iframe className="court-pdf-frame" title={`PDF: дело № ${active.case_number}`}
          src={`/api/courts/verified/${encodeURIComponent(active.slug)}/pdf`} />
      </div>
    </div>}
  </section>;
}
