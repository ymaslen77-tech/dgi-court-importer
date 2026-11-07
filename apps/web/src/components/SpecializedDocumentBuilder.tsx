"use client";

import { useState } from "react";
import styles from "./LegalDocumentBuilder.module.css";

type Kind =
  | "housing-removal"
  | "privatization-service-complaint"
  | "utility-quality"
  | "inheritance-acceptance"
  | "emergency-housing"
  | "renovation-comments"
  | "mkd-information";
type FieldKey =
  | "recipient" | "applicant" | "replyAddress" | "phone" | "email" | "date"
  | "object" | "reference" | "facts" | "request" | "attachments"
  | "deceased" | "deathDate" | "inheritanceBasis" | "openingPlace"
  | "residence" | "challengedAuthority";
type FormFields = Record<FieldKey, string>;
type Source = { label: string; url: string };
type Spec = {
  title: string;
  documentTitle: string;
  purpose: string;
  objectLabel: string;
  referenceLabel: string;
  recipientHint: string;
  requestHint: string;
  caution: string;
  filename: string;
  extra: { key: FieldKey; label: string; hint?: string }[];
  sources: Source[];
};

const specs: Record<Kind, Spec> = {
  "housing-removal": {
    title: "Запросить решение о снятии с жилищного учёта",
    documentTitle: "ЗАЯВЛЕНИЕ О ПРЕДОСТАВЛЕНИИ РЕШЕНИЯ И СВЕДЕНИЙ",
    purpose: "Запрос документов и мотивировки до выбора способа оспаривания. Не является судебным иском.",
    objectLabel: "Учетное дело / адрес жилья",
    referenceLabel: "Номер решения или уведомления (если известен)",
    recipientHint: "Орган, принявший решение о снятии с учёта",
    requestHint: "Прошу предоставить копию решения, указать основание снятия с учёта и документы, на которых оно основано.",
    caution: "Статья 56 ЖК РФ требует мотивированного решения и предусматривает судебное обжалование. Запрос сведений сам по себе не приостанавливает процессуальный срок.",
    filename: "zapros-resheniya-zhilishchnyy-uchet.txt",
    extra: [],
    sources: [
      { label: "ЖК РФ, статья 56", url: "https://www.consultant.ru/document/cons_doc_LAW_51057/87012f36f8ec455730f4c40fca8dabb782e7844b/" },
      { label: "59-ФЗ, статьи 5 и 7 — обращения и ознакомление с материалами", url: "https://mintrud.gov.ru/docs/laws/108" },
    ],
  },
  "privatization-service-complaint": {
    title: "Жалоба на отказ в предоставлении услуги приватизации",
    documentTitle: "ЖАЛОБА НА РЕШЕНИЕ О ПРЕДОСТАВЛЕНИИ ГОСУДАРСТВЕННОЙ УСЛУГИ",
    purpose: "Только досудебная жалоба на решение/действие по государственной услуге. Спор о самом жилищном праве может потребовать иска в суд.",
    objectLabel: "Адрес квартиры / наименование услуги",
    referenceLabel: "Дата и номер отказа (если указаны)",
    recipientHint: "Уполномоченный орган, рассматривающий жалобы по конкретной услуге",
    requestHint: "Прошу проверить основания отказа и при наличии нарушений отменить его, рассмотреть заявление в соответствии с применимым регламентом.",
    caution: "Проверяйте действующий московский регламент услуги. Доступная PDF-редакция постановления Москвы № 521-ПП от 2022 года не подтверждает его актуальную редакцию на сегодня. Досудебная жалоба не подменяет судебный иск.",
    filename: "zhaloba-otkaz-privatizatsiya.txt",
    extra: [
      { key: "residence", label: "Место жительства заявителя" },
      { key: "phone", label: "Контактный телефон" },
      { key: "challengedAuthority", label: "Орган или должностное лицо, принявшее решение" },
    ],
    sources: [
      { label: "210-ФЗ, статьи 11.1 и 11.2 — порядок жалобы", url: "https://minjust.gov.ru/ru/documents/7743/" },
      { label: "Закон о приватизации № 1541-1", url: "https://www.consultant.ru/document/cons_doc_LAW_100/" },
      { label: "521-ПП — историческая официальная PDF-редакция", url: "https://www.mos.ru/upload/content/files/2a0ff0f6550542ed5ae4f7f149350111/AdministrativniireglamentkPrilojeniu1.pdf" },
    ],
  },
  "utility-quality": {
    title: "Обращение о качестве коммунальных услуг и проверке начислений",
    documentTitle: "ЗАЯВЛЕНИЕ О ПРОВЕРКЕ КАЧЕСТВА КОММУНАЛЬНОЙ УСЛУГИ И ПЕРЕРАСЧЁТЕ",
    purpose: "Для случаев ненадлежащего качества или превышения допустимых перерывов. Ошибка в тарифе/показаниях требует другой проверки.",
    objectLabel: "Адрес помещения и вид коммунальной услуги",
    referenceLabel: "Номер обращения в аварийно-диспетчерскую службу (если присвоен)",
    recipientHint: "Исполнитель соответствующей коммунальной услуги, определяемый по договору и платёжным документам",
    requestHint: "Прошу зарегистрировать сообщение, проверить нарушение качества и оформить акт. При подтверждении оснований прошу выполнить перерасчёт.",
    caution: "Сначала установите, кто является исполнителем услуги, сообщите о нарушении в аварийно-диспетчерскую службу и сохраните номер обращения. Отсутствие акта не заменяют неподтверждённые утверждения о длительности нарушения.",
    filename: "proverka-kachestva-zhku.txt",
    extra: [],
    sources: [
      { label: "Правила коммунальных услуг № 354, раздел X", url: "https://www.consultant.ru/document/cons_doc_LAW_114247/1dc2ccc34653658a6d4ab1c18f42c5cf0ab5b46a/" },
      { label: "Минстрой — разъяснение о фиксации качества услуг", url: "https://www.consultant.ru/document/cons_doc_LAW_464495/" },
    ],
  },
  "inheritance-acceptance": {
    title: "Заявление нотариусу о принятии наследства",
    documentTitle: "ЗАЯВЛЕНИЕ О ПРИНЯТИИ НАСЛЕДСТВА",
    purpose: "Только для обращения наследника к нотариусу. Не заменяет иск о восстановлении срока или спор с городом о выморочном имуществе.",
    objectLabel: "Сведения о наследственном имуществе (если известны)",
    referenceLabel: "Номер наследственного дела (если известен)",
    recipientHint: "Нотариус по месту открытия наследства",
    requestHint: "Прошу принять настоящее заявление о принятии наследства и приобщить его к наследственному делу.",
    caution: "Перед использованием установите право наследовать и срок принятия. При отправке почтой или через другое лицо подпись на заявлении должна быть засвидетельствована в порядке статьи 1153 ГК РФ. Пропущенный срок и спор о выморочном имуществе требуют отдельного правового анализа.",
    filename: "prinyatie-nasledstva-notariusu.txt",
    extra: [
      { key: "deceased", label: "ФИО наследодателя" },
      { key: "deathDate", label: "Дата смерти", hint: "Введите дату из документа о смерти" },
      { key: "openingPlace", label: "Место открытия наследства" },
      { key: "inheritanceBasis", label: "Основание наследования (по закону или завещанию)" },
    ],
    sources: [
      { label: "ГК РФ, статья 1153 — принятие наследства", url: "https://www.consultant.ru/document/cons_doc_LAW_34154/94abf68feb51293584e2840db7929a6e98a5ce75/" },
      { label: "ГК РФ, статья 1155 — восстановление срока", url: "https://www.consultant.ru/document/cons_doc_LAW_34154/e88ff3327fb40e20306d67842dcfafbe22e5de9c/" },
      { label: "Пленум Верховного Суда № 9 — наследственные споры", url: "https://www.consultant.ru/document/cons_doc_LAW_130453/" },
    ],
  },
  "emergency-housing": {
    title: "Заявление об оценке состояния жилья межведомственной комиссией",
    documentTitle: "ЗАЯВЛЕНИЕ ОБ ОЦЕНКЕ ЖИЛОГО ПОМЕЩЕНИЯ (ДОМА)",
    purpose: "Первичное заявление о рассмотрении вопроса по постановлению Правительства РФ № 47. Не заменяет техническое заключение и решение комиссии.",
    objectLabel: "Адрес и вид объекта (квартира или многоквартирный дом)",
    referenceLabel: "Реквизиты предыдущих обследований (если есть)",
    recipientHint: "Межведомственная комиссия по месту нахождения жилья / уполномоченный орган",
    requestHint: "Прошу рассмотреть вопрос о пригодности помещения для проживания либо об аварийности дома по Положению № 47 и направить принятое решение.",
    caution: "Подготовьте предусмотренные пунктом 45 Положения № 47 документы. Фото и описание повреждений сами по себе не являются заключением комиссии. Для разных объектов и оснований пакет документов различается.",
    filename: "zayavlenie-mezhvedomstvennaya-komissiya.txt",
    extra: [],
    sources: [
      { label: "Постановление № 47, пункты 45–47", url: "https://www.consultant.ru/document/cons_doc_LAW_58136/be1b19304843db02e0ff90cdd9d835c9de3e62be/" },
      { label: "Постановление Конституционного Суда № 55-П", url: "https://www.consultant.ru/document/cons_doc_LAW_434566/" },
    ],
  },
  "renovation-comments": {
    title: "Замечания к предложенной квартире по реновации",
    documentTitle: "ЗАМЕЧАНИЯ К ПРЕДЛОЖЕННОМУ ЖИЛОМУ ПОМЕЩЕНИЮ",
    purpose: "Письменное изложение замечаний и просьба проверить параметры предложения. Это не судебный иск и не автоматический отказ от переселения.",
    objectLabel: "Адрес предлагаемой квартиры (с указанием прежнего жилья в фактах)",
    referenceLabel: "Номер и дата предложения переселения (если имеются)",
    recipientHint: "Орган или уполномоченное лицо, направившее предложение в рамках реновации",
    requestHint: "Прошу проверить указанные характеристики предложенного жилого помещения на соответствие применимым гарантиям реновации, сообщить результаты и порядок устранения замечаний.",
    caution: "Сопоставьте адрес, площадь, число комнат, правовой статус и документы по фактам. Равнозначная квартира, равноценное возмещение и доплата за увеличение площади — разные процедуры. Обращение не приостанавливает обязательные сроки автоматически.",
    filename: "zamechaniya-renovatsiya.txt",
    extra: [],
    sources: [
      { label: "Закон о статусе столицы, статья 7.3 — гарантии реновации", url: "https://www.consultant.ru/document/cons_doc_LAW_219023/3d0cac60971a511280cbba229d9b6329c07731f7/" },
      { label: "Пленум Верховного Суда № 14 — жилищные споры", url: "https://vsrf.ru/documents/all/8112/" },
    ],
  },
  "mkd-information": {
    title: "Запрос сведений о решениях собрания собственников МКД",
    documentTitle: "ЗАПРОС ИНФОРМАЦИИ О РЕШЕНИЯХ ОБЩЕГО СОБРАНИЯ",
    purpose: "Запрос к управляющей организации о размещении и хранении решений собрания. Не является иском и не оспаривает решение автоматически.",
    objectLabel: "Адрес МКД, дата/тема собрания",
    referenceLabel: "Номер или дата протокола (если известны)",
    recipientHint: "Управляющая организация или иное лицо, хранящее документы",
    requestHint: "Прошу сообщить сведения о размещении и месте хранения протокола и решений собрания, а также порядок ознакомления с ними.",
    caution: "Порядок ответов управляющей организации регулируют ЖК РФ и Правила № 416, а не универсальный 30-дневный срок по № 59-ФЗ. Не включайте персональные сведения других собственников без правового основания.",
    filename: "zapros-protokola-mkd.txt",
    extra: [],
    sources: [
      { label: "ЖК РФ, статья 46 — протоколы собраний", url: "https://www.consultant.ru/document/cons_doc_LAW_51057/219c3257c1aa4b0fb9896079a0f295343e523d37/" },
      { label: "Минстрой о запросах в управляющие организации, 23.10.2026", url: "https://www.consultant.ru/document/cons_doc_LAW_547918/" },
      { label: "Минстрой об обращениях и сроках, 20.10.2026", url: "https://www.consultant.ru/document/cons_doc_LAW_547916/" },
    ],
  },
};

