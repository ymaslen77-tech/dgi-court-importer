"use client";

import { useState } from "react";

type Kind = "request" | "service-complaint" | "civil-objection";
type Fields = {
  recipient: string;
  applicant: string;
  postalAddress: string;
  phone: string;
  email: string;
  subject: string;
  facts: string;
  demand: string;
  attachments: string;
  date: string;
  caseNumber: string;
  claimant: string;
};

const sources: Record<Kind, { label: string; url: string }[]> = {
  request: [
    { label: "Статья 7 Федерального закона № 59-ФЗ — требования к обращению", url: "https://mintrud.gov.ru/docs/laws/108" },
    { label: "Официальные каналы ДГИ Москвы", url: "https://www.mos.ru/dgi/" },
  ],
  "service-complaint": [
    { label: "Порядок жалобы на госуслугу по № 210-ФЗ", url: "https://minjust.gov.ru/ru/documents/7743/" },
    { label: "Официальные каналы ДГИ Москвы", url: "https://www.mos.ru/dgi/" },
  ],
  "civil-objection": [
    { label: "Статья 149 ГПК РФ — письменные возражения ответчика", url: "https://www.consultant.ru/document/cons_doc_LAW_39570/72854130f0ed1553f37c3d865a1940a336c77837/" },
    { label: "Официальный портал Московского городского суда", url: "https://www.mos-gorsud.ru/" },
  ],
};

const titles: Record<Kind, string> = {
  request: "Подготовить обращение в ДГИ",
  "service-complaint": "Подготовить жалобу на предоставление госуслуги",
  "civil-objection": "Подготовить возражения на гражданский иск",
};

const initial: Fields = {
  recipient: "",
  applicant: "",
  postalAddress: "",
  phone: "",
  email: "",
  subject: "",
  facts: "",
  demand: "",
  attachments: "",
  date: "",
  caseNumber: "",
  claimant: "",
};

function draft(kind: Kind, f: Fields): string {
  const header = [
    "Кому: " + (f.recipient.trim() || "Департамент городского имущества города Москвы"),
    "От: " + f.applicant.trim(),
    "Адрес для ответа: " + f.postalAddress.trim(),
    f.phone.trim() ? "Телефон: " + f.phone.trim() : "",
    f.email.trim() ? "Электронная почта: " + f.email.trim() : "",
  ].filter(Boolean);

  if (kind === "civil-objection") {
    return [
      "В суд: " + f.recipient.trim(),
      "По делу № " + f.caseNumber.trim(),
      "Ответчик: " + f.applicant.trim(),
      "Почтовый адрес: " + f.postalAddress.trim(),
      "Истец: " + f.claimant.trim(),
      f.phone.trim() ? "Телефон: " + f.phone.trim() : "",
      f.email.trim() ? "Электронная почта: " + f.email.trim() : "",
      "",
      "ВОЗРАЖЕНИЯ ОТНОСИТЕЛЬНО ИСКОВЫХ ТРЕБОВАНИЙ",
      "",
      "Предмет спора: " + f.subject.trim(),
      "",
      "Позиция и фактические обстоятельства:",
      f.facts.trim(),
      "",
      "Прошу суд:",
      f.demand.trim(),
      "",
      "Доказательства и приложения:",
      f.attachments.trim() || "Указать при наличии.",
      "",
      "Дата: " + f.date.trim(),
      "Подпись: __________________ /" + f.applicant.trim() + "/",
    ].join("\n");
  }

  return [
    ...header,
    "",
    kind === "request" ? "ОБРАЩЕНИЕ" : "ЖАЛОБА НА НАРУШЕНИЕ ПОРЯДКА ПРЕДОСТАВЛЕНИЯ ГОСУДАРСТВЕННОЙ УСЛУГИ",
    "",
    "Вопрос: " + f.subject.trim(),
    "",
    kind === "request" ? "Излагаю обстоятельства:" : "Обжалуемое решение, действие (бездействие) и доводы:",
    f.facts.trim(),
    "",
    "Прошу:",
    f.demand.trim(),
    "",
    "Прилагаемые документы:",
    f.attachments.trim() || "Не прилагаются.",
    "",
    "Дата: " + f.date.trim(),
    "Подпись: __________________ /" + f.applicant.trim() + "/",
  ].join("\n");
}

