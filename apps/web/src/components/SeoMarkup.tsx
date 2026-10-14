import type { MigratedPage } from "@/data/pages";
import { canonicalUrl, siteIsLive, siteOrigin } from "@/data/pages";

// Minimal factual schema. No unsupported reviews, legal credentials,
// fictional organization address, dates, author or court outcomes.
export function SeoMarkup({page}: {page: MigratedPage}) {
  if (!siteIsLive) return null;
  const url=canonicalUrl(page);
  const site={ "@type":"WebSite",name:"Единая справочная служба Москвы",
    url:siteOrigin };
  const breadcrumbs=[
    { "@type":"ListItem",position:1,name:"Главная",item:siteOrigin },
    ...(page.slug?[{"@type":"ListItem",position:2,name:page.title,item:url}]:[]),
  ];
  const graph=[
    { "@type":"WebPage",name:page.seoTitle,url,description:page.description,
      inLanguage:"ru",isPartOf:site },
    ...(page.slug?[{"@type":"BreadcrumbList",itemListElement:breadcrumbs}]:[]),
  ];
  // JSON embedded in an HTML script must never accept raw closing tags.
  const json=JSON.stringify({"@context":"https://schema.org","@graph":graph})
    .replace(/</g,"\\u003c").replace(/\u2028/g,"\\u2028").replace(/\u2029/g,"\\u2029");
  return <script type="application/ld+json"
    dangerouslySetInnerHTML={{__html:json}} />;
}
