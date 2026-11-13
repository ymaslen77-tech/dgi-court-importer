import { getMigratedPage } from "@/data/pages";

/**
 * FIRST-SPRINT DRAFT: navigation only, NOT legal advice or an approval of
 * existing text. Every destination is an already-listed owner-released
 * article. No normative rule, deadline, entitlement, court outcome or
 * new editorial claim may be generated from these groupings.
 */
const groups = [
  { id:"housing-records", title:"Жилищный учёт",
    slugs:["zhilishchnyj-uchet","zhilishchnaya-ochered","snyatie-s-zhilishchnogo-ucheta-moskva","zhilishchnye-subsidii"] },
  { id:"privatization", title:"Приватизация",
    slugs:["privatizaciya-zhilya","otkaz-v-privatizacii-kvartiry","dokumenty-na-kvartiru"] },
  { id:"social-housing", title:"Социальный наём",
    slugs:["socialnyj-naem","isk-o-vyselenii-socialnyy-naem"] },
  { id:"renovation", title:"Реновация",
    slugs:["renovaciya-pereselenie","avariynoe-zhile-moskva"] },
  { id:"dgi-appeals", title:"Обращения и споры с ДГИ",
    slugs:["spory-s-dgi","zayavlenie-v-dgi-moskvy","zhaloba-na-dgi-moskvy"] },
  { id:"city-property", title:"Городское имущество и земля",
    slugs:["gorodskoe-imushchestvo-i-zemlya","arenda-zemli-dgi-moskvy","torgi-dgi-moskvy","vymorochnoe-imushchestvo-moskva","vymorochnoe-imushchestvo-kvartira-moskva","kadastrovaya-stoimost"] },
  { id:"communal-housing", title:"ЖКХ и управление домом",
    slugs:["pereraschet-zhku-moskva","zashchita-prav-sobstvennika-mkd","pereplanirovka-kvartiry-moskva"] },
] as const;

export function getNavigatorPreviewGroups() {
  return groups.map(group=>({
    id:group.id,
    title:group.title,
    items:group.slugs.map(slug=>{
      const page=getMigratedPage(slug);
      if(!page) throw new Error("Navigator points to unknown existing page: "+slug);
      return { href:"/"+slug,title:page.title };
    }),
  }));
}


/**
 * RESEARCH-ONLY routing index. These scenario labels organize EXISTING articles
 * and make no claim that any linked article or procedure is legally endorsed.
 * No automated decision, deadline, court outcome, eligibility or recommendation.
 * The enclosing page returns 404 in production.
 */
const scenarioTopics = [
  { id:"privatization-refusal", title:"Отказ в приватизации",
    slugs:["otkaz-v-privatizacii-kvartiry","privatizaciya-zhilya","spory-s-dgi"] },
  { id:"housing-registration-removal", title:"Снятие с жилищного учёта",
    slugs:["snyatie-s-zhilishchnogo-ucheta-moskva","zhilishchnyj-uchet","zhilishchnaya-ochered"] },
  { id:"citizen-correspondence", title:"Обращения в ДГИ",
    slugs:["zayavlenie-v-dgi-moskvy","zhaloba-na-dgi-moskvy","spory-s-dgi"] },
] as const;

export function getNavigatorPreviewScenarios() {
  return scenarioTopics.map(scenario=>({
    id:scenario.id,
    title:scenario.title,
    evidenceStatus:"research_only" as const,
    items:scenario.slugs.map(slug=>{
      const page=getMigratedPage(slug);
      if(!page) throw new Error("Private scenario points to unknown migrated page: "+slug);
      return {href:"/"+slug,title:page.title};
    }),
  }));
}

// Cross-topic directory: the other nine already-owner-released legacy routes.
// Home (empty slug) is the 33rd inventory record and is not repeated as a topic.
// This list is NAVIGATION ONLY, not a legal endorsement or content review.
const crossTopicSlugs = [
  "rukovodstvo-dgi-moskvy",
  "rasporyazheniya-prikazy-dgi-moskvy",
  "zapis-na-priem-dgi-moskvy",
  "novosti-zhilishchnogo-prava",
  "sudebnaya-praktika-dgi",
  "kontakty-dgi",
  "gosuslugi-dgi",
  "normativnye-akty",
  "funkcii-dgi",
] as const;

export function getNavigatorPreviewCrossTopicPages() {
  return crossTopicSlugs.map(slug => {
    const page = getMigratedPage(slug);
    if (!page) throw new Error("Missing already-released cross-topic page: " + slug);
    return { href: "/" + slug, title: page.title };
  });
}

/**
 * These ten form entrypoints were audited against MigratedArticle and the
 * existing LegalDocumentBuilder/SpecializedDocumentBuilder implementations.
 * The navigator makes NO claim about whether a form is the correct legal
 * procedure for a person's facts. Links lead to existing articles/forms.
 */
