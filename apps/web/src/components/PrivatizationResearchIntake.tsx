"use client";

import { useState } from "react";

/**
 * RESEARCH-ONLY intake: descriptive facts, never a legal decision tree.
 * No names, dates, addresses, case numbers, uploads or free-text fields.
 * State is React memory only: no persistence, fetch, analytics or export.
 * The parent /navigator-dgi route returns 404 when siteIsLive.
 */
const questions = [
  {
    id: "request",
    title: "Подача заявления",
    prompt: "Обращались ли вы с заявлением о передаче жилого помещения в собственность?",
    options: [
      { value: "yes", label: "Да" },
      { value: "no", label: "Нет" },
      { value: "unknown", label: "Не знаю / не помню" },
    ],
  },
  {
    id: "response",
    title: "Полученный ответ",
    prompt: "Какой документ или результат вы получили после обращения?",
    options: [
      { value: "written-refusal", label: "Письменный отказ" },
      { value: "other-response", label: "Иное письменное сообщение" },
      { value: "none", label: "Ответа или документа нет" },
      { value: "unknown", label: "Не знаю" },
    ],
  },
  {
    id: "housing",
    title: "Документы на жилое помещение",
    prompt: "Какой документ о пользовании жилым помещением вам известен?",
    options: [
      { value: "social-tenancy", label: "Договор социального найма" },
      { value: "other", label: "Другой документ" },
      { value: "unknown", label: "Не знаю / документа нет под рукой" },
    ],
  },
  {
    id: "participants",
    title: "Сведения об участниках",
    prompt: "Есть ли у вас документы или сведения о позиции других проживающих по вопросу приватизации?",
    options: [
      { value: "yes", label: "Да" },
      { value: "no", label: "Нет" },
      { value: "unknown", label: "Не знаю / вопрос не выяснен" },
    ],
  },
  {
    id: "grounds",
    title: "Причина из документа",
    prompt: "Можете ли вы установить причину отказа непосредственно из полученного документа?",
    options: [
      { value: "yes", label: "Да, причина указана" },
      { value: "no", label: "Нет, причина не указана" },
      { value: "no-document", label: "Документа с отказом нет" },
      { value: "unknown", label: "Не знаю" },
    ],
  },
] as const;

type QuestionId = (typeof questions)[number]["id"];
type Answer = string;

export function PrivatizationResearchIntake() {
  const [answers, setAnswers] = useState<Partial<Record<QuestionId, Answer>>>({});
  const completed = questions.filter((question) => Boolean(answers[question.id])).length;

  return (
    <section className="navigator-intake" aria-labelledby="navigator-privatization-intake" data-research-status="research_only">
      <h3 id="navigator-privatization-intake">Анкета фактов: отказ в приватизации</h3>
      <p className="navigator-preview-note">
        Это закрытый исследовательский образец. Ответы помогают только перечислить известные обстоятельства:
        юридическая оценка, выбор судебной процедуры, сроков и документа здесь не выполняются.
        Не вводите персональные данные.
      </p>
      <p className="navigator-intake-progress" aria-live="polite">Заполнено вопросов: {completed} из {questions.length}</p>
      <div className="navigator-intake-questions">
        {questions.map((question, index) => (
          <fieldset key={question.id} className="navigator-intake-question">
            <legend>{index + 1}. {question.title}</legend>
            <p>{question.prompt}</p>
            <div className="navigator-intake-options">
              {question.options.map((option) => (
                <label key={option.value}>
                  <input
                    type="radio"
                    name={"privatization-" + question.id}
                    value={option.value}
                    checked={answers[question.id] === option.value}
                    onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: option.value }))}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      <div className="navigator-intake-actions">
        <button type="button" onClick={() => setAnswers({})} disabled={completed === 0}>Очистить ответы</button>
      </div>
      {completed > 0 && (
        <div className="navigator-intake-summary" aria-live="polite">
          <h4>Зафиксированные ответы (без правовой оценки)</h4>
          <dl>
            {questions.filter((question) => answers[question.id]).map((question) => {
              const choice = question.options.find((option) => option.value === answers[question.id]);
              return <div key={question.id}><dt>{question.title}</dt><dd>{choice?.label}</dd></div>;
            })}
          </dl>
          <p className="navigator-preview-note">
            Это не определение права на приватизацию, не рекомендация подавать жалобу или иск.
            Для решения вопроса необходима отдельная проверка действующих норм и обстоятельств.
          </p>
        </div>
      )}
    </section>
  );
}
