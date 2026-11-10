import { getMigratedPage } from "@/data/pages";

/**
 * FIRST-SPRINT DRAFT: navigation only, NOT legal advice or an approval of
 * existing text. Every destination is an already-listed owner-released
 * article. No normative rule, deadline, entitlement, court outcome or
 * new editorial claim may be generated from these groupings.
 */
const groups = [
  { id:"housing-records", title:"Жилищный учёт",
    slugs:["zhilishchnyj-uchet","zhilishchnaya-ochered","snyatie-s-zhilishchnogo-ucheta-moskva"] },
  { id:"privatization", title:"Приватизация",
    slugs:["privatizaciya-zhilya","otkaz-v-privatizacii-kvartiry","dokumenty-na-kvartiru"] },
  { id:"social-housing", title:"Социальный наём",
    slugs:["socialnyj-naem","isk-o-vyselenii-socialnyy-naem"] },
  { id:"renovation", title:"Реновация",
    slugs:["renovaciya-pereselenie","avariynoe-zhile-moskva"] },
  { id:"dgi-appeals", title:"Обращения и споры с ДГИ",
    slugs:["spory-s-dgi","zayavlenie-v-dgi-moskvy","zhaloba-na-dgi-moskvy"] },
  { id:"city-property", title:"Городское имущество и земля",
    slugs:["gorodskoe-imushchestvo-i-zemlya","arenda-zemli-dgi-moskvy","torgi-dgi-moskvy"] },
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
