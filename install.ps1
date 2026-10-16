# Claude Desktop Russian Localization Installer for Windows
# Run with: powershell -ExecutionPolicy Bypass -File .\install.ps1

[CmdletBinding()]
param (
    [switch]$Force,
    [switch]$NoShortcut
)

$ErrorActionPreference = "Stop"

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "   Русификатор Claude Desktop для Windows              " -ForegroundColor Cyan
Write-Host "   https://github.com/santoxas-1/claude-russification   " -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

# -------------------------------------------------------------
# Функция безопасного завершения процессов Claude Desktop
# ВАЖНО: не завершает фоновые процессы Claude Code CLI / Agent SDK!
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

        # Идентифицируем десктопное Electron-приложение
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
        # Сначала мягкая попытка закрыть главное окно
        foreach ($p in $desktopProcesses) {
            try {
                if ($p.MainWindowHandle -ne [IntPtr]::Zero) {
                    $p.CloseMainWindow() | Out-Null
                }
            } catch {}
        }
        Start-Sleep -Milliseconds 600

        # Принудительное завершение только оставшихся Desktop процессов
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
# 1. Поиск установки Claude Desktop
# -------------------------------------------------------------
$StandardCandidates = @(
    "$env:LOCALAPPDATA\Programs\Claude\resources\ion-dist",
    "$env:PROGRAMFILES\Claude\resources\ion-dist",
    "$env:LOCALAPPDATA\Claude\resources\ion-dist"
)

# Проверяем также версионные папки Squirrel (app-*)
$SquirrelPath = Get-Item "$env:LOCALAPPDATA\Claude\app-*\resources\ion-dist" -ErrorAction SilentlyContinue | Select-Object -Last 1
if ($SquirrelPath) {
    $StandardCandidates += $SquirrelPath.FullName
}

$IonDir = $null
foreach ($path in $StandardCandidates) {
    if (Test-Path $path) {
        $IonDir = $path
        break
    }
}

$CreatedFromWindowsApps = $false
$TargetClaudeDir = "$env:LOCALAPPDATA\Programs\Claude"

# Если в стандартных путях не найдено, ищем установку WindowsApps (MSIX/Store)
if (-not $IonDir) {
    Write-Host "🔍 Проверка установки через WindowsApps (MSIX / Microsoft Store)..." -ForegroundColor Cyan
    $AppxPackage = Get-AppxPackage -Name "*Claude*" -ErrorAction SilentlyContinue | Select-Object -First 1

    $AppxSourceDir = $null
    if ($AppxPackage -and (Test-Path $AppxPackage.InstallLocation)) {
        $CandidateAppxApp = Join-Path $AppxPackage.InstallLocation "app"
        if (Test-Path (Join-Path $CandidateAppxApp "resources\ion-dist")) {
            $AppxSourceDir = $CandidateAppxApp
        } elseif (Test-Path (Join-Path $AppxPackage.InstallLocation "resources\ion-dist")) {
            $AppxSourceDir = $AppxPackage.InstallLocation
        }
    }

    # Если Get-AppxPackage ничего не вернул, сканируем Program Files\WindowsApps вручную
    if (-not $AppxSourceDir) {
        $WindowsAppsDir = "$env:ProgramFiles\WindowsApps"
        $FoundFolder = Get-ChildItem -Path $WindowsAppsDir -Filter "Claude_*" -Directory -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($FoundFolder) {
            $CandidateAppxApp = Join-Path $FoundFolder.FullName "app"
            if (Test-Path (Join-Path $CandidateAppxApp "resources\ion-dist")) {
                $AppxSourceDir = $CandidateAppxApp
            }
        }
    }

    if ($AppxSourceDir) {
        Write-Host "ℹ️ Обнаружена установка Claude Desktop в WindowsApps:" -ForegroundColor Cyan
        Write-Host "   $AppxSourceDir" -ForegroundColor Gray
        Write-Host ""
        Write-Host "⚠️ Внимание: Пакеты WindowsApps защищены цифровой подписью Windows (MSIX)." -ForegroundColor Yellow
        Write-Host "   Прямая модификация файлов в WindowsApps нарушает цифровую подпись и ломает запуск." -ForegroundColor Yellow
        Write-Host "🚀 Создаем независимую автономную (standalone) копию приложения в:" -ForegroundColor Green
        Write-Host "   $TargetClaudeDir" -ForegroundColor Green
        Write-Host ""

        Stop-ClaudeDesktopProcesses

        if (-not (Test-Path $TargetClaudeDir)) {
            New-Item -ItemType Directory -Path $TargetClaudeDir -Force | Out-Null
        }

        Write-Host "📦 Копирование файлов Claude Desktop из WindowsApps (это займет несколько секунд)..." -ForegroundColor Yellow
        Copy-Item -Path "$AppxSourceDir\*" -Destination $TargetClaudeDir -Recurse -Force

        $IonDir = Join-Path $TargetClaudeDir "resources\ion-dist"
        if (Test-Path $IonDir) {
            $CreatedFromWindowsApps = $true
            Write-Host "✅ Автономная копия успешно создана." -ForegroundColor Green
        } else {
            Write-Host "❌ Ошибка при создании рабочей копии Claude Desktop." -ForegroundColor Red
            Exit 1
        }
    }
}

