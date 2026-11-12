"use client";

import { useState } from "react";

/**
 * Private research-only factual intake. No PII fields, network access,
 * storage, legal qualification, filing deadlines or document recommendation.
 * Parent page /navigator-dgi returns 404 when siteIsLive.
 */
type Choice = { value: string; label: string };
type Question = { id: string; title: string; prompt: string; choices: readonly Choice[] };
type Scenario = { id: string; title: string; questions: readonly Question[] };

const scenarios: readonly Scenario[] = [
  {
    id: "housing-registration-removal",
    title: "Снятие с жилищного учёта",
    questions: [
      { id: "notice", title: "Уведомление", prompt: "Получали ли вы сообщение о снятии с учёта?", choices: [
        { value: "written", label: "Да, письменное" }, { value: "other", label: "Сообщение в другой форме" },
        { value: "none", label: "Нет" }, { value: "unknown", label: "Не знаю" },
      ]},
      { id: "decision", title: "Документ о решении", prompt: "Есть ли у вас документ с решением о снятии?", choices: [
        { value: "yes", label: "Есть" }, { value: "no", label: "Нет" }, { value: "unknown", label: "Не знаю" },
      ]},
      { id: "registration", title: "Предыдущий учёт", prompt: "Есть ли у вас документ, подтверждающий прежнюю постановку на учёт?", choices: [
        { value: "yes", label: "Есть" }, { value: "no", label: "Нет" }, { value: "unknown", label: "Не знаю" },
      ]},
      { id: "grounds", title: "Изложенные причины", prompt: "Указаны ли причины снятия в полученном документе?", choices: [
        { value: "yes", label: "Да" }, { value: "no", label: "Нет" },
        { value: "no-document", label: "Документа нет" }, { value: "unknown", label: "Не знаю" },
      ]},
    ],
  },
  {
    id: "dgi-no-response",
    title: "Ответ на обращение в ДГИ не получен",
    questions: [
      { id: "kind", title: "Вид обращения", prompt: "Что именно вы направляли?", choices: [
        { value: "general", label: "Общее письменное обращение" },
        { value: "service", label: "Заявление на государственную услугу" },
        { value: "other", label: "Другой запрос" }, { value: "unknown", label: "Не знаю" },
      ]},
      { id: "channel", title: "Способ направления", prompt: "Как передавался документ?", choices: [
        { value: "online", label: "Через электронный сервис" }, { value: "paper", label: "На бумаге" },
        { value: "other", label: "Другим способом" }, { value: "unknown", label: "Не знаю" },
      ]},
      { id: "registration", title: "Подтверждение подачи", prompt: "Есть ли подтверждение приёма или регистрации?", choices: [
        { value: "yes", label: "Есть" }, { value: "no", label: "Нет" }, { value: "unknown", label: "Не знаю" },
      ]},
      { id: "response", title: "Полученные сообщения", prompt: "Приходило ли какое-либо сообщение по вопросу?", choices: [
        { value: "yes", label: "Да" }, { value: "no", label: "Нет" }, { value: "unknown", label: "Не знаю" },
      ]},
    ],
  },
  {
    id: "social-tenancy-dispute",
    title: "Спор по социальному найму",
    questions: [
      { id: "contract", title: "Договор", prompt: "Есть ли у вас экземпляр договора социального найма?", choices: [
        { value: "yes", label: "Есть" }, { value: "no", label: "Нет" }, { value: "unknown", label: "Не знаю" },
      ]},
      { id: "subject", title: "Предмет разногласий", prompt: "С чем связано разногласие по имеющимся документам?", choices: [
        { value: "contract", label: "С условиями или оформлением договора" },
        { value: "residence", label: "С пользованием жилым помещением" },
        { value: "notice", label: "С полученным уведомлением" },
        { value: "other", label: "Иное / не знаю" },
      ]},
      { id: "written", title: "Документы о разногласии", prompt: "Есть ли письменные обращения или ответы по этому вопросу?", choices: [
        { value: "yes", label: "Есть" }, { value: "no", label: "Нет" }, { value: "unknown", label: "Не знаю" },
      ]},
      { id: "court", title: "Известное судебное дело", prompt: "Имеются ли у вас сведения, что по этому вопросу уже рассматривается судебное дело?", choices: [
        { value: "yes", label: "Да" }, { value: "no", label: "Нет" }, { value: "unknown", label: "Не знаю" },
      ]},
    ],
  },
  {
    id: "renovation-offer-disagreement",
    title: "Несогласие с предложенной квартирой при реновации",
    questions: [
      { id: "offer", title: "Предложение", prompt: "Получено ли предложение конкретного жилого помещения?", choices: [
        { value: "written", label: "Да, письменное" }, { value: "other", label: "Сообщение в другой форме" },
        { value: "none", label: "Нет" }, { value: "unknown", label: "Не знаю" },
      ]},
      { id: "documents", title: "Документы по предложению", prompt: "Есть ли документы с описанием предложенного помещения?", choices: [
        { value: "yes", label: "Есть" }, { value: "no", label: "Нет" }, { value: "unknown", label: "Не знаю" },
      ]},
      { id: "concern", title: "Причина несогласия", prompt: "Какой аспект предложения вызывает вопросы?", choices: [
        { value: "description", label: "Сведения о характеристиках помещения" },
        { value: "documents", label: "Оформление документов" },
        { value: "other", label: "Другой вопрос" }, { value: "unknown", label: "Пока не определено" },
      ]},
      { id: "communication", title: "Направленные замечания", prompt: "Направляли ли вы замечания по предложению?", choices: [
        { value: "yes", label: "Да" }, { value: "no", label: "Нет" }, { value: "unknown", label: "Не знаю" },
      ]},
    ],
  },
] as const;

