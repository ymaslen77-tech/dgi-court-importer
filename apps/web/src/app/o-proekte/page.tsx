import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { factualSocialMetadata } from "@/data/seo-social";

const title = "О проекте и источниках";
const description = "Независимый справочник по жилищным вопросам Москвы и ссылки на официальные правовые источники.";
export const metadata: Metadata = {
  title: { absolute: title + " | Жилищные вопросы Москвы" },
  description,
  ...factualSocialMetadata("o-proekte", title, description),
  robots: { index: false, follow: false },
};

export default function EditorialPolicyPage() {
  return <PageShell variant="thematic">
    <article className="container housing-guide">
      <h1>О проекте</h1>
      <p className="housing-guide-lead">dgi-pravo.ru — независимый справочник о жилищных правах в Москве. Это не официальный сайт ДГИ и не канал подачи государственных обращений.</p>
      <section>
        <h2>Источники информации</h2>
        <p>Для проверки норм, процедур и судебных дел используйте официальные публикации:</p>
        <ul>
          <li><a href="https://pravo.gov.ru/" target="_blank" rel="noopener noreferrer">Правовая информация РФ ↗</a></li>
          <li><a href="https://www.mos.ru/dgi/" target="_blank" rel="noopener noreferrer">ДГИ Москвы ↗</a></li>
          <li><a href="https://vestnikmoscow.mos.ru/" target="_blank" rel="noopener noreferrer">Официальные публикации Москвы ↗</a></li>
          <li><a href="https://www.mos-gorsud.ru/" target="_blank" rel="noopener noreferrer">Московский городской суд ↗</a></li>
        </ul>
      </section>
      <section>
        <h2>Важно</h2>
        <p>Некоторые материалы требуют уточнения редакции нормативных актов. Справочная информация не заменяет официальный регламент или индивидуальную правовую консультацию.</p>
      </section>
      <section>
        <h2>Связь с редакцией</h2>
        <p>Замечания к материалам: <a href="mailto:admin@dgi-pravo.ru">admin@dgi-pravo.ru</a>. Для официального обращения в ДГИ используйте каналы на mos.ru.</p>
      </section>
    </article>
  </PageShell>;
}