if (-not $IonDir) {
    Write-Host "❌ Ошибка: Ресурсы Claude Desktop (ion-dist) не найдены." -ForegroundColor Red
    Write-Host "Проверены следующие пути:"
    foreach ($p in $StandardCandidates) { Write-Host " - $p" -ForegroundColor Gray }
    Write-Host " - WindowsApps (пакеты MSIX/Store)" -ForegroundColor Gray
    Write-Host "Убедитесь, что приложение Claude Desktop установлено."
    Exit 1
}

Write-Host "📁 Найдена папка Claude: $IonDir" -ForegroundColor Green

# -------------------------------------------------------------
# 2. Проверка прав на запись в целевую директорию
# -------------------------------------------------------------
$TestFile = Join-Path $IonDir ".write_test_$([Guid]::NewGuid().ToString('N'))"
try {
    [System.IO.File]::WriteAllText($TestFile, "test")
    Remove-Item $TestFile -Force -ErrorAction SilentlyContinue
} catch {
    Write-Host "❌ Ошибка: Нет прав на запись в папку $IonDir" -ForegroundColor Red
    Write-Host "Пожалуйста, запустите PowerShell от имени Администратора (Run as Administrator)." -ForegroundColor Yellow
    Exit 1
}

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

if (-not (Test-Path $PatchedEn) -or -not (Test-Path $ScriptSrc)) {
    Write-Host "❌ Ошибка: Файлы локализации не найдены в каталоге dist ($DistDir)." -ForegroundColor Red
    Exit 1
}

# -------------------------------------------------------------
# 3. Безопасная остановка Claude Desktop
# -------------------------------------------------------------
Stop-ClaudeDesktopProcesses

# -------------------------------------------------------------
# 4. Резервное копирование оригиналов (только если еще не модифицированы)
# -------------------------------------------------------------
$Utf8NoBom = [System.Text.UTF8Encoding]::new($false)

if (Test-Path $IndexHtml) {
    $CurrentHtml = [System.IO.File]::ReadAllText($IndexHtml, [System.Text.Encoding]::UTF8)
    if (-not (Test-Path $BackupHtml)) {
        if ($CurrentHtml -notmatch "i18n-ru\.js") {
            Write-Host "📦 Создание резервной копии index.html..."
            Copy-Item $IndexHtml $BackupHtml
        }
    }
}

$OriginalEnFile = Join-Path $I18nDir "en-US.json"
if ((Test-Path $OriginalEnFile) -and (-not (Test-Path $BackupEn))) {
    Write-Host "📦 Создание резервной копии en-US.json..."
    Copy-Item $OriginalEnFile $BackupEn
}

$OriginalDynFile = Join-Path $DynI18nDir "en-US.json"
if ((Test-Path $OriginalDynFile) -and (-not (Test-Path $BackupDyn))) {
    Write-Host "📦 Создание резервной копии dynamic/en-US.json..."
    Copy-Item $OriginalDynFile $BackupDyn
}

# -------------------------------------------------------------
# 5. Установка файлов локализации
# -------------------------------------------------------------
Write-Host "📋 Установка файлов локализации..." -ForegroundColor Yellow

if (-not (Test-Path $I18nDir)) { New-Item -ItemType Directory -Path $I18nDir -Force | Out-Null }
Copy-Item $PatchedEn $OriginalEnFile -Force

if (Test-Path $PatchedDyn) {
    if (-not (Test-Path $DynI18nDir)) { New-Item -ItemType Directory -Path $DynI18nDir -Force | Out-Null }
    Copy-Item $PatchedDyn $OriginalDynFile -Force
}

