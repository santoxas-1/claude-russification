@echo off
chcp 65001 >nul
echo ========================================================
echo   Статус фоновой автозащиты Claude Desktop (Auto-Heal)
echo ========================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "& {
    Write-Host '1. Проверка фонового процесса Auto-Heal:' -ForegroundColor Cyan
    $procs = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'auto-heal\.ps1' }
    if ($procs) {
        Write-Host '   ✅ Процесс запущен в фоне (PID: ' -NoNewline -ForegroundColor Green
        Write-Host (($procs | ForEach-Object { $_.ProcessId }) -join ', ') -NoNewline -ForegroundColor Green
        Write-Host ')' -ForegroundColor Green
    } else {
        Write-Host '   ⚠️ Фоновый процесс Auto-Heal не запущен.' -ForegroundColor Yellow
    }

    Write-Host ''
    Write-Host '2. Проверка задачи в Планировщике заданий:' -ForegroundColor Cyan
    $task = schtasks /query /tn 'ClaudeDesktopAutoHeal' 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host '   ✅ Задача ClaudeDesktopAutoHeal активна в Планировщике.' -ForegroundColor Green
    } else {
        Write-Host '   ℹ️ Задача в Планировщике не найдена.' -ForegroundColor Gray
    }

    Write-Host ''
    Write-Host '3. Проверка целостности установки Claude:' -ForegroundColor Cyan
    $indexHtml = Join-Path $env:LOCALAPPDATA 'Programs\Claude\resources\ion-dist\index.html'
    if (Test-Path $indexHtml) {
        $content = [System.IO.File]::ReadAllText($indexHtml)
        if ($content -match 'i18n-ru\.js') {
            Write-Host '   ✅ Скрипт i18n-ru.js подключен в index.html' -ForegroundColor Green
        } else {
            Write-Host '   ❌ i18n-ru.js ОТСУТСТВУЕТ в index.html (требуется восстановление)' -ForegroundColor Red
        }
    }

    Write-Host ''
    Write-Host '4. Последние записи журнала Auto-Heal:' -ForegroundColor Cyan
    $log = Join-Path $env:LOCALAPPDATA 'Claude\claude-autoheal.log'
    if (Test-Path $log) {
        Get-Content $log -Tail 6 | ForEach-Object { Write-Host ('   ' + $_) -ForegroundColor Gray }
    } else {
        Write-Host '   (Журнал пока пуст)' -ForegroundColor Gray
    }
}"

echo.
echo ========================================================
pause
