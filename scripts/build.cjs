#!/usr/bin/env node
'use strict';
/**
 * Воспроизводимая сборка русификатора (эквивалент src/build.py на Node.js).
 *
 * Входы (только исходники, переведённый dist никогда не используется как английский источник):
 *   src/baseline_data.json          — DICT и FORMATJS_MAP текущей рабочей версии (baseline)
 *   src/*_ru.py                      — тематические Python-словари (разбираются как литералы)
 *   src/complete_ui_ru.json          — полные фразы EN → RU
 *   src/context_fragments_ru.json    — контекстные фрагменты для карточек справок
 *   src/en-US.original.json          — оригинальный основной каталог приложения
 *   src/native-en-US.original.json   — оригинальный нативный каталог (меню Electron)
 *   src/dynamic-en-US.original.json  — оригинальный динамический каталог (если есть)
 *   src/i18n_runtime.js              — движок с плейсхолдерами __DICT__/__FORMATJS_MAP__/__CONTEXT_FRAGMENTS__
 *
 * Выходы: dist/i18n-ru.js, dist/en-US.json, dist/native-en-US.json, dist/dynamic/en-US.json,
 *         reports/build-manifest.json (счётчики и список потерь, если они есть).
 *
 * Правило приоритета: baseline → Python-словари → complete_ui_ru.json.
 * Защита: сборка завершается ошибкой, если какой-либо русский перевод из baseline
 * заменяется НЕ русским значением или исчезает (см. checkNoLoss).
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const REPORTS = path.join(ROOT, 'reports');

const CHECK_ONLY = process.argv.includes('--check');

function readJSON(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function exists(p) { return fs.existsSync(p); }
function normStr(s) {
  if (typeof s !== 'string') return s;
  return s.replace(/’/g, "'").replace(/‘/g, "'").replace(/“/g, '"').replace(/”/g, '"').replace(/ /g, ' ').trim();
}
const hasCyrillic = (s) => typeof s === 'string' && /[А-Яа-яЁё]/.test(s);

/**
 * Разбор Python-словаря вида NAME = { "k": "v", ... } как JSON-подобного литерала.
 * Поддерживаются только строковые ключи/значения (так устроены словари проекта).
 */
function parsePythonDict(file, varName) {
  const text = fs.readFileSync(file, 'utf8');
  const start = text.indexOf(varName + ' = {');
  if (start < 0) throw new Error(`В ${path.basename(file)} не найден ${varName}`);
  let i = text.indexOf('{', start);
  const begin = i;
  let depth = 0, inStr = false, quote = '', esc = false, end = -1;
  // Собираем литерал посимвольно, выбрасывая комментарии `#` вне строк (vm не понимает Python-комментарии)
  let cleaned = '';
  for (; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      cleaned += ch;
      if (esc) { esc = false; continue; }
      if (ch === '\\') { esc = true; continue; }
      if (ch === quote) inStr = false;
      continue;
    }
    if (ch === '#') { while (i < text.length && text[i] !== '\n') i++; cleaned += '\n'; continue; }
    if (ch === '"' || ch === "'") { inStr = true; quote = ch; cleaned += ch; continue; }
    cleaned += ch;
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end < 0 || begin < 0) throw new Error(`Не найден конец словаря ${varName} в ${path.basename(file)}`);
  // Python-литералы → JS: True/False/None; строки остаются как есть
  const js = cleaned.replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false').replace(/\bNone\b/g, 'null');
  const obj = vm.runInNewContext('(' + js + ')', {}, { timeout: 5000 });
  const out = {};
  for (const [k, v] of Object.entries(obj)) if (typeof k === 'string' && typeof v === 'string') out[k] = v;
  return out;
}

function loadVocab() {
  const file = path.join(SRC, 'vocab.py');
  if (!exists(file)) return [];
  return ['VOCAB_VERBS', 'VOCAB_NOUNS', 'VOCAB_ADJ'].map((n) => parsePythonDict(file, n));
}

