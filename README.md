# 🇷🇺 Claude Desktop Русификатор (macOS / Windows / Linux)

<p align="center">
  <img src="https://claude.ai/images/claude_ogimage.png" width="400" alt="Claude Desktop">
</p>

<p align="center">
  <strong>Комплексный и качественный русификатор для официального десктопного приложения Claude.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-blue?style=flat-square" alt="Platform">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License">
  <img src="https://img.shields.io/badge/Claude%20Desktop-v2.x-orange?style=flat-square" alt="Version">
</p>

---

## ✨ Особенности

* **Нативная трехуровневая архитектура**:
  1. **Нативные JSON-каталоги**: перевод интегрирован в системные файлы приложения (`en-US.json` и `dynamic/en-US.json`), загружаемые движком FormatJS / React-Intl на старте.
  2. **Синхронный перехватчик `fetch`**: гарантирует мгновенную подмену сообщений в оперативной памяти до рендера компонентов (никакого мигания английского текста).
  3. **Реактивный DOM-наблюдатель (`i18n-ru.js`)**: переводит динамические всплывающие меню, тултипы, контекстные списки и плейсхолдеры ввода с нормализацией кавычек и спецсимволов.
* **Переведено всё приложение**:
  * **Все разделы Настроек**: Основные, Профиль, Внешний вид, Конфиденциальность, Расход токенов (Usage), Claude Code, Cowork, Импорт и экспорт, Этот компьютер (Системные), Разработчик, Навыки, Коннекторы, Плагины.
  * **Инференс и сторонние шлюзы**: полный перевод экрана конфигурации стороннего инференса (`127.0.0.1:10100`, шлюзы, учетные данные, API-ключи).
  * **Чат, Модели и Размышления**: 100% моделей (*Sonnet, Opus, Haiku*), режимов мышления (*Auto thinking, Extended, Adaptive, Fast mode*), параметров усилий (*Low, Medium, High, Max*) и инструментов (*Web search, Analysis tool*).
  * **Запланированные задачи (Scheduled Tasks) и Рутины**: создание задач, расписания, шаблоны карточек, переключатели сна.
  * **Артефакты и Проекты**: создание проектов, модальные окна, версии артефактов, код и предпросмотр.
  * **Боковая панель и фильтры**: группировка, сортировка, контекстные меню, меню пользователя.
* **Безопасность кода**: текст сообщений пользователя и сгенерированный код нейросети не изменяются.
* **Легкое удаление**: автоматическое создание резервных копий и восстановление оригиналов в 1 клик.

---

## 🚀 Установка

### 🍎 macOS

Откройте Терминал и выполните:

```bash
git clone https://github.com/teroguy/claude-russification.git
cd claude-russification
chmod +x install.sh
sudo ./install.sh
```

После завершения запустите Claude:
```bash
open /Applications/Claude.app
```

> **Примечание для macOS**: Скрипт автоматически снимает карантинные флаги Gatekeeper (`xattr -cr`), очищает браузерный кэш Chromium и переподписывает приложение ad-hoc сертификатом (`codesign`).

---

### 🪟 Windows

1. Откройте **PowerShell** от имени пользователя (или Администратора).
2. Выполните:

```powershell
git clone https://github.com/teroguy/claude-russification.git
cd claude-russification
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

После завершения запустите Claude Desktop из меню «Пуск».

---

### 🐧 Linux

```bash
git clone https://github.com/teroguy/claude-russification.git
cd claude-russification
chmod +x install.sh
sudo ./install.sh
```

---

## 🔄 После обновления Claude Desktop

Claude Desktop обновляется автоматически в фоновом режиме, перезаписывая папку ресурсов.
Если интерфейс после автообновления снова стал на английском, просто запустите команду повторно:

* **macOS / Linux**:
  ```bash
  cd claude-russification && sudo ./install.sh
  ```
* **Windows**:
  ```powershell
  cd claude-russification; powershell -ExecutionPolicy Bypass -File .\install.ps1
  ```

---

## 🗑️ Удаление (Возврат к заводскому оригиналу)

Скрипт вернет оригинальные языковые каталоги и `index.html` из резервных копий `.original`:

* **macOS / Linux**:
  ```bash
  sudo ./uninstall.sh
  ```
* **Windows**:
  ```powershell
  powershell -ExecutionPolicy Bypass -File .\uninstall.ps1
  ```

---

## 🛠️ Сборка из исходников (Для разработчиков)

Если вы хотите дополнить перевод или отредактировать словарь:

1. Исходные словари находятся в папке `src/`:
   * `dictionary_ru.py` — основные элементы интерфейса
   * `settings_translations.py` — настройки и сессии
   * `screenshot_targets_ru.py` — целевые фразы экранов
   * `all_tabs_ru.py` — вкладки (Коннекторы, Навыки, Cowork и др.)
   * `dynamic_ru.py` — параметры моделей и размышлений
2. Для компиляции в папку `dist/` запустите:
   ```bash
   python3 src/build.py
   ```
3. Примените обновленную сборку с помощью `install.sh` или `install.ps1`.

---

## 📄 Лицензия

Распространяется под лицензией [MIT](LICENSE).
Проект создан сообществом и не аффилирован с Anthropic PBC.
