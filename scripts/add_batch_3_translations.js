const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const completePath = path.join(root, 'src', 'complete_ui_ru.json');
const contextPath = path.join(root, 'src', 'context_fragments_ru.json');

const complete = JSON.parse(fs.readFileSync(completePath, 'utf8'));
const context = JSON.parse(fs.readFileSync(contextPath, 'utf8'));

// 1. Прямые подписи UI
const newEntries = {
  // Ползунок усилий (скриншоты 41-46)
  "Faster": "Быстрее",
  "Smarter": "Умнее",
  "Extra": "Экстра",
  "Complex, detailed work": "Сложная, детальная работа",
  "The hardest problems. Takes longest.": "Для самых трудных задач. Требует больше всего времени.",
  "Balanced for everyday work": "Сбалансировано для повседневной работы",
  "Light, casual tasks": "Простые, повседневные задачи",
  "Quick replies to simple questions": "Быстрые ответы на простые вопросы",
  "low": "низкий",
  "max": "максимальный",
  "ask": "спрашивать",
  "Policy": "Политика",

  // Разрешенные рабочие папки (скриншот 33)
  "Pre-select on new task": "Выбирать при создании новой задачи",
  "Shows as a folder chip on the new-task page and skips the trust prompt. Users can remove it.": "Отображается как значок папки на странице создания задачи и пропускает запрос доверия. Пользователи могут удалить её.",
  "Access mode": "Режим доступа",
  "Read-only folders can be viewed and searched but not modified in Cowork. In Code, applies to file tools only. Over SSH, also to Bash in its sandbox.": "Папки «только для чтения» можно просматривать и искать в них, но нельзя изменять в Cowork. В Code применяется только к файловым инструментам. По SSH — также к Bash в песочнице.",

  // Примеры и плейсхолдеры (скриншоты 27, 29)
  "value": "значение",
  "Always answer in British English. Never include customer account numbers in a response.": "Всегда отвечать на британском английском. Никогда не включать номера счетов клиентов в ответ."
};

for (const [k, v] of Object.entries(newEntries)) {
  complete[k] = v;
}

