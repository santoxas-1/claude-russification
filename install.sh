#!/usr/bin/env bash
set -e

# Claude Desktop Russian Localization Installer
# Supports macOS and Linux

OS="$(uname -s)"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="$DIR/dist"

echo "======================================================="
echo "   Русификатор Claude Desktop (macOS / Linux)"
echo "   https://github.com/santoxas-1/claude-russification"
echo "======================================================="

# Detect installation path based on OS
if [ "$OS" = "Darwin" ]; then
  APP_PATH="/Applications/Claude.app"
  ION_DIR="$APP_PATH/Contents/Resources/ion-dist"
  USER_DATA_DIR="${SUDO_USER:-$USER}"
  USER_HOME=$(eval echo "~$USER_DATA_DIR")
  CACHE_DIR="$USER_HOME/Library/Application Support/Claude"
elif [ "$OS" = "Linux" ]; then
  CANDIDATE_PATHS=(
    "/opt/Claude/resources/ion-dist"
    "/opt/claude-desktop/resources/ion-dist"
    "/usr/lib/claude/resources/ion-dist"
    "$HOME/.local/share/Claude/resources/ion-dist"
    "/var/lib/flatpak/app/com.anthropic.Claude/current/active/files/extra/resources/ion-dist"
  )
  ION_DIR=""
  for p in "${CANDIDATE_PATHS[@]}"; do
    if [ -d "$p" ]; then
      ION_DIR="$p"
      break
    fi
  done
  APP_PATH="$(dirname "$(dirname "$ION_DIR")")"
  USER_DATA_DIR="${SUDO_USER:-$USER}"
  USER_HOME=$(eval echo "~$USER_DATA_DIR")
  CACHE_DIR="$USER_HOME/.config/Claude"
else
  echo "❌ Ошибка: Неподдерживаемая операционная система: $OS"
  echo "Для Windows используйте install.ps1"
  exit 1
fi

if [ -z "$ION_DIR" ] || [ ! -d "$ION_DIR" ]; then
  echo "❌ Ошибка: Не удалось найти папку ресурсов Claude Desktop (ion-dist)."
  echo "Проверьте, установлено ли приложение Claude Desktop."
  exit 1
fi

I18N_DIR="$ION_DIR/i18n"
DYN_I18N_DIR="$I18N_DIR/dynamic"
INDEX_HTML="$ION_DIR/index.html"

BACKUP_HTML="$ION_DIR/index.html.original"
BACKUP_EN="$I18N_DIR/en-US.json.original"
BACKUP_DYN="$DYN_I18N_DIR/en-US.json.original"

PATCHED_EN="$DIST_DIR/en-US.json"
PATCHED_DYN="$DIST_DIR/dynamic/en-US.json"
SCRIPT_SRC="$DIST_DIR/i18n-ru.js"

# 1. Безопасное завершение работы Claude Desktop (не трогает Claude Code CLI)
echo "⏳ Проверка запущенных процессов Claude Desktop..."
if [ "$OS" = "Darwin" ]; then
  pkill -f "/Applications/Claude.app/Contents/MacOS/Claude" 2>/dev/null || true
  sleep 1
elif [ "$OS" = "Linux" ]; then
  # Завершаем только процессы Electron Desktop, не трогая Claude Code CLI / Agent SDK
  for pid in $(pgrep -f "claude" 2>/dev/null || true); do
    exe_target=$(readlink -f "/proc/$pid/exe" 2>/dev/null || true)
    cmdline=$(tr '\0' ' ' < "/proc/$pid/cmdline" 2>/dev/null || true)
    if [[ "$cmdline" =~ claude-code|\.claude|node_modules|npm ]]; then
      continue
    fi
    if [[ "$cmdline" =~ ion-dist|app\.asar|--type=renderer ]] || [[ "$exe_target" =~ /opt/|/usr/lib/claude ]]; then
      kill -TERM "$pid" 2>/dev/null || true
    fi
  done
  sleep 1
fi

# 2. На macOS снимаем карантин
if [ "$OS" = "Darwin" ]; then
  echo "🔐 Снятие карантинных атрибутов macOS..."
  xattr -cr "$APP_PATH" 2>/dev/null || true
fi

# 3. Резервное копирование оригиналов
if [ ! -f "$BACKUP_HTML" ]; then
  echo "📦 Создание резервной копии index.html..."
  cp "$INDEX_HTML" "$BACKUP_HTML"
fi

if [ ! -f "$BACKUP_EN" ]; then
  echo "📦 Создание резервной копии основного каталога en-US.json..."
  cp "$I18N_DIR/en-US.json" "$BACKUP_EN"
