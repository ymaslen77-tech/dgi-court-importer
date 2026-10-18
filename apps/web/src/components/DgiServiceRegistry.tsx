import Link from "next/link";
import registry from "@/data/dgi-service-register.json";
import { findHousingGuide } from "./HousingGuide";
import { getMigratedPage } from "@/data/pages";

export const dgiServiceRegistrySlug = "reestr-gosuslug-dgi";
export const dgiServiceRegistryTitle = "Государственные услуги ДГИ: проверяемый реестр";

export function DgiServiceRegistry() {
  return <article className="housing-guide housing-law-catalog">
    <p className="housing-review-label">Справочник процедур — сведения требуют сверки</p>
    <h1>{dgiServiceRegistryTitle}</h1>
    <p className="housing-guide-lead">Первый реестр услуг, для которых найдены официальные документы. Это не полный перечень услуг Департамента и не подтверждение действующих сроков или порядка обращения.</p>
    <p>{registry.notice}</p>
    <p>Дата составления перечня: {registry.checkedOn}. Материалы используются только для ознакомительной проверки.</p>
    <div className="housing-law-list">
      {registry.services.map(item=><section className="housing-law-entry" id={item.id} key={item.id}>
        <h2>{item.title}</h2>
        <p><strong>Направление:</strong> {item.area}</p>
        <p><strong>Компетентный орган по опубликованным документам:</strong> {item.authority}</p>
        <p><strong>Нормативное основание для сверки:</strong> {item.law}</p>
        <p className="housing-law-status">Действующая редакция и регламент не подтверждены</p>
        {"verifiedAmendmentEvidence" in item && item.verifiedAmendmentEvidence && (
          <div className="housing-law-source-evidence">
            <h3>Что подтверждено официальной публикацией</h3>
            <p><strong>{item.verifiedAmendmentEvidence.act}</strong>. {item.verifiedAmendmentEvidence.confirmedScope}</p>
            <p><strong>Дата вступления изменений в силу:</strong> {item.verifiedAmendmentEvidence.confirmedEffectiveFrom}.</p>
            <p><strong>Ограничение проверки:</strong> {item.verifiedAmendmentEvidence.caveat}</p>
            <a href={item.verifiedAmendmentEvidence.publishedSource} target="_blank" rel="noopener noreferrer">Официальная публикация изменений ↗</a>
          </div>
        )}
        <p><strong>Что ещё необходимо проверить:</strong> {item.remaining}</p>
        <nav className="housing-related" aria-label={`Ссылки к услуге: ${item.title}`}>
          {(findHousingGuide(item.guideSlug) || getMigratedPage(item.guideSlug)) && <Link href={`/${item.guideSlug}`}>Правовое руководство →</Link>}
          <a href={item.officialSource} target="_blank" rel="noopener noreferrer">Официально размещённый исходный документ ↗</a>
        </nav>
      </section>)}
    </div>
    <p className="housing-editorial-foot">Перед подачей заявления найдите действующий сервис на mos.ru и проверьте регламент с приложениями. Данный реестр не предоставляет госуслуги, не собирает заявления и не формирует обязательных для ведомства документов.</p>
  </article>;
}
