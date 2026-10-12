import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { robotsRule, siteName, siteOrigin } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: { default: siteName, template: "%s | Единая справочная служба Москвы" },
  description: "Жилищное право Москвы: приватизация, соцнаём, ДГИ, обращения, новости и судебная практика.",
  robots: robotsRule,
  alternates: { canonical: "/" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body><SiteHeader />{children}<SiteFooter /></body></html>;
}
