@echo off
chcp 65001 >nul
echo ========================================================
echo   Отключение фоновой автозащиты русификатора (Auto-Heal)
echo ========================================================
echo.

echo [1/3] Завершение фоновых процессов Auto-Heal...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'auto-heal\.ps1' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"

echo [2/3] Удаление задачи из Планировщика заданий Windows...
schtasks /delete /tn "ClaudeDesktopAutoHeal" /f >nul 2>&1

echo [3/3] Удаление ярлыка из Автозагрузки (если был)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$p = [Environment]::GetFolderPath('Startup') + '\ClaudeAutoHeal.lnk'; if (Test-Path $p) { Remove-Item $p -Force }"

echo.
echo ========================================================
echo   ✅ Фоновая автозащита успешно отключена.
echo ========================================================
pause