Copy-Item $ScriptSrc (Join-Path $IonDir "i18n-ru.js") -Force

# Установка нативного перевода системных меню (Electron resources/en-US.json)
$PatchedNative = Join-Path $DistDir "native-en-US.json"
$TargetNativeDir = Split-Path $IonDir -Parent
$TargetNativeEn = Join-Path $TargetNativeDir "en-US.json"
$BackupNativeEn = Join-Path $TargetNativeDir "en-US.json.original"

if (Test-Path $PatchedNative) {
    if ((Test-Path $TargetNativeEn) -and (-not (Test-Path $BackupNativeEn))) {
        Copy-Item $TargetNativeEn $BackupNativeEn -Force
    }
    Copy-Item $PatchedNative $TargetNativeEn -Force
    Write-Host "📋 Установлен нативный перевод системных меню (resources/en-US.json)..." -ForegroundColor Yellow
}

# -------------------------------------------------------------
# 6. Внедрение скрипта i18n-ru.js в index.html
# -------------------------------------------------------------
$HtmlContent = [System.IO.File]::ReadAllText($IndexHtml, [System.Text.Encoding]::UTF8)
if ($HtmlContent -notmatch "i18n-ru\.js") {
    Write-Host "💉 Внедрение скрипта в index.html..." -ForegroundColor Yellow
    $HtmlContent = $HtmlContent.Replace("<head>", "<head><script src=""/i18n-ru.js""></script>")
    [System.IO.File]::WriteAllText($IndexHtml, $HtmlContent, $Utf8NoBom)
} else {
    Write-Host "ℹ️ Скрипт i18n-ru.js уже подключен в index.html." -ForegroundColor Gray
}

# -------------------------------------------------------------
# 7. Создание ярлыков (Рабочий стол и меню Пуск)
# -------------------------------------------------------------
$ClaudeExePath = $null
$PossibleExeLocations = @(
    (Join-Path (Split-Path (Split-Path $IonDir -Parent) -Parent) "claude.exe"),
    (Join-Path (Split-Path $IonDir -Parent) "claude.exe"),
    "$TargetClaudeDir\claude.exe"
)

foreach ($exe in $PossibleExeLocations) {
    if (Test-Path $exe) {
        $ClaudeExePath = $exe
        break
    }
}

