# Launch the DGI Next.js public site on the Windows PC (preview only).
# Run from the repository root: powershell -NoProfile -File .\scripts\start-local.ps1
param(
  [ValidateRange(1024, 65535)]
  [int]$Port = 3000,
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js 22 or later is required. Install Node.js LTS first."
}
$version = (& node --version).Trim()
if ($version -notmatch '^v(\d+)\.' -or [int]$Matches[1] -lt 22) {
  throw "Node.js 22 or later required; found $version."
}
if (-not (Get-Command corepack -ErrorAction SilentlyContinue)) {
  throw "Corepack is missing. Install/enable Corepack to use pnpm 10."
}
if (-not (Test-Path (Join-Path $root "apps\web\package.json"))) {
  throw "Not inside the dgi-court-importer repository."
}

# Force preview mode regardless of any preexisting process-level flags.
$env:SITE_CUTOVER = "false"
$env:CMS_PUBLIC_READS = "false"
$env:COURT_DB_READS = "false"
$env:NEXT_TELEMETRY_DISABLED = "1"

Push-Location $root
try {
  if (-not $SkipInstall) {
    Write-Host "Installing repository dependencies (pnpm 10)..." -ForegroundColor Cyan
    & corepack pnpm install --frozen-lockfile
    if ($LASTEXITCODE -ne 0) { throw "Dependency installation failed ($LASTEXITCODE)" }
  }

  Write-Host ""
  Write-Host "DGI site preview: http://localhost:$Port" -ForegroundColor Green
  Write-Host "Staging/noindex enabled. This runs on this PC only." -ForegroundColor DarkGray
  Write-Host "Stop with Ctrl+C."
  Write-Host ""
  & corepack pnpm --filter "@dgi/web" dev --hostname 127.0.0.1 --port $Port
  if ($LASTEXITCODE -ne 0) { throw "Next.js exited with status $LASTEXITCODE" }
}
finally { Pop-Location }
