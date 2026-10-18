"use client";
import { useEffect, useRef, useState } from "react";
import type { CourtListing } from "./CourtExplorer";
type CourtPage={items:CourtListing[];nextCursor:string|null};
export function CourtDatabaseExplorer() {
  const [query,setQuery]=useState("");
  const [activeQuery,setActiveQuery]=useState("");
  const [items,setItems]=useState<CourtListing[]>([]);
  const [nextCursor,setNextCursor]=useState<string|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const abort=useRef<AbortController|null>(null);
  const request=async (q:string,cursor:string|null,append:boolean) => {
    abort.current?.abort();
    const controller=new AbortController();
    abort.current=controller;
    setBusy(true);setError(null);
    const params=new URLSearchParams({q});
    if(cursor)params.set("cursor",cursor);
    try{
      const response=await fetch("/api/courts/search?"+params.toString(),
        {signal:controller.signal,cache:"no-store"});
      if(!response.ok)throw new Error("Не удалось получить данные. Повторите запрос.");
      const data=await response.json() as CourtPage;
      if(!Array.isArray(data.items))throw new Error("Некорректный ответ поиска");
      setItems(previous=>append?[...previous,...data.items]:data.items);
      setNextCursor(data.nextCursor);
    } catch(cause){
      if(controller.signal.aborted)return;
      setError(cause instanceof Error?cause.message:"Ошибка поиска");
    } finally {
      if(!controller.signal.aborted)setBusy(false);
    }
  };
  useEffect(()=>{
    void request("",null,false);
    return ()=>abort.current?.abort();
  },[]);
  return <div className="container court-browser">
    <form className="filter-row" onSubmit={event=>{
      event.preventDefault();
      setActiveQuery(query.trim());
      void request(query.trim(),null,false);
    }}>
      <label htmlFor="db-case-search">Номер дела, суд или категория
        <input id="db-case-search" type="search" maxLength={100} value={query}
          placeholder="Например, 88-21277/2026" onChange={event=>setQuery(event.target.value)}/>
      </label>
      <div className="court-form-action"><button type="submit" disabled={busy}>Найти судебные карточки</button></div>
    </form>
    <p className="results-count" aria-live="polite">
      Показано карточек: {items.length}. Сведения о судебных решениях не подтверждены без проверки соответствующих актов.
    </p>
    {error&&<p role="alert" className="court-error">{error}</p>}
    <div className="case-grid">
      {items.map(item=><article className="case-card" key={item.id}>
        <p className="case-tag">{item.source==="official-candidate"?
          "СВЕДЕНИЯ О ДЕЛЕ · СУДЕБНЫЙ АКТ УТОЧНЯЕТСЯ":
          "АРХИВНАЯ КАРТОЧКА · РЕШЕНИЕ НЕ ПОДТВЕРЖДЕНО"}</p>
        <h2>Дело № {item.number}</h2>
        <p>{item.court}</p>
        <p className="case-category">{item.category}</p>
        {item.url&&<a href={item.url} target="_blank" rel="noopener noreferrer">Открыть источник ↗</a>}
      </article>)}
    </div>
    {!busy&&!error&&items.length===0&&<p>Карточки не найдены.</p>}
    {nextCursor&&<button className="court-more" type="button" disabled={busy}
      onClick={()=>void request(activeQuery,nextCursor,true)}>
      {busy?"Загрузка…":"Показать ещё 24 карточки"}
    </button>}
    {busy&&<p aria-live="polite">Загрузка результатов…</p>}
  </div>;
}
