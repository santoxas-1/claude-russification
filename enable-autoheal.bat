@echo off
chcp 65001 >nul
echo ========================================================
echo   Включение фоновой автозащиты русификатора (Auto-Heal)
echo ========================================================
echo.

set SCRIPT_DIR=%~dp0
set VBS_PATH=%SCRIPT_DIR%auto-heal-silent.vbs
set PS_PATH=%SCRIPT_DIR%auto-heal.ps1

echo [1/3] Проверка целостности русификации прямо сейчас...
powershell -NoProfile -ExecutionPolicy Bypass -File "%PS_PATH%" -Once

echo.
echo [2/3] Регистрация задачи в Планировщике заданий Windows...
schtasks /create /tn "ClaudeDesktopAutoHeal" /tr "wscript.exe \"%VBS_PATH%\"" /sc onlogon /f /rl limited >nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo [УСПЕХ] Фоновая задача "ClaudeDesktopAutoHeal" зарегистрирована!
) else (
    echo [ИНФО] Регистрация через Планировщик не удалась, добавляем в Автозагрузку...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([Environment]::GetFolderPath('Startup') + '\ClaudeAutoHeal.lnk'); $s.TargetPath = 'wscript.exe'; $s.Arguments = '\"%VBS_PATH%\"'; $s.WorkingDirectory = '%SCRIPT_DIR%'; $s.Save()"
)

echo.
echo [3/3] Запуск фонового процесса Auto-Heal...
wscript.exe "%VBS_PATH%"

echo.
echo ========================================================
echo   ✅ Фоновая автозащита успешно активна!
echo   Локализация Claude Desktop теперь защищена от сброса.
echo   Логи: %%LOCALAPPDATA%%\Claude\claude-autoheal.log
echo ========================================================
pause
