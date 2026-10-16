const fs = require('fs');
const path = require('path');

const completePath = path.join(__dirname, '..', 'src', 'complete_ui_ru.json');
let complete = {};
if (fs.existsSync(completePath)) {
  complete = JSON.parse(fs.readFileSync(completePath, 'utf8'));
}

// 1. Строки из таблицы пользователя и со скриншотов
const manualEntries = {
  // Настройки и скриншоты
  "Claude.ai data import": "Импорт данных из Claude.ai",
  "Allow persistent tool approvals": "Разрешить постоянные подтверждения инструментов",
  "Allow user-added MCP servers": "Разрешить серверы MCP, добавленные пользователями",
  "Allowed plugin MCP servers": "Разрешённые серверы MCP из плагинов",
  "Allow desktop extensions": "Разрешить расширения приложения",
  "Enable import": "Включить импорт",
  "Enable session export": "Включить экспорт сессий",
  "Import prompt banner": "Баннер с предложением импорта",
  "Allow for this task": "Разрешить для этой задачи",
  "Allow for all tasks": "Разрешить для всех задач",
  "Allow for all scheduled runs": "Разрешить для всех запланированных запусков",
  "Allow for N days": "Разрешить на N дней",
  "Approval policy per built-in tool or argument-scoped rule such as Bash(curl *). “ask” requires user approval before each matching call; “allow” is the default.": "Политика подтверждения для встроенного инструмента или правила по аргументам, например Bash(curl *). Значение «ask» требует подтверждения перед каждым подходящим вызовом; «allow» используется по умолчанию.",
  "Built-in tools, or argument-scoped permission rules such as Read(//**/.env), denied in Cowork and Code.": "Встроенные инструменты или правила разрешений по аргументам, такие как Read(//**/.env), запрещённые в Cowork и Code.",
  "Offer 1M-context variant": "Предлагать вариант с контекстом 1M",
  "Tier alias": "Псевдоним уровня",
  "Default for tier": "По умолчанию для уровня",
  "Auto-populate the model picker from the provider's model-list endpoint at launch. For gateway and Anthropic providers, a config that doesn't set this key skips discovery automatically when the model list below already makes it unnecessary; the toggle here only sets it explicitly on or off. Turn off if the endpoint isn't reachable from your network, or to use a fixed list. When off, the model list below is required and must use full model IDs (aliases like sonnet/opus are resolved via discovery).": "Автоматически заполнять список моделей из эндпоинта со списком моделей провайдера при запуске. Для шлюза и провайдеров Anthropic конфигурация, в которой этот ключ не задан, автоматически пропускает обнаружение, если приведённый ниже список моделей уже делает его излишним; переключатель здесь лишь явно включает или выключает его. Отключите, если эндпоинт недоступен из вашей сети, или чтобы использовать фиксированный список. При отключении список моделей ниже становится обязательным и должен содержать полные ID моделей (псевдонимы, такие как sonnet/opus, определяются через обнаружение).",
  "MCP servers": "Серверы MCP",
  "Org-pushed MCP servers: remote (HTTP/SSE) or local (stdio command). May embed bearer tokens.": "Серверы MCP, предоставленные организацией: удалённые (HTTP/SSE) или локальные (команда stdio). Могут содержать токены bearer.",
  "Offer the persistent “Always allow” approval options for MCP tools. Disable to keep tool approvals per-call or session-scoped only.": "Предлагать постоянное подтверждение «Всегда разрешать» для инструментов MCP. Отключите, чтобы подтверждения действовали только на один вызов или в пределах сессии.",
  "How many days a scheduled task may reuse a lasting MCP-tool approval before it asks again. 0 removes the lasting option.": "Сколько дней запланированная задача может повторно использовать постоянное разрешение инструмента MCP, прежде чем запросить его снова. Значение 0 отключает постоянное разрешение.",
  "days": "дн.",
  "Local stdio servers added via the Developer settings. Remote servers come from the managed list above or organization plugins.": "Локальные серверы stdio добавляются в настройках разработчика. Удалённые серверы берутся из управляемого списка выше или из плагинов организации.",
  "Servers plugins may connect in sessions, beyond the managed list above and organization plugins. An empty list allows none; unset keeps today’s rules.": "Серверы, к которым плагины могут подключаться в сессиях, помимо управляемого списка выше и плагинов организации. Пустой список запрещает все; если не задано, сохраняются текущие правила.",
  "Remote servers plugins may not connect, even if the allowed list admits them; in Code sessions, configuration-file servers too. Unset or empty blocks none.": "Удалённые серверы, к которым плагинам запрещено подключаться, даже если они есть в списке разрешённых; в сессиях Code это также относится к серверам из конфигурационных файлов. Если не задано или пусто, ничего не блокируется.",
  "Per-call timeout for MCP tool calls, in seconds. Default 180 (3 minutes).": "Тайм-аут на один вызов инструмента MCP в секундах. По умолчанию 180 (3 минуты).",
  ".dxt and .mcpb installs.": "установки файлов .dxt и .mcpb.",
  "is a separate switch.": "является отдельным переключателем.",
  "Copy this computer’s earlier third-party sessions into the app once, in the background. Independent of": "Скопировать предыдущие сторонние сессии с этого компьютера в приложение один раз в фоновом режиме. Независимо от параметра",
  ": always; needs": ": всегда; требуется",
  "or a sign-in import.": "или импорт при входе.",
  ": if": ": если",
  "finds earlier Claude sessions.": "находит предыдущие сессии Claude.",
  "Managed MCP servers": "Управляемые серверы MCP",
  "Add server": "Добавить сервер",
  "Scheduled-task tool approval lifetime": "Срок действия разрешения инструментов для запланированных задач",
  "Blocked plugin MCP servers": "Заблокированные серверы MCP из плагинов",
  "MCP tool call timeout": "Тайм-аут вызова инструмента MCP",
  "not listed": "не указанные в списке",
  "permission rule": "правило разрешений",
  "managed-settings source": "источник управляемых настроек",
  "Shown in the model picker. Leave blank to auto-format from the ID.": "Отображается в списке выбора моделей. Оставьте пустым для автоформатирования из ID.",
  "Adds a 1M-context variant of this model to the picker. Set only if the deployment accepts 1M-token context for it.": "Добавляет вариант этой модели с контекстом 1M в список выбора. Включайте, только если развёртывание поддерживает контекст 1M токенов.",
  "Which Claude tier this model stands in for. Pins the bare alias (e.g. ‘opus’) and, for opus/fable, the refusal fallback.": "Какой уровень Claude представляет эта модель. Закрепляет базовый псевдоним (например, «opus») и, для opus/fable, запасной вариант при отказе.",
  "Highest effort level offered for this model; higher levels are hidden and never requested by Claude Desktop. An unrecognized value caps the model at low.": "Максимальный уровень рассуждений, доступный для этой модели; более высокие уровни скрываются и никогда не запрашиваются Claude Desktop. Нераспознанное значение ограничивает модель низким уровнем.",
  "Model ID": "ID модели",
  "Display name": "Отображаемое имя",
  "Developer Mode": "Режим разработчика",
  "Structured format for bootstrap remote servers and non-MDM file deployments.": "Структурированный формат для начальной настройки удалённых серверов и развёртывания файлов без MDM.",
  "Copy to clipboard (redacted)": "Копировать в буфер обмена (без конфиденциальных данных)",
  "Schema only — defines available policies for Intune / Group Policy. Values are configured in your management console.": "Только схема — определяет доступные политики для Intune / групповой политики. Значения настраиваются в консоли управления.",
  "Defines available settings for Jamf / ProfileCreator and similar macOS tools.": "Определяет доступные параметры для Jamf / ProfileCreator и аналогичных инструментов macOS.",
  "Color red command": "Команда красного цвета",
  "Plugin reload": "Перезагрузка плагина",
  "Ultracode effort mode (fork)": "Режим рассуждений Ultracode (fork)",
  "Ultracode effort mode": "Режим рассуждений Ultracode",
  "Context 0": "Контекст 0",
  "Export": "Экспорт",
  "Export traces": "Экспорт трассировок",
  "Add model": "Добавить модель",
  "Models": "Модели",
  "Scope (optional)": "Область действия (необязательно)",
  "Add policy": "Добавить политику",
  "Built-in tool policy": "Политика встроенных инструментов",
  "Disabled built-in tools": "Отключенные встроенные инструменты",
  "Enable tool search": "Включить поиск инструментов",
  "Download tool schemas on demand": "Загружать схемы инструментов по требованию",
  "Gateway authentication scheme": "Схема аутентификации шлюза",
  "Gateway API key": "API-ключ шлюза",
  "Artifact preview iframe origin": "Origin для iframe предпросмотра артефактов",
  "Prompt is too long · automatic compaction failed:": "Промпт слишком длинный · автоматическое сжатие завершилось ошибкой:",
  "Claude will keep these in mind for this and any of your associated accounts across Cowork tasks within <aupLink>Anthropic’s guidelines</aupLink>. <learnMoreLink>Learn more</learnMoreLink>": "Claude будет учитывать это для текущего и всех связанных аккаунтов в задачах Cowork в соответствии с <aupLink>правилами Anthropic</aupLink>. <learnMoreLink>Подробнее</learnMoreLink>",
  "{n, plural, one {a background {noun}} other {# background {nouns}}}": "{n, plural, one {# фоновый {noun}} few {# фоновых {nouns}} other {# фоновых {nouns}}}",

  // Технические токены, сохраняющие своё значение
  "bearer": "bearer",
  "x-api-key": "x-api-key",
  "managed-settings": "managed-settings",
  "Ctrl": "Ctrl",
  ".mobileconfig": ".mobileconfig",
  ".reg": ".reg",
  ".json": ".json",
  ".txt": ".txt",
  ".zip": ".zip",
  ".plist": ".plist",
  "claude-russification": "claude-russification",
  "santoxas-1/claude-russification": "santoxas-1/claude-russification",
  "ClaudeDesktop": "ClaudeDesktop",
  "main": "main",
  "Gemini 3.8 Flash (google-antigravity)": "Gemini 3.8 Flash (google-antigravity)",
  "claude-opus-4-8-p01t": "claude-opus-4-8-p01t",
  "claude-opus-4-8-p027": "claude-opus-4-8-p027",
  "claude-opus-4-8-p00d": "claude-opus-4-8-p00d",
  "claude-opus-4-8-p094": "claude-opus-4-8-p094",
  "claude-opus-4-8-p07y": "claude-opus-4-8-p07y",
  "claude-opus-4-8-p02e": "claude-opus-4-8-p02e",
  "claude-opus-4-8-p05n": "claude-opus-4-8-p05n",
  "claude-opus-4-8-p09u": "claude-opus-4-8-p09u",
  "claude-opus-4-8-p07x": "claude-opus-4-8-p07x",
  "claude-opus-4-8-p062": "claude-opus-4-8-p062",
  "claude-opus-4-8-p013": "claude-opus-4-8-p013",
  "claude-opus-4-8-p07i": "claude-opus-4-8-p07i"
};

