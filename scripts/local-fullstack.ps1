# Windows 11, PowerShell 7: local-only website, CMS and two PostgreSQL databases.
# Keep .env and all Webflow source exports private. Never deploy from this script.
[CmdletBinding()]
param(
  [ValidateSet("Check","Setup","Bootstrap","Import","FullSource","Web","Cms","BrowserQA","VisualQA")]
  [string]$Action="Check",
  [switch]$ApplyFull,
  [switch]$SkipInstall
)
$ErrorActionPreference="Stop"
$root=(Resolve-Path (Join-Path $PSScriptRoot "..")).Path
function Assert-Exit([string]$Name) {
  if($LASTEXITCODE -ne 0) { throw "$Name exited with code $LASTEXITCODE" }
}
function Pnpm([string[]]$Commands) {
  & corepack pnpm @Commands
  Assert-Exit "pnpm"
}
function Compose([string[]]$Commands) {
  & docker compose -f "docker-compose.yml" -f "docker-compose.cms.yml" @Commands
  Assert-Exit "docker compose"
}
if(-not (Get-Command node -ErrorAction SilentlyContinue) -or
   -not (Get-Command corepack -ErrorAction SilentlyContinue)) {
  throw "Install Node.js 22+ and Corepack first."
}
if((& node --version) -notmatch '^v(2[2-9]|[3-9][0-9])\.') {
  throw "Node.js 22+ required."
}
$requiresDb=$Action -in @("Setup","Bootstrap","Import","FullSource","Cms")
if($requiresDb) {
  $private=Join-Path $root ".env"
  if(-not (Test-Path $private)) { throw "Copy .env.example to .env and set private secrets." }
  foreach($line in (Get-Content $private -Encoding utf8)) {
    if($line -match '^\s*(#|$)') { continue }
    if($line -notmatch '^\s*([A-Z_][A-Z_0-9]*)=(.*)$') { throw "Invalid .env format." }
    $key=$Matches[1]; $value=$Matches[2].Trim()
    [Environment]::SetEnvironmentVariable($key,$value,"Process")
  }
  foreach($key in @("POSTGRES_PASSWORD","CMS_POSTGRES_PASSWORD","PAYLOAD_SECRET")) {
    $value=[Environment]::GetEnvironmentVariable($key,"Process")
    $minimum=if($key -eq "PAYLOAD_SECRET") {32} else {20}
    if(!$value -or $value.Length -lt $minimum -or $value -match '^(replace|change|example|test)') {
      throw "Set a unique secure value for $key in private .env."
    }
  }
  if($env:POSTGRES_PASSWORD -eq $env:CMS_POSTGRES_PASSWORD) {
    throw "CMS and site database passwords must differ."
  }
  $sitePass=[uri]::EscapeDataString($env:POSTGRES_PASSWORD)
  $cmsPass=[uri]::EscapeDataString($env:CMS_POSTGRES_PASSWORD)
  $env:DATABASE_URL="postgresql://housing:$sitePass@127.0.0.1:5434/housing"
  $env:CMS_DATABASE_URL="postgresql://housing_cms:$cmsPass@127.0.0.1:5435/housing_cms"
}
# Fail-closed in every local action.
$env:SITE_CUTOVER="false"
$env:SITE_RELEASE_APPROVED="no"
$env:CMS_PUBLIC_READS="false"
$env:COURT_DB_READS="false"
$env:NEXT_TELEMETRY_DISABLED="1"
Push-Location $root
try {
  if(-not $SkipInstall -and $Action -notin @("Web","Cms","BrowserQA","VisualQA")) {
    Pnpm @("install","--frozen-lockfile")
  }
  switch($Action) {
    "Check" {
      Pnpm @("test")
      Pnpm @("--filter","@dgi/cms","test")
      Pnpm @("typecheck")
      Pnpm @("--filter","@dgi/cms","typecheck")
      Pnpm @("build")
      Pnpm @("release:audit")
      & node scripts/local-acceptance.mjs
      Assert-Exit "Local QA register"
    }
    "Setup" {
      if(-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        throw "Docker Desktop and Docker Compose v2 required for database setup."
      }
      Compose @("up","-d","database","cms_database")
      $sql="SELECT count(*) FROM information_schema.tables WHERE table_schema='public'"
      $count=(& docker compose -f docker-compose.yml -f docker-compose.cms.yml exec -T database psql -X -At -U housing -d housing -c $sql).Trim()
      Assert-Exit "Inspect website schema"
      if($count -eq "0") {
        foreach($file in (Get-ChildItem "db/migrations/000*.sql" | Sort-Object Name)) {
          Get-Content $file.FullName -Raw -Encoding utf8 |
            & docker compose -f docker-compose.yml -f docker-compose.cms.yml exec -T database psql -X -v ON_ERROR_STOP=1 -U housing -d housing
          Assert-Exit "Apply $($file.Name)"
        }
      } else {
        if($count -notmatch '^\d+$') { throw "Unexpected database state." }
        $check=(& docker compose -f docker-compose.yml -f docker-compose.cms.yml exec -T database psql -X -At -U housing -d housing -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('editorial_pages','court_cases','webflow_cms_staging')").Trim()
        Assert-Exit "Verify website schema"
        if($check -ne "3") { throw "Existing website schema is incomplete. Refusing overwrite." }
      }
      Write-Host "Both isolated local databases ready."
    }
    "Bootstrap" {
      if(!$env:CMS_BOOTSTRAP_EMAIL -or !$env:CMS_BOOTSTRAP_PASSWORD) {
        throw "Configure CMS_BOOTSTRAP_EMAIL and CMS_BOOTSTRAP_PASSWORD in private .env."
      }
      $env:CMS_BOOTSTRAP_CONFIRM="yes"
      try { Pnpm @("--filter","@dgi/cms","bootstrap:admin") }
      finally { Remove-Item Env:CMS_BOOTSTRAP_CONFIRM -ErrorAction SilentlyContinue }
    }
    "Import" {
      Pnpm @("migration:dry-run")
      Pnpm @("migration:cms:dry-run")
      Pnpm @("migration:apply")
      Pnpm @("migration:cms:apply")
      Pnpm @("--filter","@dgi/cms","import:webflow:dry-run")
      Pnpm @("--filter","@dgi/cms","import:cms-metadata:dry-run")
      $env:CMS_PRIVATE_IMPORT="yes"; $env:CMS_IMPORT_CONFIRM="yes"
      try {
        Pnpm @("--filter","@dgi/cms","import:webflow:apply")
        Pnpm @("--filter","@dgi/cms","import:cms-metadata:apply")
      } finally {
        Remove-Item Env:CMS_PRIVATE_IMPORT -ErrorAction SilentlyContinue
        Remove-Item Env:CMS_IMPORT_CONFIRM -ErrorAction SilentlyContinue
      }
    }
    "FullSource" {
      if(!$env:WEBFLOW_TOKEN) { throw "Supply a private read-only WEBFLOW_TOKEN in your local session." }
      & node scripts/export-webflow.mjs
      Assert-Exit "Webflow export"
      & node scripts/audit-webflow-exports.mjs
      Assert-Exit "Court source audit"
      Pnpm @("--filter","@dgi/cms","import:cms-private:dry-run")
      if($ApplyFull) {
        $env:CMS_PRIVATE_IMPORT="yes"; $env:CMS_IMPORT_CONFIRM="yes"
        $env:CMS_FULL_CONTENT_CONFIRM="yes"; $env:CMS_CONTENT_IMPORT_TARGET="staging"
        try { Pnpm @("--filter","@dgi/cms","import:cms-private:apply") }
        finally {
          foreach($key in @("CMS_PRIVATE_IMPORT","CMS_IMPORT_CONFIRM","CMS_FULL_CONTENT_CONFIRM","CMS_CONTENT_IMPORT_TARGET")) {
            Remove-Item ("Env:"+$key) -ErrorAction SilentlyContinue
          }
        }
      }
    }
    "Web" { Pnpm @("--filter","@dgi/web","dev","--hostname","127.0.0.1","--port","3000") }
    "Cms" { Pnpm @("--filter","@dgi/cms","dev","--hostname","127.0.0.1") }
    "BrowserQA" { Pnpm @("--filter","@dgi/web","exec","playwright","test") }
    "VisualQA" { Pnpm @("--filter","@dgi/web","exec","playwright","test","--config","playwright.visual.config.ts") }
  }
} finally { Pop-Location }