const empty: FormFields = {
  recipient: "", applicant: "", replyAddress: "", phone: "", email: "", date: "",
  object: "", reference: "", facts: "", request: "", attachments: "",
  deceased: "", deathDate: "", inheritanceBasis: "", openingPlace: "",
  residence: "", challengedAuthority: "",
};

function renderDocument(kind: Kind, f: FormFields): string {
  const spec = specs[kind];
  const lines = [
    "Кому: " + f.recipient.trim(),
    "От: " + f.applicant.trim(),
    "Адрес для ответа: " + f.replyAddress.trim(),
    ...(kind === "privatization-service-complaint" ? ["Место жительства: " + f.residence.trim()] : []),
    ...(f.phone.trim() ? ["Контактный телефон: " + f.phone.trim()] : []),
    ...(f.email.trim() ? ["Электронная почта: " + f.email.trim()] : []),
    "", spec.documentTitle, "",
    ...(kind === "privatization-service-complaint" ? [
      "Обжалуемое решение органа (должностного лица): " + f.challengedAuthority.trim(),
    ] : []),
    ...(kind === "inheritance-acceptance" ? [
      "Наследодатель: " + f.deceased.trim(),
      "Дата смерти наследодателя: " + f.deathDate.trim(),
      "Место открытия наследства: " + f.openingPlace.trim(),
      "Основание наследования: " + f.inheritanceBasis.trim(),
      "",
      "Заявляю о принятии наследства, открывшегося после смерти указанного наследодателя.",
    ] : []),
    "Объект / вопрос: " + f.object.trim(),
    ...(f.reference.trim() ? ["Реквизиты: " + f.reference.trim()] : []),
    "", "Сведения и обстоятельства:", f.facts.trim(),
    "", "Прошу:", f.request.trim(),
    "", "Прилагаемые документы:", f.attachments.trim() || "Не указаны.",
    "", "Дата: " + f.date.trim(),
    "Подпись: __________________ /" + f.applicant.trim() + "/",
  ];
  return lines.join("\n");
}