function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s; }
function titleCase(s) { return s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase()); }

function compileMaster(manifest) {
  const baseline = exists(path.join(SRC, 'baseline_data.json')) ? readJSON(path.join(SRC, 'baseline_data.json')) : { DICT: {}, FORMATJS_MAP: {} };
  const master = { ...baseline.DICT };
  manifest.baselineDict = Object.keys(master).length;
  manifest.baselineFormatjs = Object.keys(baseline.FORMATJS_MAP || {}).length;

  const pyDicts = [
    ['dictionary_ru.py', 'CLAUDE_UI_RU'],
    ['settings_translations.py', 'SETTINGS_RU'],
    ['all_tabs_ru.py', 'ALL_TABS_RU'],
    ['tagged_strings.py', 'TAGGED_RU'],
    ['screenshot_targets_ru.py', 'SCREENSHOT_TARGETS_RU'],
    ['new_screens_ru.py', 'NEW_SCREENS_RU'],
  ];
  const overrides = [];
  for (const [file, name] of pyDicts) {
    const p = path.join(SRC, file);
    if (!exists(p)) continue;
    const d = parsePythonDict(p, name);
    manifest.sources[file] = Object.keys(d).length;
    for (const [k, v] of Object.entries(d)) {
      // Python-словари НЕ перекрывают русский baseline нерусским/пустым значением
      if (hasOwn(master, k) && hasCyrillic(master[k]) && !hasCyrillic(v)) { overrides.push({ source: file, key: k, kept: master[k], rejected: v }); continue; }
      master[k] = v;
    }
  }
  for (const vocab of loadVocab()) {
    for (const [en, ru] of Object.entries(vocab)) {
      if (en.includes(' ') && !hasOwn(master, en)) master[en] = ru;
      if (!hasOwn(master, capitalize(en))) master[capitalize(en)] = capitalize(ru);
      if (!hasOwn(master, titleCase(en))) master[titleCase(en)] = capitalize(ru);
    }
  }
  const completePath = path.join(SRC, 'complete_ui_ru.json');
  if (exists(completePath)) {
    const complete = readJSON(completePath);
    manifest.sources['complete_ui_ru.json'] = Object.keys(complete).length;
    for (const [k, v] of Object.entries(complete)) {
      if (typeof k !== 'string' || typeof v !== 'string') continue;
      master[k] = v;
    }
  }
  // нормализованные ключи
  for (const [k, v] of Object.entries({ ...master })) {
    const nk = normStr(k);
    if (nk && !hasOwn(master, nk)) master[nk] = v;
  }
  manifest.rejectedOverrides = overrides;
  return { master, baseline };
}

