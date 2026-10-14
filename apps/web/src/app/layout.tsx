import type { Metadata } from "next";
import "./globals.css";
import { siteOrigin } from "@/data/pages";

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: {
    default: "Единая справочная служба Москвы — жилищные вопросы",
    template: "%s | Жилищные вопросы Москвы",
  },
  description: "Жилищные вопросы Москвы: документы, ДГИ, приватизация, реновация, обращения и судебная практика.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
