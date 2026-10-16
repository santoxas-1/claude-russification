const fs = require('fs');
const path = require('path');
const vm = require('vm');

const distCode = fs.readFileSync(path.join(__dirname, 'dist', 'i18n-ru.js'), 'utf8');

// Эмулируем минимальное DOM-окружение для тестирования функций локализации
class FakeNode {
  constructor(nodeType, value = '') {
    this.nodeType = nodeType;
    this.nodeValue = value;
    this.textContent = value;
    this.parentElement = null;
    this.attributes = {};
    this.isConnected = true;
    this.style = {};
    this.tagName = nodeType === 1 ? 'DIV' : undefined;
    this.classList = [];
    this.classList.contains = (c) => this.classList.includes(c);
  }
  addEventListener() {}
  appendChild(child) { child.parentElement = this; return child; }
  getAttribute(name) { return this.attributes[name] || null; }
  setAttribute(name, val) { this.attributes[name] = val; }
  hasAttribute(name) { return name in this.attributes; }
  closest(selector) {
    let cur = this;
    while (cur) {
      if (cur.matches && cur.matches(selector)) return cur;
      cur = cur.parentElement;
    }
    return null;
  }
}

// Создаем карточку с маркерами
function makeCard(markers, text, signatures = []) {
  const card = new FakeNode(1);
  card.attributes['class'] = 'setup-card';
  card.textContent = markers.join(' ') + ' ' + signatures.join(' ') + ' ' + text;
  card.matches = (sel) => sel.includes('.setup-card');

  const textNode = new FakeNode(3, text);
  textNode.parentElement = card;
  return { card, textNode };
}

console.log('Тестирование контекстного перевода справок со скриншотов...');

// Загружаем dist/i18n-ru.js в песочницу
const sandbox = {
  window: {},
  document: {
    documentElement: new FakeNode(1),
    body: new FakeNode(1),
    head: new FakeNode(1),
    addEventListener: () => {},
    getElementById: (id) => new FakeNode(1),
    createElement: () => new FakeNode(1),
    querySelector: () => null,
    querySelectorAll: () => []
  },
  Node: { ELEMENT_NODE: 1, TEXT_NODE: 3 },
  console: { log: () => {}, warn: () => {}, error: () => {} },
  setTimeout: () => {},
  setInterval: () => {},
  MutationObserver: class { observe() {} }
};
vm.createContext(sandbox);

