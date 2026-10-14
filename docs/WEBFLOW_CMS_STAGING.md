# Этап 3: перенос Webflow CMS в PostgreSQL (без публикации)

**Рабочая ветка:** `feature/nextjs-webflow-migration`, Draft PR #2. Сайт `https://dgimos.webflow.io/` продолжает работу; `main` не изменяется.

## Что действительно реализовано

1. `migration/cms-inventory.json` — **50 очищенных записей** по снимку CMS из PR #5. Это не актуализация с Webflow в реальном времени, а воспроизводимый исходный архив:
   - `dgi-court-cases`: **37**, в старой CMS 22 публичных и 15 черновиков;
   - `dgi-legal-documents`: **4** черновика;
   - `dgi-legal-situations`: **6** черновиков;
   - `housing-law-news`: **3** черновика.
2. `db/migrations/0002_webflow_cms_staging.sql` — изолированная таблица `webflow_cms_staging` в PostgreSQL с уникальными source IDs и slug, запретом `publication_allowed=true` и `verified=true`.
3. `scripts/lib/prepare-cms-inventory.mjs` — проверка строгого перечня разрешённых полей, официальных доменов суда и отсутствия объявленного результата дела.
4. `scripts/import-cms-inventory.mjs` — транзакционный повторяемый импорт; обычный запуск **dry-run** не соединяется с базой.
5. `scripts/lib/sanitize-webflow-cms.mjs` и `scripts/build-cms-inventory.mjs` — безопасное создание нового архива из приватного локального экспорта. Не копируют полные тексты, людей, решения, неподтверждённые результаты и юридические выводы.
6. `.github/workflows/website-ci.yml` — тесты JavaScript, PostgreSQL 17, миграции 0001 + 0002, двойная загрузка обоих наборов и SQL-проверка **50 записей, 0 опубликованных**.

Важно: среди 37 судебных записей есть совпадения с 16 кандидатами из `data/court-catalog.jsonl`. Суммирование этих чисел не равно количеству уникальных судебных дел.

## Проверки и ограничения

- Источник CMS и правовой статус не смешиваются: `legacy_public_unverified` означает, что материал **был опубликован на старом Webflow**, а не то, что исход судебного разбирательства проверен.
- Номер дела, суд, УИД, категория и официальный URL не подтверждают содержание судебного акта.
- Для судебных карточек не сохраняются имена участников, судебные выводы, мотивировки, тексты актов и заголовки с неподтверждёнными результатами.
- Черновики новостей и юридических ситуаций переносятся только как навигационные метаданные; полные материалы потребуют отдельного редакционного переноса.
- Это **staging**, не Payload CMS и не публичный рендеринг сайта из PostgreSQL. Никакие новые данные из CMS пока не появляются на Next.js-страницах автоматически.
- Фотографии и фоновые изображения, взаимодействия Webflow, реальные акты судов и визуальная проверка ещё не перенесены и не подтверждены.

## Как проверить локально (на отдельной тестовой БД)

```sh
corepack enable
pnpm install --no-frozen-lockfile
pnpm test
pnpm migration:cms:dry-run
# Запустить ТОЛЬКО отдельный тестовый PostgreSQL через docker compose.
docker compose up -d database
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/0001_initial.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/0002_webflow_cms_staging.sql
pnpm migration:cms:apply
pnpm migration:cms:apply
psql "$DATABASE_URL" -c "SELECT source_collection,source_status,count(*) FROM webflow_cms_staging GROUP BY 1,2 ORDER BY 1,2;"
```

`DATABASE_URL` должен указывать **только на изолированную тестовую базу**, не production. Убедитесь, что переменные подхвачены в оболочку. В CI сервис и пароль создаются автоматически и уничтожаются после запуска.

## Новый снимок Webflow CMS без утечки черновиков

Экспорт из Webflow API сохраняется локально в игнорируемой Git папке `.migration/`. Получить исходные данные поможет существующий `scripts/export-webflow.mjs`; файл приватного экспорта нужно привести к структуре `{"collections":[{"id", "slug", "items":[...]},...]}` (4 коллекции). Затем:

```sh
node scripts/build-cms-inventory.mjs .migration/private-webflow-cms.json migration/cms-inventory.json
pnpm migration:cms:dry-run
```

**Никогда не коммитьте** `.migration/private-webflow-cms.json` или другой полный сырой CMS-экспорт: там могут содержаться неопубликованные редакционные материалы и персональные сведения. Для публичного GitHub разрешён только проходящий whitelist-инвентарь.

## Следующие шаги

1. Связать редакционную Payload CMS с PostgreSQL и добавить модель версионирования/проверки, чтобы в публичный API попадали только подтверждённые материалы.
2. Реализовать связи судебных инстанций и поиск через БД вместо локального `jsonl`.
3. Перенести контентные блоки и лицензированные изображения Webflow, проверить юридическую точность.
4. Сверить адреса, SEO-метатеги, якоря, sitemap и 301-карту, выполнить mobile/desktop QA.
5. Оставлять `SITE_CUTOVER=false` до окончательной приёмки и согласования переключения домена.