function hasOwn(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

function patchCatalog(catalog, master) {
  const patched = { ...catalog };
  const formatjs = {};
  for (const [id, value] of Object.entries(catalog)) {
    if (typeof value !== 'string') continue;
    const t = master[value] ?? master[value.trim()] ?? master[normStr(value)];
    if (t && t !== value) { patched[id] = t; formatjs[id] = t; }
  }
  return { patched, formatjs };
}

/**
 * Намеренные «откаты» перевода: технические значения, которые раньше переводились ошибочно.
 * Каждый пункт — осознанное решение; защита от потерь их пропускает, но фиксирует в манифесте.
 */
const INTENTIONAL_UNTRANSLATED = new Set([
  'managed-settings', // значение поля «источник» (managed-settings source), а не подпись
]);

function checkNoLoss(name, before, after, manifest) {
  const losses = [];
  manifest.intentionalReverts = manifest.intentionalReverts || [];
  for (const [k, v] of Object.entries(before)) {
    if (!hasCyrillic(v)) continue;
    const nv = after[k];
    if (INTENTIONAL_UNTRANSLATED.has(k) && nv === k) { manifest.intentionalReverts.push({ key: k, before: v }); continue; }
    if (nv === undefined) losses.push({ key: k, before: v, after: null });
    else if (!hasCyrillic(nv)) losses.push({ key: k, before: v, after: nv });
  }
  manifest.lossChecks[name] = { checked: Object.keys(before).length, losses: losses.length };
  if (losses.length) {
    manifest.lossDetails[name] = losses.slice(0, 50);
    throw new Error(`[${name}] потеря ${losses.length} русских переводов из baseline (см. reports/build-manifest.json)`);
  }
}

/**
 * Минимальный разбор ICU MessageFormat: возвращает множество АРГУМЕНТОВ ({name}, {n, plural, ...},
 * {kind, select, ...}) и rich-text тегов (<link>), игнорируя текст внутри веток plural/select.
 * Формат: {arg} | {arg, type} | {arg, plural|select|selectordinal, key {msg} key {msg} ...}
 */
function icuArguments(s) {
  const args = new Set();
  function parseMessage(i, stopAtBrace) {
    while (i < s.length) {
      const ch = s[i];
      if (ch === "'" ) { // экранирование ICU: '{' или ''
        const j = s.indexOf("'", i + 1);
        if (j < 0) return s.length;
        i = j + 1; continue;
      }
      if (ch === '}' && stopAtBrace) return i;
      if (ch === '{') { i = parseArgument(i + 1); continue; }
      i++;
    }
    return i;
  }
  function parseArgument(i) {
    // читаем имя аргумента до ',' или '}'
    let name = '';
    while (i < s.length && s[i] !== ',' && s[i] !== '}') name += s[i++];
    name = name.trim();
    if (name) args.add('{' + name + '}');
    if (s[i] === '}') return i + 1;
    i++; // ','
    let type = '';
    while (i < s.length && s[i] !== ',' && s[i] !== '}') type += s[i++];
    type = type.trim();
    if (s[i] === '}') return i + 1;
    i++; // ','
    if (type === 'plural' || type === 'select' || type === 'selectordinal') {
      // ветки: key {message} ... до закрывающей '}' аргумента
      while (i < s.length && s[i] !== '}') {
        while (i < s.length && s[i] !== '{' && s[i] !== '}') i++;
        if (s[i] === '{') { const end = parseMessage(i + 1, true); i = end + 1; }
      }
      return i + 1;
    }
    // прочие типы (number, date, ...) со стилем — пропускаем до '}'
    let depth = 0;
    while (i < s.length) { if (s[i] === '{') depth++; else if (s[i] === '}') { if (depth === 0) return i + 1; depth--; } i++; }
    return i;
  }
  parseMessage(0, false);
  for (const m of s.matchAll(/<\/?([A-Za-z][\w-]*)\s*\/?>/g)) args.add('<' + m[1] + '>');
  return args;
}
const placeholderSet = icuArguments;

function checkPlaceholders(name, original, translated, manifest) {
  const problems = [];
  for (const [id, en] of Object.entries(original)) {
    const ru = translated[id];
    if (typeof en !== 'string' || typeof ru !== 'string' || ru === en) continue;
    const a = placeholderSet(en), b = placeholderSet(ru);
    const missing = [...a].filter((x) => !b.has(x));
    if (missing.length) problems.push({ id, missing, en: en.slice(0, 120), ru: ru.slice(0, 120) });
  }
  manifest.placeholderChecks[name] = { translated: Object.values(translated).filter(hasCyrillic).length, problems: problems.length };
  if (problems.length) manifest.placeholderProblems[name] = problems.slice(0, 100);
  return problems;
}

function main() {
  const manifest = { generatedAt: new Date().toISOString(), sources: {}, lossChecks: {}, lossDetails: {}, placeholderChecks: {}, placeholderProblems: {}, outputs: {} };
  const { master, baseline } = compileMaster(manifest);
  manifest.masterEntries = Object.keys(master).length;

  // 1. Основной каталог
  const enPath = process.env.CLAUDE_EN_CATALOG || path.join(SRC, 'en-US.original.json');
  if (!exists(enPath)) throw new Error('Нет явного английского источника: src/en-US.original.json или CLAUDE_EN_CATALOG');
  const enCatalog = readJSON(enPath);
  const { patched: patchedEn, formatjs } = patchCatalog(enCatalog, master);
  // FORMATJS: baseline (по ID) остаётся, новые совпадения дополняют; русский baseline не теряется
  const formatjsMap = { ...(baseline.FORMATJS_MAP || {}) };
  for (const [id, ru] of Object.entries(formatjs)) {
    if (hasOwn(formatjsMap, id) && hasCyrillic(formatjsMap[id]) && !hasCyrillic(ru)) continue;
    formatjsMap[id] = ru;
  }
  // В каталог тоже переносим baseline-переводы по ID (если в каталоге такой ID есть)
  for (const [id, ru] of Object.entries(formatjsMap)) if (hasOwn(patchedEn, id) && !hasCyrillic(patchedEn[id]) && hasCyrillic(ru)) patchedEn[id] = ru;
  checkNoLoss('FORMATJS_MAP', baseline.FORMATJS_MAP || {}, formatjsMap, manifest);
  checkNoLoss('DICT', baseline.DICT || {}, master, manifest);
  checkPlaceholders('en-US.json', enCatalog, patchedEn, manifest);
  manifest.outputs['en-US.json'] = { ids: Object.keys(patchedEn).length, translated: Object.entries(patchedEn).filter(([id, v]) => v !== enCatalog[id]).length };

  // 2. Нативный каталог
  let patchedNative = null;
  const nativePath = process.env.CLAUDE_NATIVE_EN_CATALOG || path.join(SRC, 'native-en-US.original.json');
  let nativeCatalog = null;
  if (exists(nativePath)) {
    nativeCatalog = readJSON(nativePath);
    patchedNative = patchCatalog(nativeCatalog, master).patched;
    // сохраняем уже существующие русские значения текущего dist/native-en-US.json (если есть) как baseline по ID
    const prev = path.join(DIST, 'native-en-US.json');
    if (exists(prev)) {
      const prevNative = readJSON(prev);
      for (const [id, v] of Object.entries(prevNative)) if (hasCyrillic(v) && !hasCyrillic(patchedNative[id])) patchedNative[id] = v;
      checkNoLoss('native-en-US.json', prevNative, patchedNative, manifest);
    }
    checkPlaceholders('native-en-US.json', nativeCatalog, patchedNative, manifest);
    manifest.outputs['native-en-US.json'] = { ids: Object.keys(patchedNative).length, translated: Object.entries(patchedNative).filter(([id, v]) => v !== nativeCatalog[id]).length };
  }

  // 3. Динамический каталог
  let patchedDynamic = null;
  const dynPath = process.env.CLAUDE_DYNAMIC_EN_CATALOG || path.join(SRC, 'dynamic-en-US.original.json');
  if (exists(dynPath)) {
    const dyn = readJSON(dynPath);
    const DYNAMIC_RU = exists(path.join(SRC, 'dynamic_ru.py')) ? parsePythonDict(path.join(SRC, 'dynamic_ru.py'), 'DYNAMIC_RU') : {};
    patchedDynamic = { ...dyn };
    for (const [id, v] of Object.entries(dyn)) {
      if (hasOwn(DYNAMIC_RU, id)) patchedDynamic[id] = DYNAMIC_RU[id];
      else if (typeof v === 'string') patchedDynamic[id] = master[v] ?? master[normStr(v)] ?? v;
    }
    manifest.outputs['dynamic/en-US.json'] = { ids: Object.keys(patchedDynamic).length, translated: Object.entries(patchedDynamic).filter(([id, v]) => v !== dyn[id]).length };
  } else {
    manifest.outputs['dynamic/en-US.json'] = { skipped: 'нет src/dynamic-en-US.original.json — существующий dist/dynamic/en-US.json не перезаписывается' };
  }

  // 4. Движок
  const contextPath = path.join(SRC, 'context_fragments_ru.json');
  const context = exists(contextPath) ? readJSON(contextPath) : { version: 1, cards: [] };
  if (!context || !Array.isArray(context.cards)) throw new Error('context_fragments_ru.json должен содержать {version, cards: []}');
  for (const card of context.cards) {
    if (!card.id || !card.context || !Array.isArray(card.context.markers) || !card.context.markers.length) throw new Error(`Карточка без id/markers: ${JSON.stringify(card).slice(0, 80)}`);
    if (!card.fragments || typeof card.fragments !== 'object') throw new Error(`Карточка ${card.id} без fragments`);
  }
  manifest.contextCards = context.cards.length;
  manifest.contextFragments = context.cards.reduce((n, c) => n + Object.keys(c.fragments).length, 0);

  let runtime = fs.readFileSync(path.join(SRC, 'i18n_runtime.js'), 'utf8');
  for (const ph of ['__DICT__', '__FORMATJS_MAP__', '__CONTEXT_FRAGMENTS__']) if (!runtime.includes(ph)) throw new Error('В i18n_runtime.js нет плейсхолдера ' + ph);
  // Ключи сортируем для детерминированности (кроме порядка baseline — он тоже стабилен)
  const sortObj = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
  const dictJson = JSON.stringify(sortObj(master), null, 2).replace(/\n/g, '\n  ');
  const fjJson = JSON.stringify(sortObj(formatjsMap), null, 2).replace(/\n/g, '\n  ');
  const ctxJson = JSON.stringify(context, null, 2).replace(/\n/g, '\n  ');
  runtime = runtime.replace('__DICT__', () => dictJson).replace('__FORMATJS_MAP__', () => fjJson).replace('__CONTEXT_FRAGMENTS__', () => ctxJson);
  new vm.Script(runtime, { filename: 'dist/i18n-ru.js' }); // синтаксическая проверка
  manifest.outputs['i18n-ru.js'] = { dict: Object.keys(master).length, formatjs: Object.keys(formatjsMap).length, bytes: Buffer.byteLength(runtime) };

  if (CHECK_ONLY) {
    console.log(JSON.stringify({ ...manifest, lossDetails: undefined, placeholderProblems: undefined }, null, 2));
    console.log('Проверка пройдена (файлы не записаны).');
    return;
  }

  fs.mkdirSync(path.join(DIST, 'dynamic'), { recursive: true });
  fs.mkdirSync(REPORTS, { recursive: true });
  fs.writeFileSync(path.join(DIST, 'i18n-ru.js'), runtime, 'utf8');
  fs.writeFileSync(path.join(DIST, 'en-US.json'), JSON.stringify(patchedEn, null, 2) + '\n', 'utf8');
  if (patchedNative) fs.writeFileSync(path.join(DIST, 'native-en-US.json'), JSON.stringify(patchedNative, null, 2) + '\n', 'utf8');
  if (patchedDynamic) fs.writeFileSync(path.join(DIST, 'dynamic', 'en-US.json'), JSON.stringify(patchedDynamic, null, 2) + '\n', 'utf8');
  fs.writeFileSync(path.join(REPORTS, 'build-manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(JSON.stringify({ master: manifest.masterEntries, formatjs: Object.keys(formatjsMap).length, outputs: manifest.outputs, lossChecks: manifest.lossChecks, placeholderChecks: manifest.placeholderChecks, rejectedOverrides: manifest.rejectedOverrides.length }, null, 2));
  console.log('Сборка завершена.');
}

try { main(); } catch (e) {
  try { fs.mkdirSync(REPORTS, { recursive: true }); } catch {}
  console.error('ОШИБКА СБОРКИ:', e.message);
  process.exit(1);
}
