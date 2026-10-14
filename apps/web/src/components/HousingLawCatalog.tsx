import Link from "next/link";
import catalog from "@/data/housing-law-catalog.json";
import { getMigratedPage } from "@/data/pages";
import { findHousingGuide } from "./HousingGuide";

const badges: Record<string,string> = {
 historical_pdf: "Историческая копия — редакцию проверить",
 primary_historical: "Первичный опубликованный документ — редакцию проверить",
 link_not_verified: "Ссылка на копию не подтверждена",
 official_text_needed: "Нужен официальный текст",
};
export const housingLawCatalogSlug="spravochnik-zhilishchnogo-zakonodatelstva-moskvy";
export const housingLawCatalogTitle="Жилищное законодательство Москвы: каталог нормативных актов";
export function HousingLawCatalog() {
 return <article className="housing-guide housing-law-catalog">
  <p className="housing-review-label">Редакционный каталог · черновик для проверки</p>
  <h1>{housingLawCatalogTitle}</h1>
  <p className="housing-guide-lead">Нормативные акты для решения жилищных вопросов в Москве. Здесь отделены реквизиты документов от вопроса об актуальности их редакции. Наличие ссылки на архивную публикацию не подтверждает, что правила действуют сегодня.</p>
  <p>Дата редакционного реестра: {catalog.checkedOn}. Ни один акт пока не отмечен как юридически проверенный для публикации.</p>
  <div className="housing-law-list">
    {catalog.laws.map(law=><section className="housing-law-entry" key={law.id} id={law.id}>
       <h2>{law.title}</h2>
       <p>{law.subject}</p>
       <p className="housing-law-status">{badges[law.sourceStatus] ?? "Требует проверки"}</p>
       <p>{law.sourceUrl ? <a href={law.sourceUrl} target="_blank" rel="noopener noreferrer">Посмотреть опубликованный документ ↗</a>
          : <a href="https://publication.pravo.gov.ru/" target="_blank" rel="noopener noreferrer">Найти официальную публикацию по реквизитам ↗</a>}</p>
       <nav className="housing-related" aria-label={`Темы, связанные с ${law.title}`}>
         {law.related.map(slug=>{
           const guide=findHousingGuide(slug), page=getMigratedPage(slug);
           if(!guide && !page) return null;
           return <Link href={`/${slug}`} key={slug}>{guide?.title ?? page?.title} →</Link>;
         })}
       </nav>
     </section>)}
  </div>
  <p className="housing-editorial-foot">Каталог не является официальной консолидированной правовой базой. Проверяйте последнее опубликованное изменение каждого документа и сроки его вступления в силу.</p>
 </article>;
}