// Извлекаем внутренние функции через обертку для тестирования
const testCode = distCode.replace(
  /\n\s*translateNode\(document\.body/g,
  '\n  window.__test__ = { translateString, translateContextFragment, DICT, FORMATJS_MAP, CONTEXT_FRAGMENTS };\n  translateNode(document.body'
);

vm.runInContext(testCode, sandbox);
const { translateString, DICT, CONTEXT_FRAGMENTS } = sandbox.window.__test__;

// 1. Проверка карточки 1 (Scheduled Task Approval Lifetime)
const card1 = makeCard(
  ['Allow for all scheduled runs', 'mcpPersistentAlwaysAllowEnabled'],
  'On a scheduled task, the approval prompt for an MCP tool can offer a lasting approval, so later runs use that tool without asking: '
);
const tr1 = translateString(card1.textNode.nodeValue, card1.textNode);
console.log('Скриншот 1 (абзац 1):', tr1.slice(0, 60) + '...');
if (!tr1.includes('задаче') && !tr1.includes('запланированной')) throw new Error('Скриншот 1 не переведен');

// 2. Проверка карточки 4 (Stream Idle Timeout)
const card4 = makeCard(
  ['CLAUDE_STREAM_IDLE_TIMEOUT_MS'],
  'Raises how long Cowork, Chat and Code sessions wait for the next model event on an open streaming response (Claude Code\'s '
);
const tr4 = translateString(card4.textNode.nodeValue, card4.textNode);
console.log('Скриншот 4 (тайм-аут):', tr4.slice(0, 60) + '...');
if (!tr4.includes('Увеличивает время ожидания')) throw new Error('Скриншот 4 не переведен');

// 3. Проверка карточки 5 (Gateway Mode)
const card5 = makeCard(
  ['CLAUDE_CODE_USE_GATEWAY'],
  'Set this to '
);
const tr5 = translateString(card5.textNode.nodeValue, card5.textNode);
console.log('Скриншот 5 (режим шлюза):', tr5);
if (!tr5.includes('Установите')) throw new Error('Скриншот 5 не переведен');

// 4. Проверка карточки 7 (1M tokens)
const card7 = makeCard(
  ['1M-token context window', 'inferenceModels'],
  'Every model that offers a 1M-token context window shows one option in the model picker, and sessions on it request 1M from your provider. A model offers 1M when its '
);
const tr7 = translateString(card7.textNode.nodeValue, card7.textNode);
console.log('Скриншот 7 (1M контекст):', tr7.slice(0, 60) + '...');
if (!tr7.includes('Каждая модель')) throw new Error('Скриншот 7 не переведен');

// 5. Проверка карточки 11 (Managed MCP Servers)
const card11 = makeCard(
  ['toolPolicy', 'managedMcpServers'],
  'toolPolicy locks the per-tool approval state, keyed by tool name: ',
  ['OAuth', 'wildcard']
);
const tr11 = translateString(card11.textNode.nodeValue, card11.textNode);
console.log('Скриншот 11 (MCP серверы):', tr11.slice(0, 60) + '...');
if (!tr11.includes('Параметр toolPolicy фиксирует')) throw new Error('Скриншот 11 не переведен');

// 5b. Новые скриншоты (пачка 2):
// Скриншот 13: Авто-импорт сторонних сессий
const card13 = makeCard(
  ['Under device-delivered configuration', 'hosted configuration'],
  'Under device-delivered configuration (device management, a configuration file or a bootstrap URL) this runs only when set to ',
  ['allowedPluginMarketplaces', 'userPluginUploadsEnabled']
);
const tr13 = translateString(card13.textNode.nodeValue, card13.textNode);
console.log('Скриншот 13 (импорт сторонних):', tr13.slice(0, 60) + '...');
if (!tr13.includes('конфигурации, доставленной на устройство')) throw new Error('Скриншот 13 не переведен');

// Скриншот 26: Список организаций для импорта
const card26 = makeCard(
  ['A list of Claude.ai organization IDs (UUIDs)', 'desktop_claude_ai_import'],
  'A list of Claude.ai organization IDs (UUIDs). When set, users can import only by signing in to Claude.ai, and only from an organization on the list: a sign-in to any other organization, or to a personal account, is refused before anything is downloaded. Importing from a file and from earlier sessions on this computer is turned off. The list narrows ',
  ['otlpDesktopLogLevel', 'automatic3pImport']
);
const tr26 = translateString(card26.textNode.nodeValue, card26.textNode);
console.log('Скриншот 26 (список UUID):', tr26.slice(0, 60) + '...');
if (!tr26.includes('идентификаторов организаций')) throw new Error('Скриншот 26 не переведен');

// Скриншот 17: Базовые данные телеметрии
const card17 = makeCard(
  ['crash dumps', 'Reports carry a random install ID'],
  ' (each an unfiltered copy of part of the app’s memory). Reports carry a random install ID and an organization ID. The organization ID is the one you set, one the app takes from your Anthropic sign-in or derives from your connection settings, or a placeholder shared with other unconfigured deployments. Reports can also include a summary of your settings, the host names of addresses you configured, text you set for display (such as the display name, subtitle, and banner text and link), and a one-way digest of a session ID.',
  ['organization ID', 'session ID']
);
const tr17 = translateString(card17.textNode.nodeValue, card17.textNode);
console.log('Скриншот 17 (дампы телеметрии):', tr17.slice(0, 60) + '...');
if (!tr17.includes('неотфильтрованную копию')) throw new Error('Скриншот 17 не переведен');

// Скриншот 16: Динамические правила Item 1 и Entry 1
const trItem1 = translateString('Item 1');
console.log('Скриншот 16 (Item 1):', trItem1);
if (trItem1 !== 'Элемент 1') throw new Error('Item 1 не переведен: ' + trItem1);

const trEntryErr = translateString('Entry 1: Invalid input: expected string, received undefined');
console.log('Скриншот 16 (ошибка Entry 1):', trEntryErr);
if (!trEntryErr.includes('Запись 1: Недопустимый ввод')) throw new Error('Ошибка Entry 1 не переведена: ' + trEntryErr);

// Скриншот 34-35: Режим доступа (Access mode)
const cardAccess = makeCard(
  ['Read-only folders can be viewed and searched but not modified in Cowork', 'In SSH sessions'],
  'Read-only folders can be viewed and searched but not modified in Cowork (by Claude or via the UI). Bash runs in Cowork’s isolated workspace where the folder is mounted read-only at the OS level; file-tool writes (Edit, Write) are blocked in-process by Claude Desktop.',
  ['sandbox.excludedCommands', 'CLAUDE_CONFIG_DIR']
);
const trAccess = translateString(cardAccess.textNode.nodeValue, cardAccess.textNode);
console.log('Скриншот 34-35 (Access mode):', trAccess.slice(0, 60) + '...');
if (!trAccess.includes('только для чтения')) throw new Error('Скриншот 34-35 не переведен');

// Скриншот 49: Политика встроенных инструментов (абзац 2)
const card49 = makeCard(
  ['disabledBuiltinTools', 'parentSettingsBehavior'],
  ' prompts in Cowork, Chat and Code sessions. Calls that Cowork and Chat always refuse are still refused without a prompt: paths outside the session\'s connected folders (in Chat, outside its scratch directory and its project\'s folders) and protected or sensitive files inside them. A scheduled task in Cowork waits at the prompt, which appears in the task\'s session and, when that session is not in view, as a desktop notification. Code side chats cannot prompt, so they block matching calls. An unusable entry is dropped and recorded as a configuration error; a value other than ',
  ['prompts in Cowork, Chat and Code sessions', 'Code side chats cannot prompt']
);
const tr49 = translateString(card49.textNode.nodeValue, card49.textNode);
console.log('Скриншот 49 (политика инструментов):', tr49.slice(0, 60) + '...');
if (!tr49.includes('запрашивает подтверждение')) throw new Error('Скриншот 49 не переведен');

// 6. Проверка прямых подписей (DICT)
const testDictKeys = [
  'Allow persistent tool approvals',
  'Allow user-added MCP servers',
  'Allowed plugin MCP servers',
  'Allow desktop extensions',
  'Enable import',
  'Enable session export',
  'Import prompt banner',
  'Allow for this task',
  'Allow for all tasks',
  'Allow for all scheduled runs',
  'Offer 1M-context variant',
  'Tier alias',
  'Default for tier',
  'Structured format for bootstrap remote servers and non-MDM file deployments.',
  'Copy to clipboard (redacted)',
  'Schema only — defines available policies for Intune / Group Policy. Values are configured in your management console.',
  'Defines available settings for Jamf / ProfileCreator and similar macOS tools.',
  'Export',
  'Automatically import earlier third-party sessions',
  'Organizations users may import from',
  'Server URL pattern',
  'Invalid input: expected string, received undefined',
  'off',
  'detect',
  'Faster',
  'Smarter',
  'Extra',
  'Complex, detailed work',
  'The hardest problems. Takes longest.',
  'Balanced for everyday work',
  'Light, casual tasks',
  'Quick replies to simple questions',
  'low',
  'max',
  'ask',
  'Policy',
  'Pre-select on new task',
  'Access mode',
  'value',
  'Always answer in British English. Never include customer account numbers in a response.',
  'Automatic (the build’s default)',
  'System OpenSSH client',
  'Built-in SSH library',
  'server-name',
  'tool name',
  'blocked',
  'allow'
];

for (const k of testDictKeys) {
  if (!DICT[k]) throw new Error(`Ключ отсутствует в DICT: "${k}"`);
  console.log(`[OK] DICT["${k.slice(0, 30)}..."] -> "${DICT[k].slice(0, 30)}..."`);
}

// 7. Проверка сохранения технических значений
const protectedKeys = [
  'bearer',
  'x-api-key',
  'managed-settings',
  'Ctrl',
  '.mobileconfig',
  '.reg',
  '.json',
  '.txt',
  '.zip',
  '.plist',
  'claude-opus-4-8-p01t'
];

for (const pk of protectedKeys) {
  if (DICT[pk] !== pk) throw new Error(`Технический ключ изменен: "${pk}" -> "${DICT[pk]}"`);
}
console.log('[OK] Все технические токены сохранены без искажений.');

console.log('=== Все 12 скриншотов и ключевые элементы успешно прошли проверку! ===');
