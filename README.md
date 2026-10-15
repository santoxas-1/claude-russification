<H1 align="center"> Русификатор Claude Desktop (Windows / macOS / Linux)  </H1>

<p align="center">
  <img src="https://claude.ai/images/claude_ogimage.png" width="400" alt="Claude Desktop">
</p>

<p align="center">
  <strong>Перевод официального десктопного приложения Claude Desktop на русский язык</strong>
</p>

## Инструкция по установке

### Windows (10 / 11)

#### Быстрая установка:
1. Закройте приложение Claude Desktop (если открыто).
2. Запустите **PowerShell** от имени обычного пользователя (или Администратора) и выполните:

```powershell
git clone https://github.com/santoxas-1/claude-russification.git
cd claude-russification
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

3. После завершения на Рабочем столе появится ярлык **«Claude (Русский)»**. Запустите приложение с него.

> ** Особенности для Windows**:
> * **Безопасное завершение**: скрипт останавливает только GUI-окно Claude Desktop и **не прерывает** консольные процессы Claude Code CLI / Agent SDK.
> * **Поддержка Microsoft Store (MSIX / WindowsApps)**: если Claude установлен через магазин Windows, скрипт автоматически создаст чистую рабочую копию в `%LOCALAPPDATA%\Programs\Claude`, локализует её и выведет ярлык на Рабочий стол, избегая конфликта с защитой цифровой подписи Windows (`0x80073CFC`).
> * **Очистка кэша**: автоматически очищается старый кэш Chromium для мгновенного вступления изменений в силу.

---

### macOS

1. Откройте **Терминал** и выполните:

```bash
git clone https://github.com/santoxas-1/claude-russification.git
cd claude-russification
chmod +x install.sh
sudo ./install.sh
```

2. Запустите Claude:
```bash
open /Applications/Claude.app
```

> ** Особенности для macOS**:
> Скрипт автоматически снимает карантинные флаги Gatekeeper (`xattr -cr`), очищает кэш Chromium и переподписывает приложение ad-hoc сертификатом (`codesign`).

---

### Linux

1. Откройте терминал и выполните:

```bash
git clone https://github.com/santoxas-1/claude-russification.git
cd claude-russification
chmod +x install.sh
sudo ./install.sh
```

---

## Инструкция по обновлению

Claude Desktop периодически обновляется в фоновом режиме, скачивая свежие файлы ресурсов. Если после обновления Claude часть интерфейса снова стала на английском языке:

### На Windows:
Откройте PowerShell в папке с репозиторием и выполните:
```powershell
cd claude-russification
git pull
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

### На macOS / Linux:
Откройте Терминал в папке с репозиторием и выполните:
```bash
cd claude-russification
git pull
sudo ./install.sh
```

Скрипт автоматически подтянет новые переводы, применит патчи и очистит кэш.

---

## Инструкция по удалению (Возврат к оригиналу)

Если вы решите полностью удалить русификатор и вернуть заводскую английскую версию приложения:

### На Windows:
В PowerShell перейдите в папку проекта и запустите скрипт деинсталляции:
```powershell
cd claude-russification
powershell -ExecutionPolicy Bypass -File .\uninstall.ps1
```
Скрипт:
- Восстановит оригинальные файлы `en-US.json`, `index.html` и нативные меню из резервных копий `.original`.
- Удалит созданный скрипт перехватчика `i18n-ru.js`.
- Удалит созданные ярлыки «Claude (Русский)» с Рабочего стола и меню «Пуск».
- Очистит кэш браузера.

### На macOS / Linux:
В Терминале запустите:
```bash
cd claude-russification
sudo ./uninstall.sh
```

## Лицензия

Проект распространяется под лицензией [MIT](LICENSE).  
Создан сообществом для русскоязычных пользователей Claude. Не аффилирован с Anthropic PBC.