export function LegalDocumentBuilder({ kind }: { kind: Kind }) {
  const [fields, setFields] = useState<Fields>(initial);
  const [showPreview, setShowPreview] = useState(false);
  const change = (key: keyof Fields, value: string) => setFields(prev => ({ ...prev, [key]: value }));
  const ready = Boolean(fields.applicant.trim() && fields.postalAddress.trim() &&
    fields.recipient.trim() && fields.subject.trim() && fields.facts.trim() &&
    fields.demand.trim() && fields.date.trim() &&
    (kind !== "civil-objection" || (fields.caseNumber.trim() && fields.claimant.trim())));
  const result = ready ? draft(kind, fields) : "";

  function download() {
    if (!ready) return;
    const blob = new Blob(["\ufeff", result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = kind === "civil-objection" ? "vozrazheniya-na-isk.txt" :
      kind === "request" ? "obrashchenie-v-dgi.txt" : "zhaloba-na-gosuslugu.txt";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <section className="legal-builder" aria-label={titles[kind]}>
    <h2>{titles[kind]}</h2>
    <p className="legal-builder-lead">Заполните сведения — получите редактируемый текст документа. Данные остаются в вашем браузере и не отправляются на сайт.</p>
    <div className="legal-builder-grid">
      <label>{kind === "civil-objection" ? "Наименование суда" : "Адресат (орган, должностное лицо)"}
        <input value={fields.recipient} onChange={e => change("recipient", e.target.value)} placeholder={kind === "civil-objection" ? "Суд, рассматривающий дело" : "Департамент городского имущества города Москвы"} />
      </label>
      <label>{kind === "civil-objection" ? "Ответчик: ФИО" : "Заявитель: ФИО"}
        <input value={fields.applicant} onChange={e => change("applicant", e.target.value)} />
      </label>
      <label>Почтовый адрес заявителя
        <input value={fields.postalAddress} onChange={e => change("postalAddress", e.target.value)} />
      </label>
      <label>Телефон (необязательно)
        <input value={fields.phone} onChange={e => change("phone", e.target.value)} />
      </label>
      <label>Электронная почта (необязательно)
        <input type="email" value={fields.email} onChange={e => change("email", e.target.value)} />
      </label>
      <label>Дата документа
        <input type="date" value={fields.date} onChange={e => change("date", e.target.value)} />
      </label>
      {kind === "civil-objection" && <>
        <label>Номер судебного дела
          <input value={fields.caseNumber} onChange={e => change("caseNumber", e.target.value)} />
        </label>
        <label>Истец
          <input value={fields.claimant} onChange={e => change("claimant", e.target.value)} />
        </label>
      </>}
      <label className="legal-builder-wide">{kind === "service-complaint" ? "Госуслуга и предмет жалобы" : "Предмет документа"}
        <input value={fields.subject} onChange={e => change("subject", e.target.value)} placeholder="Укажите конкретную ситуацию" />
      </label>
      <label className="legal-builder-wide">Факты, даты, номера решений и доводы
        <textarea rows={4} value={fields.facts} onChange={e => change("facts", e.target.value)} placeholder="Только проверенные обстоятельства; не включайте избыточные персональные данные третьих лиц" />
      </label>
      <label className="legal-builder-wide">Что просите сделать
        <textarea rows={3} value={fields.demand} onChange={e => change("demand", e.target.value)} placeholder="Сформулируйте требование своими словами" />
      </label>
      <label className="legal-builder-wide">Приложения (необязательно)
        <textarea rows={2} value={fields.attachments} onChange={e => change("attachments", e.target.value)} />
      </label>
    </div>
    <div className="legal-builder-actions">
      <button type="button" disabled={!ready} onClick={() => setShowPreview(prev => !prev)}>{showPreview ? "Скрыть текст" : "Показать текст"}</button>
      <button type="button" disabled={!ready} onClick={download}>Скачать .txt</button>
    </div>
    {showPreview && ready && <textarea className="legal-builder-preview" aria-label="Подготовленный текст" readOnly rows={15} value={result} />}
    <p className="legal-builder-note">{kind === "request"
      ? "Обращение по № 59-ФЗ не заменяет заявление на конкретную государственную услугу. Электронное обращение направляйте через официальный канал с идентификацией заявителя."
      : kind === "service-complaint"
        ? "Это жалоба именно на порядок предоставления госуслуги (№ 210-ФЗ), не универсальная претензия и не судебный документ. Проверьте регламент услуги и уполномоченного адресата."
        : "Возражения готовятся только по уже предъявленному гражданскому иску. Уточните суд, требования истца, сроки и порядок представления копий участникам дела."}</p>
    <p className="legal-builder-sources">Правовые основания: {sources[kind].map((source, index) =>
      <span key={source.url}>{index > 0 ? " · " : ""}<a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a></span>)}</p>
  </section>;
}
