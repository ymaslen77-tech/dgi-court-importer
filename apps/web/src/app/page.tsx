import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { MigratedArticle } from "@/components/MigratedArticle";
import { getMigratedPage } from "@/data/pages";

const topics = [
  ["Приватизация жилья", "/privatizaciya-zhilya", "Права участников, документы и обжалование отказов"],
  ["Социальный наём", "/socialnyj-naem", "Права нанимателя и членов семьи"],
  ["Жилищный учёт", "/zhilishchnyj-uchet", "Нуждаемость, очередь и снятие с учёта"],
  ["Реновация", "/renovaciya-pereselenie", "Переселение, договоры и гарантии"],
  ["Споры с ДГИ", "/spory-s-dgi", "Решения ведомства и способы обжалования"],
  ["Судебная практика", "/sudebnaya-praktika-dgi", "Карточки дел, инстанции и первоисточники"],
] as const;

export default function HomePage() {
  const page = getMigratedPage("");
  if (!page) return null;
  return (
    <PageShell>
      <section className="topic-section">
        <div className="container">
          <p className="section-eyebrow">ВЫБЕРИТЕ СВОЙ ВОПРОС</p>
          <h2 className="section-title">Практические жилищные маршруты</h2>
          <div className="topic-grid">
            {topics.map(([name, href, desc], index) => (
              <Link href={href} className="topic-card" key={href}>
                <span className="topic-number">{String(index + 1).padStart(2, "0")}</span>
                <h3>{name}</h3>
                <p>{desc}</p>
                <span className="topic-more">ОТКРЫТЬ РАЗДЕЛ →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <MigratedArticle page={page} home />
    </PageShell>
  );
}
