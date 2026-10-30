import type { Metadata } from "next";
import Script from "next/script";
import { siteIsLive } from "@/data/pages";
import "./globals.css";

// Root metadata must be evaluated in the production runtime, not fixed during
// a closed/staging Docker build. Routes still keep their own noindex gates.
export const dynamic = "force-dynamic";

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
  // Production pages may be indexed; drafts and staging remain closed.
  // Each unpublished/preview-only route can still override this with noindex.
  robots: { index: siteIsLive, follow: siteIsLive },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        {children}
        <Script id="yandex-metrika-113799502" strategy="afterInteractive">{`
          (function(m,e,t,r,i,k,a){
            m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            for(var j=0;j<document.scripts.length;j++){
              if(document.scripts[j].src===r){return;}
            }
            k=e.createElement(t);a=e.getElementsByTagName(t)[0];
            k.async=1;k.src=r;a.parentNode.insertBefore(k,a);
          })(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=113799502','ym');
          ym(113799502,'init',{
            ssr:true,webvisor:true,clickmap:true,ecommerce:'dataLayer',
            referrer:document.referrer,url:location.href,
            accurateTrackBounce:true,trackLinks:true
          });
        `}</Script>
        <noscript>
          <div>
            {/* Tracking pixel for browsers with JavaScript disabled. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://mc.yandex.ru/watch/113799502" alt="" width="1" height="1" style={{ position: "absolute", left: "-9999px" }} />
          </div>
        </noscript>
      </body>
    </html>
  );
}
