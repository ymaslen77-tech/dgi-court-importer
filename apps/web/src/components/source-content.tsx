import { type SourcePage, safeHref } from '@/lib/webflow';

const linkIgnore = new Set(['Главная', 'На главную', 'Назад', 'Контакты', 'Новости', 'Госуслуги']);

export function SourceContent({ page }: { page: SourcePage }) {
  let primarySeen = false;
  const content = page.blocks.map((block, i) => {
    // The page's H1 is rendered by its dedicated hero. Repeated H1s downgrade to H2.
    if (block.type === 'h1') {
      if (!primarySeen) { primarySeen = true; return null; }
      return <h2 key={i}>{block.text}</h2>;
    }
    if (block.type === 'h2') return <h2 key={i}>{block.text}</h2>;
    if (block.type === 'h3') return <h3 key={i}>{block.text}</h3>;
    if (block.type === 'h4' || block.type === 'h5' || block.type === 'h6') return <h4 key={i}>{block.text}</h4>;
    if (block.type === 'li') return <p className="source-item" key={i}><span aria-hidden="true">—</span> {block.text}</p>;
    return <p key={i}>{block.text}</p>;
  });
  const links = page.links
    .map((link) => ({ ...link, href: safeHref(link.href) }))
    .filter((link): link is { label: string; href: string } =>
      Boolean(link.href && !linkIgnore.has(link.label) && link.label.length < 100))
    .filter((link, index, array) => array.findIndex((item) => item.href === link.href) === index)
    .slice(0, 18);

  return <>
    <article className="source-article" aria-label="Основной материал страницы">{content}</article>
    {links.length > 0 && <aside className="links-section" aria-label="Документы и связанные разделы">
      <h2>Документы и связанные разделы</h2>
      <div className="link-chips">{links.map((link) => {
        const external = /^https?:\/\//.test(link.href);
        return <a key={link.href} href={link.href} target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}>{link.label} <span aria-hidden="true">↗</span></a>;
      })}</div>
    </aside>}
  </>;
}
