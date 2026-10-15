#!/usr/bin/env bash
set -e

# Claude Desktop Russian Localization Uninstaller
# Supports macOS and Linux

OS="$(uname -s)"

echo "=== Удаление русификатора Claude Desktop ==="

if [ "$OS" = "Darwin" ]; then
  APP_PATH="/Applications/Claude.app"
  ION_DIR="$APP_PATH/Contents/Resources/ion-dist"
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
else
  echo "❌ Ошибка: Неподдерживаемая ОС: $OS"
  exit 1
fi

if [ -z "$ION_DIR" ] || [ ! -d "$ION_DIR" ]; then
  echo "❌ Ошибка: Папка ion-dist не найдена"
  exit 1
fi

I18N_DIR="$ION_DIR/i18n"
DYN_I18N_DIR="$I18N_DIR/dynamic"
INDEX_HTML="$ION_DIR/index.html"

BACKUP_HTML="$ION_DIR/index.html.original"
BACKUP_EN="$I18N_DIR/en-US.json.original"
BACKUP_DYN="$DYN_I18N_DIR/en-US.json.original"
TARGET_SCRIPT="$ION_DIR/i18n-ru.js"

# Безопасное завершение Claude Desktop (не трогает Claude Code CLI)
echo "⏳ Проверка запущенных процессов Claude Desktop..."
if [ "$OS" = "Darwin" ]; then
  pkill -f "/Applications/Claude.app/Contents/MacOS/Claude" 2>/dev/null || true
  sleep 1
elif [ "$OS" = "Linux" ]; then
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

# Восстановление каталогов
if [ -f "$BACKUP_EN" ]; then
  echo "📦 Восстановление оригинального en-US.json..."
  cp "$BACKUP_EN" "$I18N_DIR/en-US.json"
  rm "$BACKUP_EN"
fi

if [ -f "$BACKUP_DYN" ]; then
  echo "📦 Восстановление оригинального dynamic/en-US.json..."
  cp "$BACKUP_DYN" "$DYN_I18N_DIR/en-US.json"
  rm "$BACKUP_DYN"
fi

# Восстановление index.html
if [ -f "$BACKUP_HTML" ]; then
  echo "📦 Восстановление оригинального index.html..."
  cp "$BACKUP_HTML" "$INDEX_HTML"
  rm "$BACKUP_HTML"
else
  sed -i '' 's|<script src="/i18n-ru.js"></script>||g' "$INDEX_HTML" 2>/dev/null || \
  sed -i 's|<script src="/i18n-ru.js"></script>||g' "$INDEX_HTML"
fi

# Удаление i18n-ru.js
if [ -f "$TARGET_SCRIPT" ]; then
  echo "🗑️ Удаление i18n-ru.js..."
  rm -f "$TARGET_SCRIPT"
fi


# Очистка секции русификации из ~/.claude/CLAUDE.md без потери пользовательских данных
USER_DATA_DIR="${SUDO_USER:-$USER}"
USER_HOME=$(eval echo "~$USER_DATA_DIR")
GLOBAL_CLAUDE_MD="$USER_HOME/.claude/CLAUDE.md"
MARKER="<!-- CLAUDE-RUSSIFICATION-THINKING-CONFIG -->"

if [ -f "$GLOBAL_CLAUDE_MD" ] && grep -q "$MARKER" "$GLOBAL_CLAUDE_MD"; then
  echo "🧹 Очистка секции русского мышления из ~/.claude/CLAUDE.md..."
  sed -i.bak '/<!-- CLAUDE-RUSSIFICATION-THINKING-CONFIG -->/,/<!-- END-CLAUDE-RUSSIFICATION-THINKING-CONFIG -->/d' "$GLOBAL_CLAUDE_MD" 2>/dev/null || true
  rm -f "$GLOBAL_CLAUDE_MD.bak" 2>/dev/null || true
fi

# На macOS переподпись
if [ "$OS" = "Darwin" ]; then
  echo "✍️ Переподпись приложения..."
  xattr -cr "$APP_PATH" 2>/dev/null || true
  codesign --force --deep --sign - "$APP_PATH"
fi

echo "✅ Русификатор успешно удален. Приложение возвращено в исходное состояние."
