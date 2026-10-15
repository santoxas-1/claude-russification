# Claude Desktop Russian Localization Uninstaller for Windows
# Run with: powershell -ExecutionPolicy Bypass -File .\uninstall.ps1

[CmdletBinding()]
param (
    [switch]$KeepShortcuts
)

$ErrorActionPreference = "Stop"

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "   Удаление русификатора Claude Desktop (Windows)       " -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

# -------------------------------------------------------------
# Функция безопасного завершения процессов Claude Desktop
# -------------------------------------------------------------
function Stop-ClaudeDesktopProcesses {
    $allClaude = Get-Process -Name "claude", "Claude" -ErrorAction SilentlyContinue
    if (-not $allClaude) { return }

    $desktopProcesses = @()
    foreach ($proc in $allClaude) {
        $path = ""
        try {
            $path = $proc.MainModule.FileName
        } catch {
            try {
                $wmi = Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.Id)" -ErrorAction SilentlyContinue
                $path = $wmi.ExecutablePath
            } catch {}
        }

        # КРИТИЧЕСКИЙ ФИЛЬТР: Пропускаем CLI / субпроцессы Claude Code
        $isCli = ($path -match "(?i)[\\/]claude-code([\\/]|$)") -or
                 ($path -match "(?i)[\\/]Claude-3p[\\/]claude-code") -or
                 ($path -match "(?i)[\\/]node_modules[\\/]") -or
                 ($path -match "(?i)[\\/]\.claude[\\/]") -or
                 ($path -match "(?i)[\\/]npm[\\/]")

        if ($isCli) {
            continue
        }

        $isDesktop = ($path -match "(?i)[\\/]Programs[\\/]Claude[\\/]") -or
                     ($path -match "(?i)[\\/]WindowsApps[\\/]Claude") -or
                     ($path -match "(?i)[\\/]Claude[\\/]app-") -or
                     ($proc.MainWindowTitle -match "Claude")

        if ($isDesktop -or [string]::IsNullOrWhiteSpace($path)) {
            $desktopProcesses += $proc
        }
    }

    if ($desktopProcesses.Count -gt 0) {
        Write-Host "⏳ Завершаем процесс Claude Desktop ($($desktopProcesses.Count) процессов)..." -ForegroundColor Yellow
        foreach ($p in $desktopProcesses) {
            try {
                if ($p.MainWindowHandle -ne [IntPtr]::Zero) {
                    $p.CloseMainWindow() | Out-Null
                }
            } catch {}
        }
        Start-Sleep -Milliseconds 600

        foreach ($p in $desktopProcesses) {
            try {
                if (-not $p.HasExited) {
                    Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
                }
            } catch {}
        }
        Start-Sleep -Seconds 1
    }
}

# -------------------------------------------------------------
# 1. Поиск пути установки Claude
# -------------------------------------------------------------
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
    Write-Host "❌ Папка ion-dist Claude Desktop не найдена." -ForegroundColor Red
    Exit 1
}

Write-Host "📁 Найдена папка Claude: $IonDir" -ForegroundColor Green

$I18nDir = Join-Path $IonDir "i18n"
$DynI18nDir = Join-Path $I18nDir "dynamic"
$IndexHtml = Join-Path $IonDir "index.html"

$BackupHtml = Join-Path $IonDir "index.html.original"
$BackupEn = Join-Path $I18nDir "en-US.json.original"
$BackupDyn = Join-Path $DynI18nDir "en-US.json.original"
$TargetScript = Join-Path $IonDir "i18n-ru.js"

# -------------------------------------------------------------
# 2. Остановка Claude Desktop
# -------------------------------------------------------------
Stop-ClaudeDesktopProcesses

# -------------------------------------------------------------
# 3. Восстановление оригинальных каталогов
# -------------------------------------------------------------
if (Test-Path $BackupEn) {
    Write-Host "📦 Восстановление оригинального en-US.json..." -ForegroundColor Yellow
    Copy-Item $BackupEn (Join-Path $I18nDir "en-US.json") -Force
    Remove-Item $BackupEn -Force
}