// 2. Новые контекстные карточки справок
const newCards = [
  {
    "id": "blocked-plugin-servers-format-card",
    "context": {
      "markers": [
        "allowedPluginMcpServers",
        "serverName"
      ],
      "signatures": [
        "serverCommand",
        "blocks every plugin"
      ]
    },
    "fragments": {
      " forms included: a value that is not a list, or that holds any entry the desktop cannot read, is reported and blocks every plugin's remote server (and those configuration-file remote servers), because skipping an entry of a block list would let its server connect. The servers named above as not affected still connect.": ", включая формы serverName и serverCommand: значение, не являющееся списком или содержащее запись, которую приложение не может прочитать, регистрируется в отчёте и блокирует удалённые серверы всех плагинов (а также удалённые серверы из конфигурационных файлов), поскольку пропуск записи в списке блокировки позволил бы её серверу подключиться. Указанные выше серверы, на которые это не распространяется, продолжают подключаться.",
      " forms included: a value that is not a list, or that holds any entry the desktop cannot read, is reported and blocks every plugin’s remote server (and those configuration-file remote servers), because skipping an entry of a block list would let its server connect. The servers named above as not affected still connect.": ", включая формы serverName и serverCommand: значение, не являющееся списком или содержащее запись, которую приложение не может прочитать, регистрируется в отчёте и блокирует удалённые серверы всех плагинов (а также удалённые серверы из конфигурационных файлов), поскольку пропуск записи в списке блокировки позволил бы её серверу подключиться. Указанные выше серверы, на которые это не распространяется, продолжают подключаться."
    }
  },
  {
    "id": "allowed-workspace-folders-card",
    "context": {
      "markers": [
        "allowedWorkspaceFolders",
        "coworkEgressAllowedHosts"
      ],
      "signatures": [
        "Access mode in Setup",
        "sandbox.filesystem.allowRead"
      ]
    },
    "fragments": {
      " and a read there is refused with no prompt; elsewhere (Windows, Linux without bubblewrap, or neither folders nor an egress allowlist in effect) such shell reads prompt for approval. The app keeps the user's git configuration files (which may themselves embed credentials such as URL tokens; a symlinked one stays hidden), its own Claude Code installation, and the session's plugin and attachment folders readable (not on a Windows SSH host, where plugin files and attachments stay out of the file tools' reach under the block). An allowed folder that is or contains the home directory leaves it readable.": " и попытка чтения там отклоняется без запроса; в остальных случаях (Windows, Linux без bubblewrap либо когда не заданы папки и не действует список разрешённых исходящих узлов) такое чтение через оболочку запрашивает подтверждение. Приложение сохраняет доступными для чтения файлы конфигурации git пользователя (которые сами могут содержать учётные данные, например токены URL; файлы по символическим ссылкам остаются скрытыми), собственную установку Claude Code, а также папки плагинов и вложений сессии (кроме хостов Windows по SSH, где файлы плагинов и вложения остаются недоступными для файловых инструментов при блокировке). Разрешённая папка, которая является домашней директорией или содержит её, оставляет её доступной для чтения.",
      " or ": " или ",
      " to \"merge\", a": " в значение \"merge\", а установка в ",
      " makes it read-only; that field’s own description says how far read-only reaches. A Code session can reach every listed folder, not only the one it was opened in. Setting this key also turns on Claude Code’s sandbox where it runs (macOS, or Linux and SSH hosts with bubblewrap): there a shell command normally writes in the listed folders without an approval prompt, and its writes to most other places, such as a package cache in the home directory, are refused. A home directory holds shell start-up files and SSH keys, so list work folders, not a whole home directory.": " делает её доступной только для чтения; собственное описание этого поля указывает границы действия режима только для чтения. Сессия Code может обращаться к каждой указанной папке, а не только к той, в которой она была открыта. Установка этого ключа также включает песочницу Claude Code там, где она поддерживается (macOS или Linux и хосты SSH с bubblewrap): в этом случае команда оболочки обычно выполняет запись в указанные папки без запроса подтверждения, а её запись в большинство других мест (например, кэш пакетов в домашнем каталоге) отклоняется. Домашний каталог содержит стартовые файлы оболочки и ключи SSH, поэтому указывайте рабочие папки, а не весь домашний каталог целиком.",
      " makes it read-only; that field's own description says how far read-only reaches. A Code session can reach every listed folder, not only the one it was opened in. Setting this key also turns on Claude Code's sandbox where it runs (macOS, or Linux and SSH hosts with bubblewrap): there a shell command normally writes in the listed folders without an approval prompt, and its writes to most other places, such as a package cache in the home directory, are refused. A home directory holds shell start-up files and SSH keys, so list work folders, not a whole home directory.": " делает её доступной только для чтения; собственное описание этого поля указывает границы действия режима только для чтения. Сессия Code может обращаться к каждой указанной папке, а не только к той, в которой она была открыта. Установка этого ключа также включает песочницу Claude Code там, где она поддерживается (macOS или Linux и хосты SSH с bubblewrap): в этом случае команда оболочки обычно выполняет запись в указанные папки без запроса подтверждения, а её запись в большинство других мест (например, кэш пакетов в домашнем каталоге) отклоняется. Домашний каталог содержит стартовые файлы оболочки и ключи SSH, поэтому указывайте рабочие папки, а не весь домашний каталог целиком."
    }
  },
  {
    "id": "access-mode-long-card",
    "context": {
      "markers": [
        "Read-only folders can be viewed and searched but not modified in Cowork",
        "In SSH sessions"
      ],
      "signatures": [
        "sandbox.excludedCommands",
        "CLAUDE_CONFIG_DIR"
      ]
    },
    "fragments": {
      "Read-only folders can be viewed and searched but not modified in Cowork (by Claude or via the UI). Bash runs in Cowork’s isolated workspace where the folder is mounted read-only at the OS level; file-tool writes (Edit, Write) are blocked in-process by Claude Desktop.": "Папки «только для чтения» можно просматривать и искать в них, но нельзя изменять в Cowork (ни через Claude, ни через интерфейс). Bash выполняется в изолированном рабочем пространстве Cowork, где папка монтируется только для чтения на уровне ОС; запись файловыми инструментами (Edit, Write) блокируется внутри процесса Claude Desktop.",
      "Read-only folders can be viewed and searched but not modified in Cowork (by Claude or via the UI). Bash runs in Cowork's isolated workspace where the folder is mounted read-only at the OS level; file-tool writes (Edit, Write) are blocked in-process by Claude Desktop.": "Папки «только для чтения» можно просматривать и искать в них, но нельзя изменять в Cowork (ни через Claude, ни через интерфейс). Bash выполняется в изолированном рабочем пространстве Cowork, где папка монтируется только для чтения на уровне ОС; запись файловыми инструментами (Edit, Write) блокируется внутри процесса Claude Desktop.",
      "In local Code sessions, read-only applies to Claude’s file tools only; Bash does not yet enforce it.": "В локальных сессиях Code режим только для чтения применяется исключительно к файловым инструментам Claude; Bash пока его не применяет.",
      "In local Code sessions, read-only applies to Claude's file tools only; Bash does not yet enforce it.": "В локальных сессиях Code режим только для чтения применяется исключительно к файловым инструментам Claude; Bash пока его не применяет.",
      "In SSH sessions (earlier versions ignore the mode on the host), read-only is enforced by Claude Code’s own permission rules: its file tools cannot modify the folder. A writable folder inside a read-only one is read-only too. Shell commands are stopped only where Claude Code’s sandbox runs (Linux needs bubblewrap and socat), and only as far as that sandbox goes: keep read-only folders outside writable ones, and use the operating system’s permissions where a folder must not change. The sandbox does not cover a path with * ? [ ] ( ) { } | + or a double quote. List each folder by its real path: shell commands may not be stopped in a folder listed through a link. Not enforced on Windows hosts, nor on a host with Claude Code managed settings of its own unless they set parentSettingsBehavior to merge. Not covered: MCP servers, hooks, the terminal, commands in sandbox.excludedCommands, and git worktrees, which Claude Desktop and Claude Code still create inside the folder.": "В сессиях SSH (более ранние версии игнорируют режим на хосте) режим только для чтения обеспечивается собственными правилами разрешений Claude Code: его файловые инструменты не могут изменять папку. Доступная для записи папка внутри папки только для чтения также становится доступной только для чтения. Команды оболочки блокируются только там, где работает песочница Claude Code (для Linux требуются bubblewrap и socat), и только в пределах этой песочницы: храните папки только для чтения отдельно от папок с разрешением на запись и используйте права доступа операционной системы там, где папка не должна изменяться. Песочница не охватывает пути со знаками * ? [ ] ( ) { } | + или двойными кавычками. Указывайте каждую папку по её реальному пути: команды оболочки могут не блокироваться в папке, заданной через символическую ссылку. Не действует на хостах Windows, а также на хостах с собственными управляемыми настройками Claude Code, если в них не задано parentSettingsBehavior to merge. Не охватываются: серверы MCP, хуки, терминал, команды в sandbox.excludedCommands и рабочие деревья git, которые Claude Desktop и Claude Code по-прежнему создают внутри папки.",
      "In SSH sessions (earlier versions ignore the mode on the host), read-only is enforced by Claude Code's own permission rules: its file tools cannot modify the folder. A writable folder inside a read-only one is read-only too. Shell commands are stopped only where Claude Code's sandbox runs (Linux needs bubblewrap and socat), and only as far as that sandbox goes: keep read-only folders outside writable ones, and use the operating system's permissions where a folder must not change. The sandbox does not cover a path with * ? [ ] ( ) { } | + or a double quote. List each folder by its real path: shell commands may not be stopped in a folder listed through a link. Not enforced on Windows hosts, nor on a host with Claude Code managed settings of its own unless they set parentSettingsBehavior to merge. Not covered: MCP servers, hooks, the terminal, commands in sandbox.excludedCommands, and git worktrees, which Claude Desktop and Claude Code still create inside the folder.": "В сессиях SSH (более ранние версии игнорируют режим на хосте) режим только для чтения обеспечивается собственными правилами разрешений Claude Code: его файловые инструменты не могут изменять папку. Доступная для записи папка внутри папки только для чтения также становится доступной только для чтения. Команды оболочки блокируются только там, где работает песочница Claude Code (для Linux требуются bubblewrap и socat), и только в пределах этой песочницы: храните папки только для чтения отдельно от папок с разрешением на запись и используйте права доступа операционной системы там, где папка не должна изменяться. Песочница не охватывает пути со знаками * ? [ ] ( ) { } | + или двойными кавычками. Указывайте каждую папку по её реальному пути: команды оболочки могут не блокироваться в папке, заданной через символическую ссылку. Не действует на хостах Windows, а также на хостах с собственными управляемыми настройками Claude Code, если в них не задано parentSettingsBehavior to merge. Не охватываются: серверы MCP, хуки, терминал, команды в sandbox.excludedCommands и рабочие деревья git, которые Claude Desktop и Claude Code по-прежнему создают внутри папки.",
      "A read-only folder that contains Claude’s own data directory (for example the home folder; over SSH, ~/.claude on the host) is enforced in Cowork only. Configure narrower folders for Code coverage. Over SSH, keep a Claude Code config folder moved by CLAUDE_CONFIG_DIR outside read-only folders.": "Папка «только для чтения», содержащая собственный каталог данных Claude (например, домашнюю папку; по SSH — ~/.claude на хосте), ограничивается только в Cowork. Для сессий Code настраивайте более узкие каталоги. По SSH сохраняйте папку конфигурации Claude Code, перенесённую с помощью CLAUDE_CONFIG_DIR, вне папок только для чтения.",
      "A read-only folder that contains Claude's own data directory (for example the home folder; over SSH, ~/.claude on the host) is enforced in Cowork only. Configure narrower folders for Code coverage. Over SSH, keep a Claude Code config folder moved by CLAUDE_CONFIG_DIR outside read-only folders.": "Папка «только для чтения», содержащая собственный каталог данных Claude (например, домашнюю папку; по SSH — ~/.claude на хосте), ограничивается только в Cowork. Для сессий Code настраивайте более узкие каталоги. По SSH сохраняйте папку конфигурации Claude Code, перенесённую с помощью CLAUDE_CONFIG_DIR, вне папок только для чтения."
    }
  }
];

for (const nc of newCards) {
  const existingIdx = context.cards.findIndex(c => c.id === nc.id);
  if (existingIdx >= 0) {
    context.cards[existingIdx] = nc;
  } else {
    context.cards.push(nc);
  }
}

fs.writeFileSync(completePath, JSON.stringify(complete, null, 2) + '\n', 'utf8');
fs.writeFileSync(contextPath, JSON.stringify(context, null, 2) + '\n', 'utf8');

console.log(`Обновлено для батча 3: complete_ui_ru.json (${Object.keys(complete).length} фраз), context_fragments_ru.json (${context.cards.length} карточек).`);
