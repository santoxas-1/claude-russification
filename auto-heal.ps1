# Claude Desktop Russian Localization Auto-Heal Daemon
# Автоматическая фоновая защита и восстановление русификации при автообновлениях Claude Desktop
# Репозиторий: https://github.com/santoxas-1/claude-russification

[CmdletBinding()]
param (
    [switch]$Once,
    [int]$IntervalSeconds = 30
)

$ErrorActionPreference = "SilentlyContinue"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$DistDir = Join-Path $ScriptDir "dist"
$LogFile = Join-Path $env:LOCALAPPDATA "Claude\claude-autoheal.log"

function Write-AutoHealLog {
    param ([string]$Message, [string]$Level = "INFO")
    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    $line = "[$timestamp] [$Level] $Message"
    try {
        $logDir = Split-Path -Parent $LogFile
        if (-not (Test-Path $logDir)) {
            New-Item -ItemType Directory -Path $logDir -Force | Out-Null
        }
        [System.IO.File]::AppendAllText($LogFile, $line + [Environment]::NewLine, [System.Text.Encoding]::UTF8)
    } catch {}
    if ($Host.Name -ne "ConsoleHost" -or $VerbosePreference -eq "Continue") {
        Write-Host $line
    }
}

function Find-ClaudeIonDirs {
    $candidates = @()
    $stdPaths = @(
        "$env:LOCALAPPDATA\Programs\Claude\resources\ion-dist",
        "$env:PROGRAMFILES\Claude\resources\ion-dist",
        "$env:LOCALAPPDATA\Claude\resources\ion-dist"
    )
    foreach ($p in $stdPaths) {
        if (Test-Path $p) { $candidates += $p }
    }

    # Поиск версионных каталогов Squirrel app-*
    $squirrelDirs = Get-Item "$env:LOCALAPPDATA\Claude\app-*\resources\ion-dist" -ErrorAction SilentlyContinue
    if ($squirrelDirs) {
        foreach ($s in $squirrelDirs) {
            $candidates += $s.FullName
        }
    }

    return ($candidates | Select-Object -Unique)
}

function Check-And-Heal {
    $ionDirs = Find-ClaudeIonDirs
    if (-not $ionDirs -or $ionDirs.Count -eq 0) {
        return $false
    }

    $patchedEn = Join-Path $DistDir "en-US.json"
    $patchedDyn = Join-Path $DistDir "dynamic\en-US.json"
    $scriptSrc = Join-Path $DistDir "i18n-ru.js"
    $patchedNative = Join-Path $DistDir "native-en-US.json"

    if (-not (Test-Path $scriptSrc)) {
        Write-AutoHealLog "Ошибка: Исходные файлы локализации не найдены в $DistDir" "ERROR"
        return $false
    }

    $healedAny = $false
    $Utf8NoBom = [System.Text.UTF8Encoding]::new($false)

    foreach ($ionDir in $ionDirs) {
        $indexHtml = Join-Path $ionDir "index.html"
        $targetScript = Join-Path $ionDir "i18n-ru.js"
        $i18nDir = Join-Path $ionDir "i18n"
        $dynI18nDir = Join-Path $i18nDir "dynamic"
        $targetEn = Join-Path $i18nDir "en-US.json"
        $targetDyn = Join-Path $dynI18nDir "en-US.json"

        $targetNativeDir = Split-Path $ionDir -Parent
        $targetNativeEn = Join-Path $targetNativeDir "en-US.json"

        $needsHeal = $false
        $reasons = @()

        # 1. Проверка index.html на инжекцию i18n-ru.js
        if (Test-Path $indexHtml) {
            $html = [System.IO.File]::ReadAllText($indexHtml, [System.Text.Encoding]::UTF8)
            if ($html -notmatch 'i18n-ru\.js') {
                $needsHeal = $true
                $reasons += "index.html сброшен (отсутствует тег i18n-ru.js)"
            }
        } else {
            continue
        }

        # 2. Проверка наличия i18n-ru.js
        if (-not (Test-Path $targetScript)) {
            $needsHeal = $true
            $reasons += "отсутствует i18n-ru.js"
        } else {
            # Проверка актуальности размера i18n-ru.js
            $srcSize = (Get-Item $scriptSrc).Length
            $targetSize = (Get-Item $targetScript).Length
            if ([Math]::Abs($srcSize - $targetSize) -gt 100) {
                $needsHeal = $true
                $reasons += "i18n-ru.js устарел или перезаписан"
            }
        }

        # 3. Проверка en-US.json
        if (Test-Path $patchedEn) {
            if (-not (Test-Path $targetEn)) {
                $needsHeal = $true
                $reasons += "отсутствует i18n/en-US.json"
            } else {
                $srcEnSize = (Get-Item $patchedEn).Length
                $targetEnSize = (Get-Item $targetEn).Length
                if ($srcEnSize -ne $targetEnSize) {
                    $needsHeal = $true
                    $reasons += "i18n/en-US.json перезаписан оригиналом"
                }
            }
        }

        # 4. Проверка native-en-US.json
        if (Test-Path $patchedNative) {
            if (Test-Path $targetNativeEn) {
                $srcNatSize = (Get-Item $patchedNative).Length
                $targetNatSize = (Get-Item $targetNativeEn).Length
                if ($srcNatSize -ne $targetNatSize) {
                    $needsHeal = $true
                    $reasons += "resources/en-US.json сброшен на оригинал"
                }
            }
        }

        if ($needsHeal) {
            Write-AutoHealLog "Обнаружен сброс русификации в $ionDir: $($reasons -join ', ')" "WARN"

            # Копирование i18n-ru.js
            Copy-Item $scriptSrc $targetScript -Force

            # Копирование en-US.json
            if (Test-Path $patchedEn) {
                if (-not (Test-Path $i18nDir)) { New-Item -ItemType Directory -Path $i18nDir -Force | Out-Null }
                Copy-Item $patchedEn $targetEn -Force
            }

            # Копирование dynamic/en-US.json
            if (Test-Path $patchedDyn) {
                if (-not (Test-Path $dynI18nDir)) { New-Item -ItemType Directory -Path $dynI18nDir -Force | Out-Null }
                Copy-Item $patchedDyn $targetDyn -Force
            }

            # Копирование native-en-US.json
            if (Test-Path $patchedNative) {
                Copy-Item $patchedNative $targetNativeEn -Force
            }

            # Внедрение скрипта в index.html
            $html = [System.IO.File]::ReadAllText($indexHtml, [System.Text.Encoding]::UTF8)
            if ($html -notmatch 'i18n-ru\.js') {
                $html = $html.Replace('<head>', '<head><script src="/i18n-ru.js"></script>')
                [System.IO.File]::WriteAllText($indexHtml, $html, $Utf8NoBom)
            }

            Write-AutoHealLog "✅ Русификация успешно восстановлена в $ionDir!" "SUCCESS"
            $healedAny = $true
        }
    }

    return $healedAny
}

# --- Точка входа ---
Write-AutoHealLog "Служба Auto-Heal запущена (Режим: $(if ($Once) { 'Однократный' } else { 'Фоновый демон' }))" "INFO"

if ($Once) {
    Check-And-Heal | Out-Null
    exit 0
}

# Бесконечный цикл с минимальной нагрузкой на CPU (раз в $IntervalSeconds)
while ($true) {
    try {
        Check-And-Heal | Out-Null
    } catch {
        Write-AutoHealLog "Исключение при проверке: $($_.Exception.Message)" "ERROR"
    }
    Start-Sleep -Seconds $IntervalSeconds
}