if ($ClaudeExePath -and (-not $NoShortcut)) {
    try {
        $WshShell = New-Object -ComObject WScript.Shell
        $ExeDir = Split-Path $ClaudeExePath -Parent

        # Ярлык на Рабочем столе
        $DesktopDir = [Environment]::GetFolderPath("Desktop")
        $ShortcutPath = Join-Path $DesktopDir "Claude (Русский).lnk"
        $Shortcut = $WshShell.CreateShortcut($ShortcutPath)
        $Shortcut.TargetPath = $ClaudeExePath
        $Shortcut.WorkingDirectory = $ExeDir
        $Shortcut.IconLocation = "$ClaudeExePath,0"
        $Shortcut.Description = "Claude Desktop с русской локализацией"
        $Shortcut.Save()
        Write-Host "🔗 Создан ярлык на Рабочем столе: 'Claude (Русский)'" -ForegroundColor Green

        # Ярлык в меню Пуск
        $StartMenuPrograms = [Environment]::GetFolderPath("Programs")
        if (Test-Path $StartMenuPrograms) {
            $StartShortcutPath = Join-Path $StartMenuPrograms "Claude (Русский).lnk"
            $StartShortcut = $WshShell.CreateShortcut($StartShortcutPath)
            $StartShortcut.TargetPath = $ClaudeExePath
            $StartShortcut.WorkingDirectory = $ExeDir
            $StartShortcut.IconLocation = "$ClaudeExePath,0"
            $StartShortcut.Description = "Claude Desktop с русской локализацией"
            $StartShortcut.Save()
        }
    } catch {
        Write-Host "⚠️ Не удалось создать ярлык: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}


# -------------------------------------------------------------
# 8. Настройка русского языка для рассуждений (Thinking) в Claude Code
# ВАЖНО: не перезаписывает файл пользователя, а аккуратно дополняет его!
# -------------------------------------------------------------
$GlobalClaudeDir = Join-Path $env:USERPROFILE ".claude"
if (-not (Test-Path $GlobalClaudeDir)) {
    New-Item -ItemType Directory -Path $GlobalClaudeDir -Force | Out-Null
}

$GlobalClaudeMd = Join-Path $GlobalClaudeDir "CLAUDE.md"
$RussianRuleMarker = "<!-- CLAUDE-RUSSIFICATION-THINKING-CONFIG -->"
$RussianRuleContent = @"

$RussianRuleMarker
## Языковые инструкции (Language Preference)
- Все внутренние рассуждения (Thinking / Chain of Thought), ход мыслей, промежуточный анализ и шаги планирования ВСЕГДА ведутся исключительно на русском языке от начала и до самого конца.
- КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО переходить или соскальзывать на английский язык внутри блоков рассуждений (thinking), даже при обсуждении или анализе англоязычного кода, системных терминов, архитектуры, библиотек или инструментов.
- Любой промежуточный текст между вызовами инструментов (intermediate progress text, краткие сводки действий, статус выполнения) ВСЕГДА пишется исключительно на русском языке.
- Ответы и выводы пользователю формулируются на русском языке. Код, системные идентификаторы и имена команд остаются на английском.
<!-- END-CLAUDE-RUSSIFICATION-THINKING-CONFIG -->
"@

if (Test-Path $GlobalClaudeMd) {
    $ExistingContent = [System.IO.File]::ReadAllText($GlobalClaudeMd, [System.Text.Encoding]::UTF8)
    if ($ExistingContent -match "<!-- CLAUDE-RUSSIFICATION-THINKING-CONFIG -->[\s\S]*?<!-- END-CLAUDE-RUSSIFICATION-THINKING-CONFIG -->") {
        Write-Host "📝 Обновление строгих инструкций русского мышления в ~/.claude/CLAUDE.md..." -ForegroundColor Yellow
        $ExistingContent = $ExistingContent -replace "<!-- CLAUDE-RUSSIFICATION-THINKING-CONFIG -->[\s\S]*?<!-- END-CLAUDE-RUSSIFICATION-THINKING-CONFIG -->", $RussianRuleContent.Trim()
        [System.IO.File]::WriteAllText($GlobalClaudeMd, $ExistingContent, [System.Text.Encoding]::UTF8)
    } else {
        Write-Host "📝 Дополнение глобальных инструкций Claude Code (~/.claude/CLAUDE.md)..." -ForegroundColor Yellow
        [System.IO.File]::AppendAllText($GlobalClaudeMd, [Environment]::NewLine + $RussianRuleContent, [System.Text.Encoding]::UTF8)
    }
} else {
    Write-Host "📝 Создание глобальных инструкций Claude Code (~/.claude/CLAUDE.md)..." -ForegroundColor Yellow
    [System.IO.File]::WriteAllText($GlobalClaudeMd, $RussianRuleContent.TrimStart(), [System.Text.Encoding]::UTF8)
}

# -------------------------------------------------------------
# 9. Очистка браузерного кэша Chromium
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

# -------------------------------------------------------------
# 10. Активация фоновой автозащиты от сброса при обновлениях (Auto-Heal)
# -------------------------------------------------------------
$AutoHealVbs = Join-Path $ScriptDir "auto-heal-silent.vbs"
if (Test-Path $AutoHealVbs) {
    Write-Host "🛡️ Активация фоновой автозащиты русификатора (Auto-Heal)..." -ForegroundColor Yellow
    try {
        & schtasks /create /tn "ClaudeDesktopAutoHeal" /tr "wscript.exe `"$AutoHealVbs`"" /sc onlogon /f /rl limited 2>$null | Out-Null
        Start-Process "wscript.exe" -ArgumentList "`"$AutoHealVbs`"" -ErrorAction SilentlyContinue
        Write-Host "✅ Фоновая автозащита успешно активирована (служба Auto-Heal активна)." -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Не удалось активировать автозащиту в планировщике, используйте enable-autoheal.bat" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Green
Write-Host "🎉 Готово! Русификатор успешно установлен на Windows." -ForegroundColor Green
if ($CreatedFromWindowsApps) {
    Write-Host "👉 Запустите русифицированный Claude с помощью ярлыка" -ForegroundColor Cyan
    Write-Host "   'Claude (Русский)' на Рабочем столе." -ForegroundColor Cyan
} else {
    Write-Host "👉 Запустите Claude Desktop из меню Пуск или с Рабочего стола." -ForegroundColor Cyan
}
Write-Host "=======================================================" -ForegroundColor Green