if (Test-Path $BackupDyn) {
    Write-Host "📦 Восстановление оригинального dynamic/en-US.json..." -ForegroundColor Yellow
    Copy-Item $BackupDyn (Join-Path $DynI18nDir "en-US.json") -Force
    Remove-Item $BackupDyn -Force
}

$TargetNativeDir = Split-Path $IonDir -Parent
$TargetNativeEn = Join-Path $TargetNativeDir "en-US.json"
$BackupNativeEn = Join-Path $TargetNativeDir "en-US.json.original"
if (Test-Path $BackupNativeEn) {
    Write-Host "📦 Восстановление оригинального resources/en-US.json..." -ForegroundColor Yellow
    Copy-Item $BackupNativeEn $TargetNativeEn -Force
    Remove-Item $BackupNativeEn -Force
}

# -------------------------------------------------------------
# 4. Восстановление index.html
# -------------------------------------------------------------
$Utf8NoBom = [System.Text.UTF8Encoding]::new($false)

if (Test-Path $BackupHtml) {
    Write-Host "📦 Восстановление оригинального index.html..." -ForegroundColor Yellow
    Copy-Item $BackupHtml $IndexHtml -Force
    Remove-Item $BackupHtml -Force
} elseif (Test-Path $IndexHtml) {
    Write-Host "🧹 Очистка тега скрипта из index.html..." -ForegroundColor Yellow
    $HtmlContent = [System.IO.File]::ReadAllText($IndexHtml, [System.Text.Encoding]::UTF8)
    $HtmlContent = $HtmlContent.Replace('<script src="/i18n-ru.js"></script>', '')
    [System.IO.File]::WriteAllText($IndexHtml, $HtmlContent, $Utf8NoBom)
}

# -------------------------------------------------------------
# 5. Удаление внедренного скрипта
# -------------------------------------------------------------
if (Test-Path $TargetScript) {
    Write-Host "🗑️ Удаление i18n-ru.js..." -ForegroundColor Yellow
    Remove-Item $TargetScript -Force
}

# -------------------------------------------------------------
# 6. Удаление созданных ярлыков (если были)
# -------------------------------------------------------------
if (-not $KeepShortcuts) {
    $DesktopShortcut = Join-Path ([Environment]::GetFolderPath("Desktop")) "Claude (Русский).lnk"
    if (Test-Path $DesktopShortcut) {
        Write-Host "🗑️ Удаление ярлыка с Рабочего стола..." -ForegroundColor Yellow
        Remove-Item $DesktopShortcut -Force -ErrorAction SilentlyContinue
    }

    $StartMenuPrograms = [Environment]::GetFolderPath("Programs")
    if (Test-Path $StartMenuPrograms) {
        $StartShortcut = Join-Path $StartMenuPrograms "Claude (Русский).lnk"
        if (Test-Path $StartShortcut) {
            Write-Host "🗑️ Удаление ярлыка из меню Пуск..." -ForegroundColor Yellow
            Remove-Item $StartShortcut -Force -ErrorAction SilentlyContinue
        }
    }
}

# -------------------------------------------------------------
# 7. Очистка кэша Chromium
# -------------------------------------------------------------
$CacheLocations = @(
    "$env:APPDATA\Claude",
    "$env:LOCALAPPDATA\Claude",
    "$env:LOCALAPPDATA\Claude-3p"
)

Write-Host "🧹 Очистка кэша приложения..." -ForegroundColor Yellow
foreach ($baseCache in $CacheLocations) {
    if (Test-Path $baseCache) {
        foreach ($sub in @("Cache", "Code Cache", "GPUCache")) {
            $dir = Join-Path $baseCache $sub
            if (Test-Path $dir) {
                Remove-Item "$dir\*" -Recurse -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

Write-Host ""
Write-Host "✅ Русификатор успешно удален. Claude Desktop возвращен к заводскому состоянию." -ForegroundColor Green
