import type { Metadata, Viewport } from 'next';
import { SiteHeader, SiteFooter } from '@/components/site-header';
import { SITE_NAME, CANONICAL_ORIGIN, INDEXING_ENABLED } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(CANONICAL_ORIGIN),
  title: { default: SITE_NAME, template: '%s | ' + SITE_NAME },
  description: 'Жилищные вопросы Москвы: приватизация, социальный наём, реновация, документы, ДГИ и судебная практика.',
  robots: { index: INDEXING_ENABLED, follow: INDEXING_ENABLED },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>
    <a className="skip-link" href="#main">Перейти к содержимому</a>
    <div className="utility-bar"><div className="container">МОСКВА · ЖИЛИЩНОЕ ПРАВО · СПРАВОЧНЫЕ МАТЕРИАЛЫ</div></div>
    <SiteHeader />
    <main id="main">{children}</main>
    <SiteFooter />
  </body></html>;
}
