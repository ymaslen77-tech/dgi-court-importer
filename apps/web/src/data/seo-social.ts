import type { Metadata } from "next";

// Share-card metadata is factual, uses the current public domain and does not
// change canonical, robots, publication approvals or schema eligibility.
export function factualSocialMetadata(
  slug: string,
  title: string,
  description: string,
  type: "article" | "website" = "article",
): Pick<Metadata, "openGraph" | "twitter"> {
  const path = slug ? `/${slug}` : "/";
  return {
    openGraph: {
      type,
      locale: "ru_RU",
      siteName: "Единая справочная служба Москвы — жилищные вопросы",
      url: new URL(path, "https://dgi-pravo.ru").toString(),
      title,
      description,
    },
    twitter: { card: "summary", title, description },
  };
}
