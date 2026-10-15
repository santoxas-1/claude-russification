# 🇷🇺 Полный Русификатор Claude Desktop (Windows / macOS / Linux)

<p align="center">
  <img src="https://claude.ai/images/claude_ogimage.png" width="400" alt="Claude Desktop">
</p>

<p align="center">
  <strong>100% полный, качественный и бесшовный перевод официального десктопного приложения Claude Desktop на русский язык.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-blue?style=flat-square" alt="Platform">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License">
  <img src="https://img.shields.io/badge/Claude%20Desktop-v2.x-orange?style=flat-square" alt="Version">
  <img src="https://img.shields.io/badge/Coverage-100%25-brightgreen?style=flat-square" alt="Coverage">
</p>

---

## ✨ Возможности и архитектура

В отличие от стандартных частичных русификаторов, данный проект реализует **полный четырехконтурный перевод**:

1. **Нативные системные меню Electron и системный трей (`resources/en-US.json`)**:
   - 100% покрытие (все 807 нативных ключей).
   - Меню окна (*Файл, Правка, Вид, Окно, Справка*), контекстное меню трея, системные диалоги подтверждения, запросы прав доступа, SSH-сессии и сочетания клавиш переведены с соблюдением ICU-плюрализации.
2. **Основной веб-каталог FormatJS / React-Intl (`dist/en-US.json`)**:
   - Более **5000 переведенных ключей**: настройки, профиль, диалоги, боковая панель, вкладка Claude Code, управление ворктри (worktree), ветками, коммитами и PR в GitHub.
3. **Динамический каталог моделей и параметров инференса (`dist/dynamic/en-US.json`)**:
   - 100% моделей (*Sonnet, Opus, Haiku*), описания (*«Максимальные возможности для масштабных задач»*), режимы мышления (*Auto thinking, Extended, Budget*), уровни рассуждения (*Low, Medium, High, Max*) и инструменты.
4. **Реактивный перехватчик `fetch` и DOM-движок (`dist/i18n-ru.js`)**:
   - Перехватывает вызовы `fetch` до рендера компонентов React (никакого мигания английского текста).
   - Динамически переводит всплывающие подсказки, контекстные меню, рутины, создание навыков, каталоги плагинов и настройки стороннего инференса.
   - **Защита ввода**: предотвращает искажение текста сообщений пользователя и блоков кода в терминале/редакторах.

---

## 🚀 Инструкция по установке

### 🪟 Windows (10 / 11)

#### Быстрая установка:
1. Закройте приложение Claude Desktop (если открыто).
2. Запустите **PowerShell** от имени обычного пользователя (или Администратора) и выполните:

```powershell
git clone https://github.com/santoxas-1/claude-russification.git
cd claude-russification
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

3. После завершения на Рабочем столе появится ярлык **«Claude (Русский)»**. Запустите приложение с него.

> **💡 Особенности для Windows**:
> * **Безопасное завершение**: скрипт останавливает только GUI-окно Claude Desktop и **не прерывает** консольные процессы Claude Code CLI / Agent SDK.
> * **Поддержка Microsoft Store (MSIX / WindowsApps)**: если Claude установлен через магазин Windows, скрипт автоматически создаст чистую рабочую копию в `%LOCALAPPDATA%\Programs\Claude`, локализует её и выведет ярлык на Рабочий стол, избегая конфликта с защитой цифровой подписи Windows (`0x80073CFC`).
> * **Очистка кэша**: автоматически очищается старый кэш Chromium для мгновенного вступления изменений в силу.

---

### 🍎 macOS

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

> **💡 Особенности для macOS**:
> Скрипт автоматически снимает карантинные флаги Gatekeeper (`xattr -cr`), очищает кэш Chromium и переподписывает приложение ad-hoc сертификатом (`codesign`).

---

### 🐧 Linux

1. Откройте терминал и выполните:

```bash
git clone https://github.com/santoxas-1/claude-russification.git
cd claude-russification
chmod +x install.sh
sudo ./install.sh
```

---

## 🔄 Инструкция по обновлению

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

## 🗑️ Инструкция по удалению (Возврат к оригиналу)

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

---

## 🛠️ Сборка из исходников (Для разработчиков)

Если вы хотите расширить перевод или добавить собственные термины:
1. Редактируйте словари в каталоге `src/`:
   * `dictionary_ru.py` — общие термины и элементы интерфейса;
   * `settings_translations.py` — параметры настроек и сессий;
   * `dynamic_ru.py` — параметры моделей и режимов рассуждений;
   * `all_tabs_ru.py` — вкладки и боковая панель.
2. Скомпилируйте файлы каталога `dist/`:
   ```bash
   python3 src/build.py
   ```
3. Запустите скрипт установки `install.ps1` или `install.sh`.

---

## 📄 Лицензия

Проект распространяется под лицензией [MIT](LICENSE).  
Создан сообществом для русскоязычных пользователей Claude. Не аффилирован с Anthropic PBC.