function FactIntake({ scenario }: { scenario: Scenario }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const answered = scenario.questions.filter((question) => answers[question.id]).length;
  return (
    <section className="navigator-intake" data-research-status="research_only"
      data-scenario-id={scenario.id} aria-labelledby={"facts-" + scenario.id}>
      <h3 id={"facts-" + scenario.id}>{scenario.title}</h3>
      <p className="navigator-preview-note">
        Закрытая анкета для фиксации известных обстоятельств. Результат не определяет
        право, процедуру, срок, адресата или подходящий документ. Персональные данные не вводятся.
      </p>
      <p className="navigator-intake-progress" aria-live="polite">Заполнено вопросов: {answered} из {scenario.questions.length}</p>
      <div className="navigator-intake-questions">
        {scenario.questions.map((question, index) => (
          <fieldset className="navigator-intake-question" key={question.id}>
            <legend>{index + 1}. {question.title}</legend>
            <p>{question.prompt}</p>
            <div className="navigator-intake-options">
              {question.choices.map((choice) => (
                <label key={choice.value}>
                  <input type="radio" name={scenario.id + "-" + question.id} value={choice.value}
                    checked={answers[question.id] === choice.value}
                    onChange={() => setAnswers(previous => ({ ...previous, [question.id]: choice.value }))} />
                  <span>{choice.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      <div className="navigator-intake-actions">
        <button type="button" disabled={answered === 0} onClick={() => setAnswers({})}>Очистить ответы</button>
      </div>
      {answered > 0 && <div className="navigator-intake-summary" aria-live="polite">
        <h4>Зафиксированные ответы (без правовой оценки)</h4>
        <dl>{scenario.questions.filter(question => answers[question.id]).map(question => (
          <div key={question.id}>
            <dt>{question.title}</dt>
            <dd>{question.choices.find(choice => choice.value === answers[question.id])?.label}</dd>
          </div>
        ))}</dl>
        <p className="navigator-preview-note">
          Перечень ответов не является правовым выводом или рекомендацией о дальнейших действиях.
        </p>
      </div>}
    </section>
  );
}

export function AdditionalResearchIntakes() {
  return <div className="navigator-intake-list" aria-label="Другие исследовательские анкеты">
    {scenarios.map(scenario => <FactIntake key={scenario.id} scenario={scenario} />)}
  </div>;
}
