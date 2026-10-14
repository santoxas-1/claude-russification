# Claude Desktop Russian Localization Installer for Windows
# Run with: powershell -ExecutionPolicy Bypass -File .\install.ps1

$ErrorActionPreference = "Stop"

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "   Русификатор Claude Desktop для Windows              " -ForegroundColor Cyan
Write-Host "   https://github.com/teroguy/claude-russification        " -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan

# 1. Поиск пути установки Claude
$CandidatePaths = @(
    "$env:LOCALAPPDATA\Programs\Claude\resources\ion-dist",
    "$env:PROGRAMFILES\Claude\resources\ion-dist",
    "$env:LOCALAPPDATA\Claude\resources\ion-dist"
)

# Проверяем также версионные папки Squirrel app-*
$SquirrelPath = Get-Item "$env:LOCALAPPDATA\Claude\app-*\resources\ion-dist" -ErrorAction SilentlyContinue | Select-Object -Last 1
if ($SquirrelPath) {
    $CandidatePaths += $SquirrelPath.FullName
}

$IonDir = $null
foreach ($path in $CandidatePaths) {
    if (Test-Path $path) {
        $IonDir = $path
        break
    }
}

if (-not $IonDir) {
    Write-Host "❌ Ошибка: Папка ion-dist Claude Desktop не найдена." -ForegroundColor Red
    Write-Host "Проверьте, установлено ли приложение Claude Desktop."
    Exit 1
}

Write-Host "📁 Найдена папка Claude: $IonDir" -ForegroundColor Green

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$DistDir = Join-Path $ScriptDir "dist"

$I18nDir = Join-Path $IonDir "i18n"
$DynI18nDir = Join-Path $I18nDir "dynamic"
$IndexHtml = Join-Path $IonDir "index.html"

$BackupHtml = Join-Path $IonDir "index.html.original"
$BackupEn = Join-Path $I18nDir "en-US.json.original"
$BackupDyn = Join-Path $DynI18nDir "en-US.json.original"

$PatchedEn = Join-Path $DistDir "en-US.json"
$PatchedDyn = Join-Path $DistDir "dynamic\en-US.json"
$ScriptSrc = Join-Path $DistDir "i18n-ru.js"

# 2. Остановка Claude
$ClaudeProc = Get-Process -Name "Claude" -ErrorAction SilentlyContinue
if ($ClaudeProc) {
    Write-Host "⏳ Завершаем процесс Claude..." -ForegroundColor Yellow
    Stop-Process -Name "Claude" -Force
    Start-Sleep -Seconds 1
}

# 3. Резервное копирование
if (-not (Test-Path $BackupHtml)) {
    Write-Host "📦 Резервная копия index.html..."
    Copy-Item $IndexHtml $BackupHtml
}

if (-not (Test-Path $BackupEn)) {
    Write-Host "📦 Резервная копия en-US.json..."
    Copy-Item (Join-Path $I18nDir "en-US.json") $BackupEn
}

if ((Test-Path (Join-Path $DynI18nDir "en-US.json")) -and -not (Test-Path $BackupDyn)) {
    Write-Host "📦 Резервная копия dynamic/en-US.json..."
    Copy-Item (Join-Path $DynI18nDir "en-US.json") $BackupDyn
}

# 4. Установка файлов локализации
Write-Host "📋 Копирование файлов локализации..." -ForegroundColor Yellow
Copy-Item $PatchedEn (Join-Path $I18nDir "en-US.json") -Force

if (Test-Path $PatchedDyn) {
    if (-not (Test-Path $DynI18nDir)) { New-Item -ItemType Directory -Path $DynI18nDir -Force | Out-Null }
    Copy-Item $PatchedDyn (Join-Path $DynI18nDir "en-US.json") -Force
}

Copy-Item $ScriptSrc (Join-Path $IonDir "i18n-ru.js") -Force

# 5. Внедрение скрипта в index.html
$HtmlContent = [System.IO.File]::ReadAllText($IndexHtml, [System.Text.Encoding]::UTF8)
if ($HtmlContent -notmatch "i18n-ru.js") {
    Write-Host "💉 Внедрение скрипта в index.html..." -ForegroundColor Yellow
    $HtmlContent = $HtmlContent.Replace("<head>", "<head><script src=""/i18n-ru.js""></script>")
    [System.IO.File]::WriteAllText($IndexHtml, $HtmlContent, [System.Text.Encoding]::UTF8)
}

# 6. Очистка браузерного кэша
$CacheDir = "$env:APPDATA\Claude\Cache"
$CodeCacheDir = "$env:APPDATA\Claude\Code Cache"
$GPUCacheDir = "$env:APPDATA\Claude\GPUCache"

if (Test-Path $CacheDir) {
    Write-Host "🧹 Очистка кэша Chromium..." -ForegroundColor Yellow
    Remove-Item "$CacheDir\*" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path $CodeCacheDir) {
    Remove-Item "$CodeCacheDir\*" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path $GPUCacheDir) {
    Remove-Item "$GPUCacheDir\*" -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "🎉 Готово! Русификатор успешно установлен на Windows." -ForegroundColor Green
Write-Host "Запустите Claude Desktop из меню Пуск." -ForegroundColor Green