const existingFormEntrypoints = [
  { id: "request", title: "Подготовить обращение в ДГИ", slug: "zayavlenie-v-dgi-moskvy", kind: "request" },
  { id: "service-complaint", title: "Подготовить жалобу на предоставление госуслуги", slug: "zhaloba-na-dgi-moskvy", kind: "service-complaint" },
  { id: "civil-objection", title: "Подготовить возражения на гражданский иск", slug: "isk-o-vyselenii-socialnyy-naem", kind: "civil-objection" },
  { id: "housing-removal", title: "Запросить решение о снятии с жилищного учёта", slug: "snyatie-s-zhilishchnogo-ucheta-moskva", kind: "housing-removal" },
  { id: "privatization-service-complaint", title: "Жалоба на отказ в предоставлении услуги приватизации", slug: "otkaz-v-privatizacii-kvartiry", kind: "privatization-service-complaint" },
  { id: "utility-quality", title: "Обращение о качестве коммунальных услуг и проверке начислений", slug: "pereraschet-zhku-moskva", kind: "utility-quality" },
  { id: "inheritance-acceptance", title: "Заявление нотариусу о принятии наследства", slug: "vymorochnoe-imushchestvo-moskva", kind: "inheritance-acceptance" },
  { id: "emergency-housing", title: "Заявление об оценке состояния жилья межведомственной комиссией", slug: "avariynoe-zhile-moskva", kind: "emergency-housing" },
  { id: "renovation-comments", title: "Замечания к предложенной квартире по реновации", slug: "renovaciya-pereselenie", kind: "renovation-comments" },
  { id: "mkd-information", title: "Запрос сведений о решениях собрания собственников МКД", slug: "zashchita-prav-sobstvennika-mkd", kind: "mkd-information" },
] as const;

export function getNavigatorPreviewForms() {
  return existingFormEntrypoints.map(item => {
    if (!getMigratedPage(item.slug))
      throw new Error("Document entrypoint has no existing article: " + item.slug);
    return { id: item.id, title: item.title, kind: item.kind, href: "/" + item.slug };
  });
}


/**
 * Five source-neutral research questionnaires kept exclusively on the
 * private /navigator-dgi route. These options gather no identifying data,
 * do not model an entitlement, remedy, deadline or correct procedure.
 * Native radio controls require no client-side script or persistence.
 */
const researchFactQuestionnaires = [
  {
    id: "privatization-refusal",
    title: "Отказ в приватизации",
    questions: [
      { id: "request", title: "Было ли подано заявление?", options: ["Да", "Нет", "Не знаю"] },
      { id: "response", title: "Какое сообщение получено?", options: ["Письменный отказ", "Другое письменное сообщение", "Ответа нет", "Не знаю"] },
      { id: "housing", title: "Какой документ о пользовании жильём известен?", options: ["Договор социального найма", "Другой документ", "Не знаю"] },
      { id: "participants", title: "Есть ли сведения о позиции других проживающих?", options: ["Да", "Нет", "Не знаю"] },
      { id: "grounds", title: "Указана ли причина в полученном документе?", options: ["Да", "Нет", "Документа нет", "Не знаю"] },
    ],
  },
  {
    id: "housing-registration-removal",
    title: "Снятие с жилищного учёта",
    questions: [
      { id: "notice", title: "Приходило ли сообщение о снятии с учёта?", options: ["Письменное", "Другое сообщение", "Нет", "Не знаю"] },
      { id: "decision", title: "Есть ли документ с решением?", options: ["Да", "Нет", "Не знаю"] },
      { id: "registration", title: "Сохранился ли документ о постановке на учёт?", options: ["Да", "Нет", "Не знаю"] },
      { id: "grounds", title: "Указана ли причина снятия в документе?", options: ["Да", "Нет", "Документа нет", "Не знаю"] },
    ],
  },
  {
    id: "dgi-no-response",
    title: "Ответ ДГИ не получен",
    questions: [
      { id: "kind", title: "Что было направлено?", options: ["Общее обращение", "Заявление на госуслугу", "Другой документ", "Не знаю"] },
      { id: "channel", title: "Каким способом?", options: ["Электронный сервис", "На бумаге", "Другой способ", "Не знаю"] },
      { id: "registration", title: "Есть ли подтверждение приёма?", options: ["Да", "Нет", "Не знаю"] },
      { id: "response", title: "Поступали ли какие-либо сообщения?", options: ["Да", "Нет", "Не знаю"] },
    ],
  },
  {
    id: "social-tenancy-dispute",
    title: "Разногласия по социальному найму",
    questions: [
      { id: "contract", title: "Есть ли экземпляр договора?", options: ["Да", "Нет", "Не знаю"] },
      { id: "subject", title: "С чем связаны разногласия?", options: ["Оформление договора", "Пользование помещением", "Полученное уведомление", "Иное / не знаю"] },
      { id: "written", title: "Есть ли обращения или ответы по этому вопросу?", options: ["Да", "Нет", "Не знаю"] },
      { id: "court", title: "Известно ли о судебном деле по вопросу?", options: ["Да", "Нет", "Не знаю"] },
    ],
  },
  {
    id: "renovation-offer-disagreement",
    title: "Предложенная квартира по реновации",
    questions: [
      { id: "offer", title: "Получено ли предложение помещения?", options: ["Письменное", "Другое сообщение", "Нет", "Не знаю"] },
      { id: "documents", title: "Есть ли описание предлагаемого помещения?", options: ["Да", "Нет", "Не знаю"] },
      { id: "concern", title: "Какой аспект вызывает вопросы?", options: ["Характеристики помещения", "Оформление документов", "Другое", "Пока не определено"] },
      { id: "communication", title: "Направлялись ли замечания по предложению?", options: ["Да", "Нет", "Не знаю"] },
    ],
  },
] as const;

export function getNavigatorResearchFactQuestionnaires() {
  return researchFactQuestionnaires;
}
