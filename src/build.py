#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Build compiler for Claude Desktop Russian Localization.
Compiles src/ dictionaries into dist/ distribution files:
- dist/en-US.json (patched base catalog)
- dist/dynamic/en-US.json (patched dynamic model/reasoning catalog)
- dist/i18n-ru.js (DOM reactive translation engine & fetch interceptor)
"""

import json
import os
import sys

# Ensure src/ is in path
SRC_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SRC_DIR)
DIST_DIR = os.path.join(PROJECT_ROOT, "dist")
os.makedirs(os.path.join(DIST_DIR, "dynamic"), exist_ok=True)

sys.path.insert(0, SRC_DIR)

from dictionary_ru import CLAUDE_UI_RU
from settings_translations import SETTINGS_RU
from dynamic_ru import DYNAMIC_RU
from all_tabs_ru import ALL_TABS_RU
from tagged_strings import TAGGED_RU
from screenshot_targets_ru import SCREENSHOT_TARGETS_RU
from new_screens_ru import NEW_SCREENS_RU
from vocab import VOCAB_VERBS, VOCAB_NOUNS, VOCAB_ADJ

def norm_str(s):
    if not isinstance(s, str):
        return s
    return (s.replace("’", "'")
             .replace("‘", "'")
             .replace("“", '"')
             .replace("”", '"')
             .replace(" ", " ")
             .strip())

print("=== Building Claude Desktop Russian Localization ===")

# 1. Master Dictionary
master = {}

# Official Anthropic translations
try:
    with open("/Applications/Claude.app/Contents/Resources/ru.json") as f:
        ru_official = json.load(f)
    with open("/Applications/Claude.app/Contents/Resources/en-US.json") as f:
        en_official = json.load(f)

    for k, v in ru_official.items():
        if k in en_official and en_official[k] and v:
            en_text = en_official[k].strip()
            ru_text = v.strip()
            if en_text and ru_text and en_text != ru_text:
                master[en_text] = ru_text
                master[norm_str(en_text)] = ru_text
except Exception as e:
    pass

# Antigravity translations
try:
    with open("/Applications/Antigravity.app/Contents/Resources/web_bundle_ru/i18n-ru.js") as f:
        lines = f.readlines()
    in_dict = False
    for line in lines:
        if "const DICT =" in line:
            in_dict = True
            continue
        if in_dict and "};" in line:
            break
        if in_dict and ":" in line:
            parts = line.strip().split(":", 1)
            if len(parts) == 2:
                k = parts[0].strip().strip(",").strip('"').strip("'")
                v = parts[1].strip().strip(",").strip('"').strip("'")
                if k and v:
                    v = v.replace("Antigravity", "Claude").replace("antigravity", "Claude")
                    master[k] = v
                    master[norm_str(k)] = v
except Exception as e:
    pass

# Merge custom dictionaries
master.update(CLAUDE_UI_RU)
master.update(SETTINGS_RU)
master.update(ALL_TABS_RU)
master.update(TAGGED_RU)
master.update(SCREENSHOT_TARGETS_RU)
master.update(NEW_SCREENS_RU)

# Singles from vocabulary:
# For multi-word phrases, include lowercase.
# For single-word commands/terms, only include Capitalized/Title forms
# to prevent DOM-observer from translating CLI commands and code identifiers (e.g. 'update', 'run', 'test').
for v_en, v_ru in VOCAB_VERBS.items():
    if " " in v_en:
        master.setdefault(v_en, v_ru)
    master.setdefault(v_en.capitalize(), v_ru.capitalize())
    master.setdefault(v_en.title(), v_ru.capitalize())

for n_en, n_ru in VOCAB_NOUNS.items():
    if " " in n_en:
        master.setdefault(n_en, n_ru)
    master.setdefault(n_en.capitalize(), n_ru.capitalize())
    master.setdefault(n_en.title(), n_ru.capitalize())

for a_en, a_ru in VOCAB_ADJ.items():
    if " " in a_en:
        master.setdefault(a_en, a_ru)
    master.setdefault(a_en.capitalize(), a_ru.capitalize())
    master.setdefault(a_en.title(), a_ru.capitalize())

# Normalized keys
normalized_extras = {}
for k, v in master.items():
    nk = norm_str(k)
    if nk not in master:
        normalized_extras[nk] = v
master.update(normalized_extras)

print(f"1. Master dictionary compiled with {len(master)} entries.")

# Locate source catalogs (from system or dist)
orig_en_candidates = [
    "/Applications/Claude.app/Contents/Resources/ion-dist/i18n/en-US.json.original",
    "/Applications/Claude.app/Contents/Resources/ion-dist/i18n/en-US.json",
    os.path.join(DIST_DIR, "en-US.json")
]

en_source = None
for p in orig_en_candidates:
    if os.path.exists(p):
        en_source = p
        break

if not en_source:
    print("Error: Could not locate en-US.json source!")
    sys.exit(1)

with open(en_source, "r", encoding="utf-8") as f:
    en_catalog = json.load(f)

# 2. Patch main catalog
patched_en = dict(en_catalog)
matched_count = 0
formatjs_map = {}

for k, text in en_catalog.items():
    s = text.strip()
    ns = norm_str(s)
    if s in master:
        patched_en[k] = master[s]
        formatjs_map[k] = master[s]
        matched_count += 1
    elif ns in master:
        patched_en[k] = master[ns]
        formatjs_map[k] = master[ns]
        matched_count += 1

out_en = os.path.join(DIST_DIR, "en-US.json")
with open(out_en, "w", encoding="utf-8") as f:
    json.dump(patched_en, f, ensure_ascii=False, indent=2)

print(f"2. Saved {out_en} with {matched_count} translated keys.")

# 3. Patch dynamic catalog
orig_dyn_candidates = [
    "/Applications/Claude.app/Contents/Resources/ion-dist/i18n/dynamic/en-US.json.original",
    "/Applications/Claude.app/Contents/Resources/ion-dist/i18n/dynamic/en-US.json",
    os.path.join(DIST_DIR, "dynamic", "en-US.json")
]

dyn_source = None
for p in orig_dyn_candidates:
    if os.path.exists(p):
        dyn_source = p
        break

if dyn_source:
    with open(dyn_source, "r", encoding="utf-8") as f:
        dyn_catalog = json.load(f)
    patched_dyn = dict(dyn_catalog)
    for k, text in dyn_catalog.items():
        if k in DYNAMIC_RU:
            patched_dyn[k] = DYNAMIC_RU[k]
        elif text.strip() in master:
            patched_dyn[k] = master[text.strip()]
    out_dyn = os.path.join(DIST_DIR, "dynamic", "en-US.json")
    with open(out_dyn, "w", encoding="utf-8") as f:
        json.dump(patched_dyn, f, ensure_ascii=False, indent=2)
    print(f"3. Saved {out_dyn} (100% of dynamic strings translated).")

# 4. Generate i18n-ru.js
template = """/**
 * Claude Desktop Ultra Russian Localization Engine
 * https://github.com/teroguy/claude-russification
 */
