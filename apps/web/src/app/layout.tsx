import type { Metadata } from "next";
import "./globals.css";

// Absolute production host for share previews. Does not enable indexing.
const publicSiteOrigin = "https://dgi-pravo.ru";
const brand = "Единая справочная служба Москвы — жилищные вопросы";
const description = "Независимый справочник по жилищному праву Москвы: ДГИ, приватизация, реновация, судебные дела и проверка официальных источников.";

export const metadata: Metadata = {
  metadataBase: new URL(publicSiteOrigin),
  title: {
    default: brand,
    template: "%s | Жилищные вопросы Москвы",
  },
  description,
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: brand,
    title: brand,
    description,
  },
  twitter: {
    card: "summary",
    title: brand,
    description,
  },
  // Noindex is still required until legal and editorial approval.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
