import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SITE_NAME, SITE_ORIGIN, INDEXABLE } from '../lib/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: { default: SITE_NAME, template: '%s | Единая справочная служба Москвы' },
  description: 'Независимая справочная и правовая информация по жилищным вопросам Москвы.',
  robots: { index: INDEXABLE, follow: INDEXABLE },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