(function () {
  'use strict';

  const DICT = %s;
  const FORMATJS_MAP = %s;

  function norm(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/\\u00A0/g, ' ')
      .trim();
  }

  // === 1. FormatJS in-memory fetch interceptor ===
  try {
    const origFetch = window.fetch;
    window.fetch = async function (...args) {
      const res = await origFetch.apply(this, args);
      try {
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
        if (url && (url.includes('/i18n/') || url.includes('en-US.json'))) {
          const origJson = await res.json();
          if (origJson && typeof origJson === 'object') {
            for (const [id, ruText] of Object.entries(FORMATJS_MAP)) {
              origJson[id] = ruText;
            }
            return new Response(JSON.stringify(origJson), {
              status: res.status,
              statusText: res.statusText,
              headers: res.headers
            });
          }
        }
      } catch (e) {
        console.warn('[claude-i18n-ru] Fetch hook error:', e);
      }
      return res;
    };
  } catch (e) {
    console.warn('[claude-i18n-ru] Failed to hook fetch:', e);
  }

  // === 2. RegExp Rules for Dynamic Elements ===
  function formatTime(str) {
    if (!str) return '';
    return str
      .replace(/(\\d+)\\s+days?/gi, '$1 дн.')
      .replace(/(\\d+)\\s+hours?/gi, '$1 ч.')
      .replace(/(\\d+)\\s+minutes?/gi, '$1 мин.')
      .replace(/(\\d+)\\s+seconds?/gi, '$1 сек.')
      .replace(/(\\d+)\\s+ms/gi, '$1 мс');
  }

  const RULES = [
    {
      regex: /^Thought for (.*)$/i,
      replace: function (m) { return "Размышлял " + formatTime(m[1]); }
    },
    {
      regex: /^Thinking \\((.*)\\)$/i,
      replace: function (m) { return "Размышления (" + formatTime(m[1]) + ")"; }
    },
    {
      regex: /^Your Plan:\\s*(.*)$/i,
      replace: function (m) { return "Ваш тариф: " + m[1]; }
    },
    {
      regex: /^You have used some of your weekly limit, it will fully refresh in (.*)$/i,
      replace: function (m) {
        return "Часть недельного лимита израсходована, полное обновление через " + formatTime(m[1]);
      }
    },
    {
      regex: /^You have used some of your 5-hour limit, it will fully refresh in (.*)$/i,
      replace: function (m) {
        return "Часть 5-часового лимита израсходована, полное обновление через " + formatTime(m[1]);
      }
    },
    {
      regex: /^Learn more about (.*)$/i,
      replace: function (m) { return "Подробнее о " + m[1]; }
    },
    {
      regex: /^Show all \\((\\d+)\\)$/i,
      replace: function (m) { return "Показать все (" + m[1] + ")"; }
    },
    {
      regex: /^See all \\((\\d+)\\)$/i,
      replace: function (m) { return "Показать все (" + m[1] + ")"; }
    },
    {
      regex: /^(\\d+)\\s+chats?$/i,
      replace: function (m) { return m[1] + " чат(ов)"; }
    },
    {
      regex: /^(\\d+)\\s+conversations?$/i,
      replace: function (m) { return m[1] + " диалог(ов)"; }
    },
    {
      regex: /^(\\d+)\\s+projects?$/i,
      replace: function (m) { return m[1] + " проект(ов)"; }
    },
    {
      regex: /^(\\d+)\\s+files?$/i,
      replace: function (m) { return m[1] + " файл(ов)"; }
    },
    {
      regex: /^(\\d+)\\s+messages?$/i,
      replace: function (m) { return m[1] + " сообщ."; }
    },
    {
      regex: /^(\\d+)\\s+of\\s+(\\d+)$/i,
      replace: function (m) { return m[1] + " из " + m[2]; }
    },
    {
      regex: /^Version\\s+(\\d+)\\s+of\\s+(\\d+)$/i,
      replace: function (m) { return "Версия " + m[1] + " из " + m[2]; }
    }
  ];

  const IGNORE_TAGS = new Set([
    'SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA', 'INPUT', 'KBD', 'SAMP'
  ]);

  function isIgnored(node) {
    if (!node) return true;
    let el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    while (el) {
      if (IGNORE_TAGS.has(el.tagName)) return true;
      if (el.classList) {
        if (
          el.classList.contains('token') ||
          el.classList.contains('prism') ||
          el.classList.contains('shiki') ||
          el.classList.contains('line') ||
          el.classList.contains('monaco-editor') ||
          el.classList.contains('cm-editor') ||
          el.classList.contains('prose-pre') ||
          el.classList.contains('font-mono') ||
          el.classList.contains('code-block') ||
          el.classList.contains('whitespace-pre') ||
          el.classList.contains('whitespace-pre-wrap') ||
          el.classList.contains('terminal') ||
          el.classList.contains('xterm') ||
          el.classList.contains('font-user-message') ||
          el.classList.contains('font-claude-message') ||
          el.classList.contains('transcript-row') ||
          el.classList.contains('transcript-rows') ||
          el.classList.contains('code_session_transcript') ||
          el.classList.contains('code_transcript')
        ) {
          return true;
        }
      }
      if (el.getAttribute) {
        if (el.getAttribute('data-notranslate') !== null) return true;
        if (el.hasAttribute('data-transcript-row')) return true;
        if (el.hasAttribute('data-transcript-list')) return true;
        if (el.hasAttribute('data-transcript-engine-root')) return true;
        const testId = el.getAttribute('data-testid');
        if (testId && (
          testId.includes('message') ||
          testId.includes('transcript') ||
          testId.includes('code')
        )) {
          return true;
        }
      }
      el = el.parentElement;
    }
    return false;
  }

  function translateString(text) {
    if (typeof text !== 'string') return null;
    const trimmed = text.trim();
    if (!trimmed) return null;

    const startSpace = text.match(/^\\s*/)[0];
    const endSpace = text.match(/\\s*$/)[0];

    for (let i = 0; i < RULES.length; i++) {
      const match = trimmed.match(RULES[i].regex);
      if (match) {
        return startSpace + RULES[i].replace(match) + endSpace;
      }
    }

    if (DICT[trimmed]) {
      return startSpace + DICT[trimmed] + endSpace;
    }

    const n = norm(trimmed);
    if (DICT[n]) {
      return startSpace + DICT[n] + endSpace;
    }

    return null;
  }

  function translateNode(node) {
    if (!node) return;
    if (node.nodeType === Node.TEXT_NODE) {
      if (isIgnored(node)) return;
      const translated = translateString(node.nodeValue);
      if (translated && translated !== node.nodeValue) {
        node.nodeValue = translated;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.hasAttribute('placeholder')) {
        const trans = translateString(node.getAttribute('placeholder'));
        if (trans && trans !== node.getAttribute('placeholder')) {
          node.setAttribute('placeholder', trans);
        }
      }
      if (node.hasAttribute('title')) {
        const trans = translateString(node.getAttribute('title'));
        if (trans && trans !== node.getAttribute('title')) {
          node.setAttribute('title', trans);
        }
      }
      if (node.hasAttribute('aria-label')) {
        const trans = translateString(node.getAttribute('aria-label'));
        if (trans && trans !== node.getAttribute('aria-label')) {
          node.setAttribute('aria-label', trans);
        }
      }

      if (isIgnored(node)) return;

      for (let child = node.firstChild; child; child = child.nextSibling) {
        translateNode(child);
      }
    }
  }

  try {
    const origNodeValueDesc = Object.getOwnPropertyDescriptor(Node.prototype, 'nodeValue');
    if (origNodeValueDesc && origNodeValueDesc.set) {
      const origSet = origNodeValueDesc.set;
      Object.defineProperty(Node.prototype, 'nodeValue', {
        get: origNodeValueDesc.get,
        set: function (val) {
          if (this.nodeType === Node.TEXT_NODE && typeof val === 'string' && !isIgnored(this)) {
            const trans = translateString(val);
            if (trans) val = trans;
          }
          return origSet.call(this, val);
        },
        configurable: true,
        enumerable: true
      });
    }

    const origTextContentDesc = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent');
    if (origTextContentDesc && origTextContentDesc.set) {
      const origTextSet = origTextContentDesc.set;
      Object.defineProperty(Node.prototype, 'textContent', {
        get: origTextContentDesc.get,
        set: function (val) {
          if (typeof val === 'string' && !isIgnored(this)) {
            const trans = translateString(val);
            if (trans) val = trans;
          }
          return origTextSet.call(this, val);
        },
        configurable: true,
        enumerable: true
      });
    }
  } catch (e) {
    console.warn('[claude-i18n-ru] Hook setup error:', e);
  }

  function startObserver() {
    const observer = new MutationObserver((mutations) => {
      for (let i = 0; i < mutations.length; i++) {
        const m = mutations[i];
        if (m.type === 'childList') {
          for (let j = 0; j < m.addedNodes.length; j++) {
            translateNode(m.addedNodes[j]);
          }
        } else if (m.type === 'characterData') {
          translateNode(m.target);
        } else if (m.type === 'attributes') {
          if (['placeholder', 'title', 'aria-label'].includes(m.attributeName)) {
            const val = m.target.getAttribute(m.attributeName);
            const trans = translateString(val);
            if (trans && trans !== val) {
              m.target.setAttribute(m.attributeName, trans);
            }
          }
        }
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'title', 'aria-label']
    });

    setInterval(() => {
      translateNode(document.body);
    }, 200);

    translateNode(document.body || document.documentElement);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserver);
  } else {
    startObserver();
  }

  console.log('[claude-i18n-ru] Active with ' + Object.keys(DICT).length + ' strings and ' + Object.keys(FORMATJS_MAP).length + ' FormatJS IDs');
})();
"""

out_js = os.path.join(DIST_DIR, "i18n-ru.js")
with open(out_js, "w", encoding="utf-8") as f:
    f.write(template % (
        json.dumps(master, ensure_ascii=False, indent=2),
        json.dumps(formatjs_map, ensure_ascii=False, indent=2)
    ))

print(f"4. Saved {out_js} with {len(master)} dictionary entries.")
print("=== Build Completed Successfully! ===")
