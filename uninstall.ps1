# Claude Desktop Russian Localization Uninstaller for Windows
# Run with: powershell -ExecutionPolicy Bypass -File .\uninstall.ps1

$ErrorActionPreference = "Stop"

Write-Host "=== Удаление русификатора Claude Desktop для Windows ===" -ForegroundColor Cyan

# Поиск пути
$CandidatePaths = @(
    "$env:LOCALAPPDATA\Programs\Claude\resources\ion-dist",
    "$env:PROGRAMFILES\Claude\resources\ion-dist",
    "$env:LOCALAPPDATA\Claude\resources\ion-dist"
)

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
    Write-Host "❌ Папка ion-dist не найдена." -ForegroundColor Red
    Exit 1
}

$I18nDir = Join-Path $IonDir "i18n"
$DynI18nDir = Join-Path $I18nDir "dynamic"
$IndexHtml = Join-Path $IonDir "index.html"

$BackupHtml = Join-Path $IonDir "index.html.original"
$BackupEn = Join-Path $I18nDir "en-US.json.original"
$BackupDyn = Join-Path $DynI18nDir "en-US.json.original"
$TargetScript = Join-Path $IonDir "i18n-ru.js"

$ClaudeProc = Get-Process -Name "Claude" -ErrorAction SilentlyContinue
if ($ClaudeProc) {
    Stop-Process -Name "Claude" -Force
    Start-Sleep -Seconds 1
}

# Восстановление каталогов
if (Test-Path $BackupEn) {
    Write-Host "📦 Восстановление оригинального en-US.json..."
    Copy-Item $BackupEn (Join-Path $I18nDir "en-US.json") -Force
    Remove-Item $BackupEn -Force
}

if (Test-Path $BackupDyn) {
    Write-Host "📦 Восстановление оригинального dynamic/en-US.json..."
    Copy-Item $BackupDyn (Join-Path $DynI18nDir "en-US.json") -Force
    Remove-Item $BackupDyn -Force
}

# Восстановление index.html
if (Test-Path $BackupHtml) {
    Write-Host "📦 Восстановление оригинального index.html..."
    Copy-Item $BackupHtml $IndexHtml -Force
    Remove-Item $BackupHtml -Force
} else {
    $HtmlContent = [System.IO.File]::ReadAllText($IndexHtml, [System.Text.Encoding]::UTF8)
    $HtmlContent = $HtmlContent.Replace('<script src="/i18n-ru.js"></script>', '')
    [System.IO.File]::WriteAllText($IndexHtml, $HtmlContent, [System.Text.Encoding]::UTF8)
}

# Удаление скрипта
if (Test-Path $TargetScript) {
    Write-Host "🗑️ Удаление i18n-ru.js..."
    Remove-Item $TargetScript -Force
}

Write-Host "✅ Русификатор успешно удален. Приложение возвращено в исходное состояние." -ForegroundColor Green