fi

if [ ! -f "$BACKUP_DYN" ] && [ -f "$DYN_I18N_DIR/en-US.json" ]; then
  echo "📦 Создание резервной копии динамического каталога dynamic/en-US.json..."
  cp "$DYN_I18N_DIR/en-US.json" "$BACKUP_DYN"
fi

# 4. Установка русифицированных каталогов
echo "📁 Установка нативного каталога en-US.json..."
cp "$PATCHED_EN" "$I18N_DIR/en-US.json"

if [ -f "$PATCHED_DYN" ]; then
  echo "📁 Установка динамического каталога dynamic/en-US.json..."
  mkdir -p "$DYN_I18N_DIR"
  cp "$PATCHED_DYN" "$DYN_I18N_DIR/en-US.json"
fi

# 5. Установка реактивного скрипта
echo "📋 Копирование i18n-ru.js..."
cp "$SCRIPT_SRC" "$ION_DIR/i18n-ru.js"

# 6. Внедрение скрипта в начало head в index.html
if ! grep -q "i18n-ru.js" "$INDEX_HTML"; then
  echo "💉 Внедрение <script src=\"/i18n-ru.js\"></script> в <head>..."
  sed -i '' 's|<head>|<head><script src="/i18n-ru.js"></script>|' "$INDEX_HTML" 2>/dev/null || \
  sed -i 's|<head>|<head><script src="/i18n-ru.js"></script>|' "$INDEX_HTML"
else
  echo "ℹ️ Скрипт i18n-ru.js уже подключен в index.html"
fi


# 7. Настройка русского языка для рассуждений (Thinking) в Claude Code
# Не перезаписывает файл пользователя, а аккуратно дополняет его!
GLOBAL_CLAUDE_DIR="$USER_HOME/.claude"
GLOBAL_CLAUDE_MD="$GLOBAL_CLAUDE_DIR/CLAUDE.md"
MARKER="<!-- CLAUDE-RUSSIFICATION-THINKING-CONFIG -->"

mkdir -p "$GLOBAL_CLAUDE_DIR" 2>/dev/null || true

if [ -f "$GLOBAL_CLAUDE_MD" ]; then
  if ! grep -q "$MARKER" "$GLOBAL_CLAUDE_MD"; then
    echo "📝 Дополнение глобальных инструкций Claude Code (~/.claude/CLAUDE.md)..."
    cat << 'EOF' >> "$GLOBAL_CLAUDE_MD"

<!-- CLAUDE-RUSSIFICATION-THINKING-CONFIG -->
## Языковые инструкции (Language Preference)
- Все внутренние рассуждения (Thinking / Chain of Thought), ход мыслей, промежуточный анализ и шаги планирования ВСЕГДА ведутся исключительно на русском языке.
- Ответы и выводы пользователю формулируются на русском языке. Код, системные идентификаторы и имена команд остаются на английском.
<!-- END-CLAUDE-RUSSIFICATION-THINKING-CONFIG -->
EOF
  fi
else
  echo "📝 Создание глобальных инструкций Claude Code (~/.claude/CLAUDE.md)..."
  cat << 'EOF' > "$GLOBAL_CLAUDE_MD"
<!-- CLAUDE-RUSSIFICATION-THINKING-CONFIG -->
## Языковые инструкции (Language Preference)
- Все внутренние рассуждения (Thinking / Chain of Thought), ход мыслей, промежуточный анализ и шаги планирования ВСЕГДА ведутся исключительно на русском языке.
- Ответы и выводы пользователю формулируются на русском языке. Код, системные идентификаторы и имена команд остаются на английском.
<!-- END-CLAUDE-RUSSIFICATION-THINKING-CONFIG -->
EOF
fi

# 8. Очистка кэша Chromium
if [ -d "$CACHE_DIR" ]; then
  echo "🧹 Очистка браузерного кэша приложения..."
  rm -rf "$CACHE_DIR/Cache"/* 2>/dev/null || true
  rm -rf "$CACHE_DIR/Code Cache"/* 2>/dev/null || true
  rm -rf "$CACHE_DIR/GPUCache"/* 2>/dev/null || true
fi

# 9. На macOS переподписываем приложение
if [ "$OS" = "Darwin" ]; then
  echo "✍️ Подпись приложения ad-hoc сертификатом (codesign)..."
  codesign --force --deep --sign - "$APP_PATH"
fi

echo ""
echo "🎉 Готово! Русификатор успешно установлен."
if [ "$OS" = "Darwin" ]; then
  echo "Запустите Claude: open /Applications/Claude.app"
else
  echo "Запустите Claude Desktop из меню приложений."
fi
