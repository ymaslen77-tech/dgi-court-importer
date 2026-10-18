import type { MigratedPage } from "@/data/pages";
import { canIndexPage, canonicalUrl, siteOrigin } from "@/data/pages";

// Factual schema only for individually approved public pages. Never invent
// author identities, attorney qualifications, ratings, publication dates or
// judicial outcomes. Rich-result eligibility is not guaranteed by schema.
export function SeoMarkup({page}: {page: MigratedPage}) {
  if (!canIndexPage(page)) return null;
  const url=canonicalUrl(page);
  const websiteId=`${siteOrigin}/#website`;
  const website={
    "@type":"WebSite",
    "@id":websiteId,
    name:"Единая справочная служба Москвы",
    alternateName:"dgi-pravo.ru",
    url:`${siteOrigin}/`,
    inLanguage:"ru",
    description:"Независимый справочный проект по жилищным вопросам Москвы",
  };
  const webpage={
    "@type":"WebPage",
    "@id":`${url}#webpage`,
    name:page.seoTitle,
    url,
    description:page.description,
    inLanguage:"ru",
    isPartOf:{"@id":websiteId},
    ...(page.slug?{breadcrumb:{"@id":`${url}#breadcrumb`}}:{}),
  };
  const graph=[
    website,
    webpage,
    ...(page.slug?[{
      "@type":"BreadcrumbList",
      "@id":`${url}#breadcrumb`,
      itemListElement:[
        {"@type":"ListItem",position:1,name:"Главная",item:`${siteOrigin}/`},
        {"@type":"ListItem",position:2,name:page.title,item:url},
      ],
    }]:[]),
  ];
  // Escape text before injecting JSON into HTML script.
  const json=JSON.stringify({"@context":"https://schema.org","@graph":graph})
    .replace(/</g,"\\u003c").replace(/\u2028/g,"\\u2028").replace(/\u2029/g,"\\u2029");
  return <script type="application/ld+json"
    dangerouslySetInnerHTML={{__html:json}} />;
}
