// Source-grounded presentation categories from 33 paired Webflow/Next.js
// Chromium screenshots (desktop and mobile), GitHub Actions run 38548757853.
// Only the page presentation changes: migrated legal text is NOT approved.
export const lightReferenceSlugs = [
  "dokumenty-na-kvartiru",
  "funkcii-dgi",
  "gorodskoe-imushchestvo-i-zemlya",
  "gosuslugi-dgi",
  "kadastrovaya-stoimost",
  "kontakty-dgi",
  "normativnye-akty",
  "privatizaciya-zhilya",
  "renovaciya-pereselenie",
  "socialnyj-naem",
  "spory-s-dgi",
  "sudebnaya-praktika-dgi",
  "zhilishchnaya-ochered",
  "zhilishchnye-subsidii",
  "zhilishchnyj-uchet",
] as const;
const lightSlugs: ReadonlySet<string> = new Set(lightReferenceSlugs);
export function isThematicSlug(slug: string): boolean {
  return lightSlugs.has(slug);
}

// The emphasized phrases were observed in source Webflow desktop screenshots.
// No text is generated: highlighting applies only when the phrase actually
// occurs in the recovered original heading.
const sourceHeadingAccents: Readonly<Record<string,string>> = {
  "arenda-zemli-dgi-moskvy": "города Москвы: порядок и документы",
  "avariynoe-zhile-moskva": "Как добиться обследования?",
  "isk-o-vyselenii-socialnyy-naem": "ДГИ",
  "novosti-zhilishchnogo-prava": "жилищного права",
  "otkaz-v-privatizacii-kvartiry": "что делать",
  "pereplanirovka-kvartiry-moskva": "Что разрешено и как согласовать?",
  "pereraschet-zhku-moskva": "Как добиться проверки и перерасчёта?",
  "rasporyazheniya-prikazy-dgi-moskvy": "где найти документ",
  "rukovodstvo-dgi-moskvy": "руководитель и обращения",
  "torgi-dgi-moskvy": "квартиры, земля и городское имущество",
  "vymorochnoe-imushchestvo-moskva": "выморочной.",
  "vymorochnoe-imushchestvo-kvartira-moskva": "выморочная",
  "zapis-na-priem-dgi-moskvy": "адреса, часы и порядок",
  "zashchita-prav-sobstvennika-mkd": "Защитить права собственника.",
  "zayavlenie-v-dgi-moskvy": "Департамент городского имущества Москвы",
  "zhaloba-na-dgi-moskvy": "как оспорить отказ или бездействие",
};
export function sourceHeadingAccentIndex(slug:string,heading:string):number {
  const phrase=sourceHeadingAccents[slug];
  return phrase ? heading.toLocaleLowerCase("ru").lastIndexOf(phrase.toLocaleLowerCase("ru")) : -1;
}
