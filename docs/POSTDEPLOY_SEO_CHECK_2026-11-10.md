# Проверка SEO после деплоя — 10 ноября 2026

Основание: защищённая ветка `infra/coolify-russian-vps` SHA `7201e246f09ec975b2e50fa9b589e1e35b9f2891`; владелец сообщил о деплое. Исполняемый Coolify image SHA не получен из сервера, поэтому по исходному GitHub SHA **нельзя однозначно удостоверить именно запущенный контейнер**.

## Повторная фактическая HTTP-проверка

Источник: [DGI SEO audit, GH run 42689923906](https://github.com/ymaslen77-tech/dgi-court-importer/actions/runs/42689923906), [independent HTTP smoke, GH run 42689924163](https://github.com/ymaslen77-tech/dgi-court-importer/actions/runs/42689924163).

- `robots.txt`: 200, общий `Disallow: /` отсутствует.
- `sitemap.xml`: 200, 104 уникальных опубликованных URL (проверенный белый список исходников); нет неподтверждённых дополнительных адресов.
- HTML: в одном прогоне 104/104 HTTP 200, 0 ошибок, 0 предупреждений; во **втором последовательном повторе SEO-аудита после окончания тяжёлого Lighthouse** также 104/104, 0 ошибок, 0 предупреждений.
- Canonical, title, description, H1, lang, viewport, отсутствие `noindex` на разрешённых HTML URL проверены программно.
- PDF в `/api/courts/verified/…/pdf`: 200, `application/pdf`, `X-Robots-Tag: noindex, nofollow`; эти PDF **не** публикуются в sitemap.
- `www.dgi-pravo.ru` → канонический домен: 308.
- 404 для внутренних редакционных справочников в статусе preview и заранее несуществующего URL.

**Важно:** один параллельный скан во время одновременной Lighthouse + smoke нагрузки дал **один 502**, четыре aborted/timeout URL, 99 успешно просмотренных HTML. После снятия высокой одновременной нагрузки: 104/104 успешно. Не подменять этот факт формулой «сервер никогда не выдаёт 5xx». Источник отдельной проблемы сессии не установлен без логов и метрик Coolify. Если повторится при реальных запросах — диагностика reverse proxy, Next.js, CPU/RAM/OOM, базы и upstream.

## Лабораторная скорость, accessibility

Источник: [Lighthouse, GH run 42689923875](https://github.com/ymaslen77-tech/dgi-court-importer/actions/runs/42689923875), 14 JSON-отчётов (7 маршрутов × desktop/mobile), повторный запуск после заявленного деплоя.

- SEO 100/100 на всех 14; Accessibility 100/100 на всех 14; CLS = 0.
- Desktop Performance 100 на всех.
- Mobile Performance: шесть маршрутов 98–99, главная **74**, с TBT **1448 ms**. Это выброс в одном синтетическом запуске, не field INP.
- На главной `bootup-time` JavaScript 1422 ms; Яндекс Метрика `mc.yandex.ru/metrika/tag.js`: примерно 653 ms main-thread, из них 631 ms script evaluation; third-party `blockingTime` около 544 ms. Один bundled Next.js script также занимает свыше 500 ms bootup-time. Корректно измерить повторяемость и влияние собственных скриптов, а не отключать аналитику ради набора баллов.
- Best Practices 78 desktop, 79 mobile; выявлены ограничения на сторонние cookies/DevTools issues Яндекс Метрики. Не доказана санкция или потеря позиций. Трекер оставить без изменений, отдельно анализировать законность использования cookies и передачу данных.

## SEO-согласованность бренда

В защищённом коде `PageShell`, `layout.tsx`, `SeoMarkup WebSite` уже использовали «Жилищный справочник Москвы», но `HomePage.generateMetadata` и `SeoMarkup WebPage.name` использовали старый `pages-*.json` `seoTitle` «Единая справочная служба Москвы — жилищные вопросы». Публичный тег title существовал, был уникален, но название не совпадало с текущим брендом и могло восприниматься как государственная служба. В этом PR исправляется **только отображаемый SEO title для /** и его schema WebPage name; исходный юридический snapshot не меняется.

## Улучшение проверки

В `scripts/seo-live-audit.mjs` уменьшаем число параллельных запросов с 5 до 2. Для 429/502/503/504 и сетевых сбоев до трёх попыток с небольшой задержкой. Восстановившиеся ошибки **сохраняются как предупреждения**, постоянные 5xx и запреты индексирования **остаются критическими ошибками**. Это делает аудит менее агрессивным к небольшому VPS и сохраняет наблюдаемость непостоянных сбоев. Новые проверки через PR не изменяют live до отдельного Coolify deploy.

## Остаточные границы уверенности

- Не установлены **фактические** данные Google Search Console и Яндекс Вебмастера по сканированию/индексации; пользователь сообщил, что отчёты пусты. Техническая crawlability и Lighthouse SEO 100 **не гарантируют включение в индекс**.
- Нет полевых p75 Core Web Vitals (LCP/INP/CLS) из Search Console/CrUX; Lighthouse TBT не является INP.
- Нет доказательства полной юридической актуальности каждой из 33 legacy-страниц; 18 draft-руководств остаются закрыты.
- Нет измеренных server CPU/RAM/error logs в Coolify и подтверждённого развернутого container SHA.
- Не требуются изменения robots/sitemap: на фактической публичной выборке всё открыто согласно официальным рекомендациям.

## Официальные справки

- Google: [Crawling and indexing FAQ](https://developers.google.com/search/help/crawling-index-faq); [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals); [Site names](https://developers.google.com/search/docs/appearance/site-names).
- Яндекс: [Как работает поиск](https://yandex.ru/support/webmaster/ru/yandex-indexing/site-indexing); [Анализ индексации страницы](https://yandex.ru/support/webmaster/ru/site-indexing/page-indexing-analysis).

**Релиз:** эти правки только в отдельной ветке и PR, CI обязателен; никакие значения Coolify, CMS, robots.txt, состав публичных URL и ключи не меняются. Собственно Deploy — операция владельца после merge.
