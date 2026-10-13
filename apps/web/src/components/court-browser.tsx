'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { CourtCard } from '@/lib/courts';

export function CourtBrowser({ cases }: { cases: CourtCard[] }) {
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('all');
  const topics = useMemo(() => [...new Set(cases.map(x => x.topic).filter(Boolean))].sort((a,b) => a.localeCompare(b,'ru')), [cases]);
  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('ru');
    return cases.filter((c) => (topic === 'all' || c.topic === topic) &&
      (!q || [c.number,c.title,c.court,c.topic].join(' ').toLocaleLowerCase('ru').includes(q)));
  }, [cases, topic, query]);
  return <>
    <form className="court-search" role="search" onSubmit={(event) => event.preventDefault()}>
      <label>Номер дела, суд или предмет спора
        <input type="search" placeholder="Например, 02-4422/2026" value={query}
          onChange={(event) => setQuery(event.target.value)} />
      </label>
      <label>Категория
        <select value={topic} onChange={(event) => setTopic(event.target.value)}>
          <option value="all">Все категории</option>
          {topics.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
      </label>
    </form>
    <p className="court-count" aria-live="polite">Найдено карточек: {filtered.length} из {cases.length}. Только ранее опубликованные записи Webflow.</p>
    {filtered.length === 0
      ? <div className="empty-results">По заданным параметрам дел не найдено. Измените номер или категорию.</div>
      : <div className="court-grid">{filtered.map((c) => <article key={c.id} className="court-card">
        <span className="meta-line">{c.number || 'Номер уточняется'}</span>
        <h3><Link href={'/dgi-court-cases/' + c.slug}>{c.title}</Link></h3>
        <p>{c.court || 'Суд уточняется'}</p>
        {c.topic && <p className="court-category">{c.topic}</p>}
        <span className="review-note">Текст судебного акта требует проверки</span>
      </article>)}</div>}
  </>;
}