export function SpecializedDocumentBuilder({ kind }: { kind: Kind }) {
  const spec = specs[kind];
  const [fields, setFields] = useState<FormFields>(empty);
  const [showPreview, setShowPreview] = useState(false);
  const change = (key: FieldKey, value: string) => setFields(previous => ({ ...previous, [key]: value }));
  const isValid = Boolean(
    fields.recipient.trim() && fields.applicant.trim() && fields.replyAddress.trim() &&
    fields.date.trim() && fields.object.trim() && fields.facts.trim() && fields.request.trim() &&
    spec.extra.every(entry => fields[entry.key].trim()),
  );
  const document = isValid ? renderDocument(kind, fields) : "";

  function saveText() {
    if (!isValid) return;
    const bytes = new Blob(["\ufeff", document], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(bytes);
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = spec.filename;
    window.document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <section className={styles["legal-builder"]} aria-label={spec.title}>
    <h2>{spec.title}</h2>
    <p className={styles["legal-builder-lead"]}>{spec.purpose} Документ формируется только в браузере, сведения на сервер не отправляются.</p>
    <div className={styles["legal-builder-grid"]}>
      <label>Адресат
        <input value={fields.recipient} onChange={e => change("recipient", e.target.value)} placeholder={spec.recipientHint} />
      </label>
      <label>ФИО заявителя
        <input value={fields.applicant} onChange={e => change("applicant", e.target.value)} />
      </label>
      <label>Почтовый адрес для ответа
        <input value={fields.replyAddress} onChange={e => change("replyAddress", e.target.value)} />
      </label>
      <label>Дата документа
        <input type="date" value={fields.date} onChange={e => change("date", e.target.value)} />
      </label>
      {spec.extra.map(entry => <label key={entry.key}>{entry.label}
        <input value={fields[entry.key]} onChange={e => change(entry.key, e.target.value)} placeholder={entry.hint} />
      </label>)}
      <label>Телефон (если требуется, укажите)
        <input value={fields.phone} onChange={e => change("phone", e.target.value)} />
      </label>
      <label>Электронная почта (необязательно)
        <input type="email" value={fields.email} onChange={e => change("email", e.target.value)} />
      </label>
      <label className={styles["legal-builder-wide"]}>{spec.objectLabel}
        <input value={fields.object} onChange={e => change("object", e.target.value)} />
      </label>
      <label className={styles["legal-builder-wide"]}>{spec.referenceLabel}
        <input value={fields.reference} onChange={e => change("reference", e.target.value)} />
      </label>
      <label className={styles["legal-builder-wide"]}>Факты, даты и подтверждения
        <textarea rows={4} value={fields.facts} onChange={e => change("facts", e.target.value)}
          placeholder="Опишите только известные вам обстоятельства, не добавляя неподтверждённых сведений" />
      </label>
      <label className={styles["legal-builder-wide"]}>Ваше требование
        <textarea rows={3} value={fields.request} onChange={e => change("request", e.target.value)} placeholder={spec.requestHint} />
      </label>
      <label className={styles["legal-builder-wide"]}>Перечень приложений (если есть)
        <textarea rows={2} value={fields.attachments} onChange={e => change("attachments", e.target.value)} />
      </label>
    </div>
    <div className={styles["legal-builder-actions"]}>
      <button type="button" disabled={!isValid} onClick={() => setShowPreview(v => !v)}>
        {showPreview ? "Скрыть текст" : "Показать текст"}
      </button>
      <button type="button" disabled={!isValid} onClick={saveText}>Скачать .txt</button>
    </div>
    {showPreview && isValid && <textarea className={styles["legal-builder-preview"]}
      aria-label="Подготовленный текст" readOnly rows={15} value={document} />}
    <p className={styles["legal-builder-note"]}>{spec.caution}</p>
    <p className={styles["legal-builder-sources"]}>Правовая основа: {spec.sources.map((source, i) =>
      <span key={source.url}>{i ? " · " : ""}<a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a></span>)}</p>
  </section>;
}
