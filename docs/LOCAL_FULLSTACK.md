# ДГИ: полный локальный стек (Windows 11, PowerShell 7)

Цель: завершить разработку и техническую проверку до подключения сервера.
Исходная ветка: `feature/nextjs-webflow-migration`, Draft PR №2.
Ни одна команда не переключает DNS, не публикует Webflow и не объединяет PR.

Нужны Node.js 22+, Corepack, Docker Desktop + Compose v2, PowerShell 7,
Git и интернет для скачивания пакетов. Создайте **только на своём ПК**
`.env` из `.env.example`. Замените обе заглушки паролей PostgreSQL
на разные случайные строки от 20 символов. Добавьте независимый
`PAYLOAD_SECRET` от 32 символов и для первоначальной учётной записи —
`CMS_BOOTSTRAP_EMAIL` и `CMS_BOOTSTRAP_PASSWORD` (от 16 символов).
Файл .env исключён из Git; не публикуйте пароли или токен Webflow.

## Этапы локального запуска

В каталоге репозитория:

```powershell
.\scripts\local-fullstack.ps1 -Action Setup
.\scripts\local-fullstack.ps1 -Action Bootstrap -SkipInstall
.\scripts\local-fullstack.ps1 -Action Import -SkipInstall
.\scripts\local-fullstack.ps1 -Action Check -SkipInstall
.\scripts\local-fullstack.ps1 -Action VerifyData -SkipInstall
```

`Setup` запускает две изолированные локальные PostgreSQL-базы на
127.0.0.1:5434/5435 и накатывает SQL-миграции **только в пустую
базу сайта**. `Bootstrap` создаёт первого администратора единожды.
`Import` сохраняет 33 публичные страницы Webflow как
**неодобренные черновики** и 50 CMS-записей как закрытую очередь
метаданных, без публикации. Повторный импорт идемпотентен.
`Check` прогоняет тесты, TypeScript, сборку сайта и audit
блокеров релиза и создаёт закрытую матрицу ручной приёмки:
`.migration/reports/local-acceptance.md` и `.json`. По всем 33
страницам дизайн, мобильная версия, интерактивность и права на изображения
по умолчанию помечены как **ожидающие проверки**.
`VerifyData` читает **реальные локальные** две базы и требует строго
33 черновика, 50 метаданных, отсутствие преждевременной публикации,
а также действительного локального администратора Payload.
Для проверки полной частной копии после `FullSource -ApplyFull`
повторите команду с `-RequireFullSource`, тогда будут обязательны 50
полных оригиналов Webflow в закрытой CMS.
После импорта редактор проверяет данные в Payload.

Открыть в двух **разных** терминалах:

```powershell
.\scripts\local-fullstack.ps1 -Action Web -SkipInstall
.\scripts\local-fullstack.ps1 -Action Cms -SkipInstall
```

Публичный предпросмотр: http://127.0.0.1:3000.
Закрытый редактор: http://127.0.0.1:3001/admin.
Сайт локально всегда в noindex, CMS не должна быть публично доступной.
Остановить dev-серверы — Ctrl+C.

## Оригинальные поля всех 50 записей Webflow

Для полной выгрузки нужен отдельный **read-only WEBFLOW_TOKEN** в
приватной сессии PowerShell, с разрешениями на чтение сайта и коллекций.
Токен не сохраняется в Git. Запустите сначала проверку:

```powershell
.\scripts\local-fullstack.ps1 -Action FullSource -SkipInstall
```

После успешной проверки идентификаторов, схемы, slugs и количества:

```powershell
.\scripts\local-fullstack.ps1 -Action FullSource -SkipInstall -ApplyFull
```

Перед применением создаётся частный отчёт `.migration/reports/court-source-review.json`:
он различает официальные судебные домены и вторичный агрегатор
Sudact. Даже ссылка на домен суда не доказывает наличие и проверку акта.

Сырые поля попадут только в `.migration/webflow` и в закрытую
коллекцию Payload. Копии могут включать персональные данные: не
прикладывать их к PR/Issues/логам и не включать публичные CMS reads.
Импорт не означает юридическое подтверждение судебных актов.

## Браузерная и визуальная приёмка

Установите Chromium:
`corepack pnpm --filter @dgi/web exec playwright install chromium`.

Не запускайте параллельно ручной Next.js dev-server на порту 3000:
конфигурации Playwright поднимают отдельный локальный сервер.

```powershell
.\scripts\local-fullstack.ps1 -Action BrowserQA -SkipInstall
.\scripts\local-fullstack.ps1 -Action VisualQA -SkipInstall
```

BrowserQA проверяет все 33 страницы, 22 архивных судебных URL,
адаптивность, noindex, доступность базовой навигации.
VisualQA снимает **33 пары Webflow/Next.js на desktop и 33 на mobile**.
Это материалы для ручной дизайн-приёмки, а не доказательство полного
визуального совпадения. Права на внешние изображения также не
подтверждаются скриншотами.

## Что остаётся после разработки

Постоянный staging, TLS и изоляция CMS, восстановление резервных копий,
проверка переноса приватных данных, мониторинг и внешняя
производительность; юридическая проверка 37 судебных дел, 4 актов и
остальных материалов; проверка разрешений на изображения; финальная
SEO/дизайн-приёмка и одобренное переключение домена с откатом.
