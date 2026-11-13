"use client";

import { useState } from "react";

export type VerifiedScenario = {
  id: string;
  procedure: string;
  jurisdiction: string;
  title: string;
  summary: string;
  seoTitle: string;
  seoDescription: string;
  questions: Array<{id:string; prompt:string; options:string[]}>;
  rules: Array<{
    id:string; text:string; scopeNote:string; exceptionNote:string;
    procedure:string; requiredAnswers:Record<string,string>;
  }>;
  generator: {
    kind:string; title:string; scopeNote:string;
    clauses:Array<{ruleId:string;text:string}>;
  };
};

function selectVerifiedRules(scenario:VerifiedScenario,answers:Record<string,string>) {
  return scenario.rules.filter(rule=>
    rule.procedure===scenario.procedure &&
    Object.keys(rule.requiredAnswers).length>0 &&
    Object.entries(rule.requiredAnswers).every(([id,answer])=>answers[id]===answer)
  );
}

/**
 * No personal data collection, uploads, server requests, magic AI output,
 * or guessed legal remedies. Only already source-verified clauses are shown.
 */
export function VerifiedScenarioIntake({ scenario }: { scenario: VerifiedScenario }) {
  const [answers,setAnswers]=useState<Record<string,string>>({});
  const [draft,setDraft]=useState("");
  const [copyStatus,setCopyStatus]=useState("");
  const matching=selectVerifiedRules(scenario,answers);
  const allAnswered=scenario.questions.every(q=>Boolean(answers[q.id]));
  const ready=allAnswered && matching.length>0;

  function changeAnswer(id:string,answer:string) {
    const question=scenario.questions.find(q=>q.id===id);
    if(!question?.options.includes(answer)) return;
    setAnswers(before=>({...before,[id]:answer}));
    setDraft("");
    setCopyStatus("");
  }
  function createDraft() {
    if(!ready) return;
    const ids=new Set(matching.map(rule=>rule.id));
    const clauses=scenario.generator.clauses.filter(c=>ids.has(c.ruleId));
    if(!clauses.length) return;
    setDraft([
      scenario.generator.title,
      "",
      "В Департамент городского имущества города Москвы",
      "От заявителя: __________________________",
      "Почтовый адрес для ответа: __________________________",
      scenario.procedure==="social-tenancy"
        ? "Адрес помещения и реквизиты договора социального найма: __________________________"
        : scenario.procedure==="housing-registration"
          ? "Реквизиты уведомления о снятии с жилищного учёта: __________________________"
          : "Дата и регистрационный номер предыдущего обращения: __________________________",
      "",
      ...clauses.map(c=>c.text),
      "",
      "Приложения: __________________________",
      "Дата: __________________________",
      "Подпись: __________________________"
    ].join("\n"));
    setCopyStatus("");
  }
  async function copyDraft() {
    if(!draft) return;
    try {
      await navigator.clipboard.writeText(draft);
      setCopyStatus("Текст проекта скопирован");
    } catch {
      setCopyStatus("Выделите текст проекта ниже и скопируйте вручную");
    }
  }
  return (
    <section className="verified-scenario-intake" aria-labelledby="verified-intake-heading">
      <h2 id="verified-intake-heading">Уточните обстоятельства</h2>
      <p>Ответы остаются в этом браузере и не отправляются на сервер.</p>
      <form onSubmit={event=>{event.preventDefault();createDraft();}}>
        {scenario.questions.map(question=>
          <fieldset key={question.id} className="verified-scenario-question">
            <legend>{question.prompt}</legend>
            {question.options.map(option=>
              <label key={option} className="verified-scenario-option">
                <input type="radio" name={question.id} value={option}
                  checked={answers[question.id]===option}
                  onChange={()=>changeAnswer(question.id,option)}/>
                <span>{option}</span>
              </label>
            )}
          </fieldset>
        )}
        {allAnswered && matching.length===0 &&
          <p className="verified-scenario-warning" role="status">
            Для выбранного сочетания ответов юридическое правило и подходящий проект
            документа этим сценарием не подтверждены. Проверьте применимый порядок
            обращения и документы на странице соответствующей государственной услуги.
          </p>
        }
        {ready && <div aria-live="polite">
          {matching.map(rule=>
            <article key={rule.id} className="verified-scenario-rule">
              <h3>Подтверждённое общее правило</h3>
              <p>{rule.text}</p>
              <p>{rule.scopeNote}</p>
              <p>{rule.exceptionNote}</p>
            </article>
          )}
        </div>}
        <button className="solid-button" type="submit" disabled={!ready}>
          Сформировать проект запроса
        </button>
      </form>
      {draft && <section className="verified-scenario-draft" aria-label="Проект документа">
        <h3>{scenario.generator.title}</h3>
        <p>{scenario.generator.scopeNote}</p>
        <label htmlFor="verified-document-output">Текст проекта для редактирования перед отправкой</label>
        <textarea id="verified-document-output" readOnly rows={15} value={draft}/>
        <button type="button" className="solid-button" onClick={copyDraft}>Скопировать текст</button>
        <p role="status" aria-live="polite">{copyStatus}</p>
      </section>}
    </section>
  );
}