for (const [k, v] of Object.entries(manualEntries)) {
  complete[k] = v;
}

// 2. Строки из candidate_dev_keys.json
const candPath = path.join(__dirname, '..', 'candidate_dev_keys.json');
if (fs.existsSync(candPath)) {
  const cands = JSON.parse(fs.readFileSync(candPath, 'utf8'));

  // Словарь переводов для известных ключей из candidate_dev_keys.
  // ВАЖНО: ICU-аргументы ({source}) и rich-text теги (<link>…</link>) должны сохраняться 1:1,
  // иначе FormatJS не отрисует ссылку/жирный текст. Сборка проверяет это (scripts/build.cjs).
  const devTranslations = {
    "ClaudeCodeProcessWrapperEnabledHint": "Запуск Claude Code через программу запуска в управляемых настройках (processWrapper)",
    "GB7r/rXYPV": "<bold>{source}</bold> отсутствует в списке разрешённых каталогов плагинов вашей организации (<code>strictKnownMarketplaces</code>). Владелец может изменить список в разделе <link>Claude Code → Управляемые настройки</link>.",
    "I1CjP5zL/a": "Не удалось проверить управляемые настройки Claude Code вашей организации, поэтому каталог плагинов не был добавлен. Повторите попытку чуть позже.",
    "SdwRDELoue": "Не удалось применить управляемые настройки удалённого хоста, либо они не допускают установленную там версию. В подробностях указано, что нужно изменить. Если вы не администрируете этот хост, отправьте подробности его администратору.",
    "Wtwl4aDBYy": "Чтобы задать значения по умолчанию для отдельных ролей, перейдите в раздел <rolesLink>Роли</rolesLink>. Значения для ролей имеют приоритет над значением по умолчанию для организации. Чтобы управлять моделями Claude Code по умолчанию, перейдите в <managedSettingsLink>Управляемые настройки</managedSettingsLink>.",
    "5rU3Ct9wHA": "Claude Code Desktop учитывает <link>управляемые настройки</link> вашей организации и любые управляемые настройки, развёрнутые через MDM, — так же, как Claude Code в CLI и IDE.",
    "InfBedrockBearerHint": "Статический токен bearer для аутентификации в Amazon Bedrock",
    "InfBedrockProfileHint": "Имя профиля AWS для доступа к Amazon Bedrock",
    "InfFoundryApiKeyHint": "Ключ API для подключения к шлюзу Foundry",
    "InfGatewayApiKeyHint": "Ключ API для доступа к настроенному шлюзу моделей",
    "InfGatewayOidcAuthFlow": "Аутентификация через провайдер единого входа OIDC шлюза",
    "B6i3SyZAU2": "Обновление подписанных метаданных каталога моделей",
    "+Vug/ETTGA": "Имя инструмента MCP, возвращаемое сервером",
    "20oPR1PTqH": "Имя сервера MCP, поставляемого плагином",
    "MW4a5sB6yS": "Административная политика для серверов MCP из плагинов.",
    "A9CS9rmFLa": "Не удалось сохранить ограничение разрешений для инструмента. Изменение отменено.",
    "5j1YMdfB5n": "Команда запуска Claude Code длиннее, чем разрешено этим компьютером. Начните новую сессию, чтобы очистить сохранённые подтверждения. Если это не помогло, отключите неиспользуемые коннекторы.",
    "OtlpCollectorAuthNoBearer": "Настроенные учётные данные не передаются как токен bearer, поэтому телеметрия будет экспортироваться без них. Вместо этого используйте вспомогательный скрипт заголовков.",
    "eW1UlMFTJB": "Также экспортировать трассировки OpenTelemetry из задач Cowork и сессий Code. Используется трассировка сессий Claude Code.",
    "yUkLJgryTV": "Настройка доступа к сторонним моделям → Экспорт → Конфигурация JSON. В Windows это единственный способ."
  };

  for (const [id, translation] of Object.entries(devTranslations)) {
    if (cands[id]) {
      const enText = cands[id];
      if (typeof enText === 'string' && enText.trim().length > 0) {
        complete[enText.trim()] = translation;
      }
    }
  }
}

fs.writeFileSync(completePath, JSON.stringify(complete, null, 2) + '\n', 'utf8');
console.log(`Обновлён complete_ui_ru.json: всего ${Object.keys(complete).length} записей.`);
