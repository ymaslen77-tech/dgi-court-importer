# Локальный запуск сайта ДГИ (Windows 11)

Исходники: приватный GitHub-репозиторий
`ymaslen77-tech/dgi-court-importer`, ветка
`feature/nextjs-webflow-migration` (Draft PR №2).

## Первый запуск

Требуются Git, Node.js **22+**, Corepack, интернет для установки
зависимостей, а также GitHub-доступ к приватному репозиторию.

```powershell
git clone --branch feature/nextjs-webflow-migration --single-branch https://github.com/ymaslen77-tech/dgi-court-importer.git
cd dgi-court-importer
powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File .\scripts\start-local.ps1
```

После появления сообщения Next.js `Ready` открывайте
**http://localhost:3000** на этом же компьютере. Оставьте окно PowerShell
открытым. Остановка: **Ctrl+C**.

Альтернатива — двойной щелчок на `scripts/start-local.cmd` в
уже клонированном репозитории.

Для повторного запуска без установки пакетов:

```powershell
.\scripts\start-local.cmd -SkipInstall
```

Для другого порта:

```powershell
.\scripts\start-local.cmd -Port 3002
```

Принудительно выставляются `SITE_CUTOVER=false`,
`CMS_PUBLIC_READS=false`, `COURT_DB_READS=false`. Поэтому открываются
перенесённые статические страницы и тестовый каталог судебных карточек, без
запросов к PostgreSQL и без административной Payload CMS. Публикации в
Webflow, DNS и `main` остаются нетронутыми.

**Важно:** `localhost` относится к компьютеру, на котором запущена
команда. Чат не может запустить сервер на пользовательском компьютере
без доступа к его терминалу. На другом устройстве этот адрес
не откроется.
