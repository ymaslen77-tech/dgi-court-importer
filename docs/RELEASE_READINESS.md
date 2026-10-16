# Release readiness — Webflow to Next.js

Source: dgimos.design.webflow.com; Webflow site ID 6aca6bde03aad0f2e3c19259.
Run `pnpm release:audit` to report blockers from sanitized, committed source
inventories. `pnpm release:require-ready` intentionally fails while release
approval has not been established. Passing CI does not constitute approval.

## Manual acceptance requirements

- [ ] Reconcile all 50 private CMS records against their original content.
- [ ] Validate court results, official acts and links between instances.
- [ ] Check current versions and applicability of the 4 legal documents.
- [ ] Verify dates and legal status of the 3 housing-law news items.
- [ ] Verify image rights, alt text and necessity for 5 external CSS photos.
- [ ] Compare all 33 routes with Webflow on desktop/mobile, including forms.
- [ ] Audit CMS URLs, canonical, 301 redirects, sitemap and JSON-LD.
- [ ] Deploy an isolated permanent staging with access controls, monitoring,
      encrypted backups and tested restore.
- [ ] Complete security, accessibility, load and end-to-end acceptance.
- [ ] Obtain explicit legal/editorial, SEO and security approval.

External images are pointers only in migration/webflow-external-media.json.
Do not assume Unsplash image URLs grant redistribution or rights to use them.
Inventory does not cover external embedded or responsive images.

Production requires SITE_CUTOVER=true, SITE_RELEASE_APPROVED=yes, and a
valid HTTPS SITE_URL outside Webflow. Keep Draft PR #2 and the old site
unchanged until final sign-off. Never switch DNS automatically.

## Актуальный технический статус Neon и судебного архива — 16.10.2026

- [x] Отдельный Neon `dgi-court-importer`, PostgreSQL 17, `main` + `staging` (отдельно от других проектов).
- [x] В каждой ветке созданы `dgi` и `dgi_cms`; к `dgi` применены миграции 0001–0005 и проверены таблицы.
- [x] В `dgi` импортированы 78 редакционных записей (33 исходные страницы, 18 правовых инструкций, 20 нормативных записей, 7 услуг), 16 официальных судебных кандидатов, 16 инстанций, 16 ссылок и 50 исходных CMS-записей. Везде черновые статусы.
- [x] Подготовлен серверный SEO-архив полных судебных актов; прошёл сквозной HTTP-тест на временной базе и 194/194 браузерных тестов.
- [ ] Получить реальные полные опубликованные и пригодные для повторного размещения тексты восьми исследованных судебных определений; импортировать в закрытую Neon `staging` через проверку персональных данных.
- [ ] Запустить штатные миграции Payload CMS в отдельной `dgi_cms` через защищённое окружение, проверить роли, медиа и содержимое 50 исходных записей.
- [ ] Установить защищённые runtime-секреты `DATABASE_URL` и `CMS_DATABASE_URL`, проверить интеграционный запуск без публикации.
- [ ] Завершить юридическую проверку всех официальных публикаций и связанных редакций, точность содержания судебных решений, права на медиа и редакционное SEO.
- [ ] Провести backup/restore, security/accessibility тесты, независимую приёмку и отдельно санкционировать выпуск.

**Проверено напрямую в Neon:** обе ветки `dgi`: 78 страниц, 16 дел, 16 инстанций, 16 ссылок, 50 CMS-метаданных, 0 полных текстов и 0 публикаций. **`dgi_cms` в обеих ветках пока не имеет таблиц Payload**; сам факт создания базы не означает готовую CMS. [Детальная конфигурация](NEON_DGI_BOOTSTRAP_2026-10-16.md).

**Не делать без отдельного разрешения:** merge GitHub `main`, Vercel deploy, DNS cutover и перевод черновиков в public/indexable. Проверенные ссылки на судебные акты — не замена сохранённого полного текста.
