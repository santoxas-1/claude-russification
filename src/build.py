#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Reproducible compiler for the Russian localization distribution.

English catalogs are explicit source inputs.  The checked-in baseline_data.json is
only the existing translation/runtime data; translated dist files are never used
as an English source.
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

SRC_DIR = Path(__file__).resolve().parent
ROOT = SRC_DIR.parent
DIST_DIR = ROOT / "dist"
DYNAMIC_DIST_DIR = DIST_DIR / "dynamic"

sys.path.insert(0, str(SRC_DIR))
from all_tabs_ru import ALL_TABS_RU
from dictionary_ru import CLAUDE_UI_RU
from dynamic_ru import DYNAMIC_RU
from new_screens_ru import NEW_SCREENS_RU
from screenshot_targets_ru import SCREENSHOT_TARGETS_RU
from settings_translations import SETTINGS_RU
from tagged_strings import TAGGED_RU
from vocab import VOCAB_ADJ, VOCAB_NOUNS, VOCAB_VERBS


def norm_str(value):
    if not isinstance(value, str):
        return value
    return (value.replace("’", "'").replace("‘", "'")
            .replace("“", '"').replace("”", '"')
            .replace(" ", " ").strip())


def read_json(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def load_baseline():
    path = SRC_DIR / "baseline_data.json"
    if not path.exists():
        return {}, {}
    data = read_json(path)
    return data.get("DICT", {}), data.get("FORMATJS_MAP", {})


def compile_master():
    master, _ = load_baseline()
    # Baseline entries remain available, then maintained source dictionaries win.
    for dictionary in (CLAUDE_UI_RU, SETTINGS_RU, ALL_TABS_RU, TAGGED_RU,
                       SCREENSHOT_TARGETS_RU, NEW_SCREENS_RU):
        master.update(dictionary)
    for source, target in (VOCAB_VERBS, VOCAB_NOUNS, VOCAB_ADJ):
        for en, ru in source.items():
            if " " in en:
                master.setdefault(en, ru)
            master.setdefault(en.capitalize(), ru.capitalize())
            master.setdefault(en.title(), ru.capitalize())
    normalized = {norm_str(key): value for key, value in master.items()
                  if norm_str(key) not in master}
    master.update(normalized)
    return master


def patch_catalog(catalog, master):
    patched = dict(catalog)
    formatjs = {}
    for key, value in catalog.items():
        if not isinstance(value, str):
            continue
        translated = master.get(value) or master.get(norm_str(value))
        if translated:
            patched[key] = translated
            formatjs[key] = translated
    return patched, formatjs


def source_path(name, env_name):
    configured = os.environ.get(env_name)
    if configured:
        return Path(configured).expanduser().resolve()
    candidate = SRC_DIR / name
    return candidate if candidate.exists() else None


def load_context_fragments():
    path = SRC_DIR / "context_fragments_ru.json"
    if not path.exists():
        return {"version": 1, "cards": []}
    data = read_json(path)
    if not isinstance(data, dict) or not isinstance(data.get("cards", []), list):
        raise ValueError("context_fragments_ru.json must contain {version, cards: []}")
    return data


def main():
    DIST_DIR.mkdir(exist_ok=True)
    DYNAMIC_DIST_DIR.mkdir(exist_ok=True)
    master = compile_master()
    manifest = {"baseline": {}, "outputs": {}, "intentional_differences": [
        "Maintained src dictionaries override same-key baseline values.",
        "Runtime is generated from src/i18n_runtime.js; modern modules are not templated in Python."
    ]}

    en_path = source_path("en-US.original.json", "CLAUDE_EN_CATALOG")
    if not en_path:
        raise SystemExit("Missing explicit English source: src/en-US.original.json or CLAUDE_EN_CATALOG")
    en_catalog = read_json(en_path)
    patched_en, formatjs_map = patch_catalog(en_catalog, master)
    manifest["baseline"]["main"] = {"input": str(en_path), "ids": len(en_catalog), "translated": len(formatjs_map)}
    manifest["outputs"]["main"] = {"ids": len(patched_en)}
    (DIST_DIR / "en-US.json").write_text(
        json.dumps(patched_en, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    native_path = source_path("native-en-US.original.json", "CLAUDE_NATIVE_EN_CATALOG")
    if native_path:
        native_catalog = read_json(native_path)
        patched_native, native_map = patch_catalog(native_catalog, master)
        manifest["baseline"]["native"] = {"input": str(native_path), "ids": len(native_catalog), "translated": len(native_map)}
        manifest["outputs"]["native"] = {"ids": len(patched_native)}
        (DIST_DIR / "native-en-US.json").write_text(
            json.dumps(patched_native, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    dynamic_path = source_path("dynamic-en-US.original.json", "CLAUDE_DYNAMIC_EN_CATALOG")
    if dynamic_path:
        dynamic = read_json(dynamic_path)
        patched_dynamic = dict(dynamic)
        for key, value in dynamic.items():
            if key in DYNAMIC_RU:
                patched_dynamic[key] = DYNAMIC_RU[key]
            elif isinstance(value, str):
                patched_dynamic[key] = master.get(value, master.get(norm_str(value), value))
        manifest["baseline"]["dynamic"] = {"input": str(dynamic_path), "ids": len(dynamic)}
        manifest["outputs"]["dynamic"] = {"ids": len(patched_dynamic)}
        (DYNAMIC_DIST_DIR / "en-US.json").write_text(
            json.dumps(patched_dynamic, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    context = load_context_fragments()
    runtime = (SRC_DIR / "i18n_runtime.js").read_text(encoding="utf-8")
    runtime = runtime.replace("__DICT__", json.dumps(master, ensure_ascii=False, indent=2))
    runtime = runtime.replace("__FORMATJS_MAP__", json.dumps(formatjs_map, ensure_ascii=False, indent=2))
    runtime = runtime.replace("__CONTEXT_FRAGMENTS__", json.dumps(context, ensure_ascii=False, indent=2))
    (DIST_DIR / "i18n-ru.js").write_text(runtime, encoding="utf-8")
    manifest["baseline"]["formatjs_map"] = {"ids": len(formatjs_map)}
    manifest["outputs"]["runtime"] = {"dict_entries": len(master), "formatjs_ids": len(formatjs_map), "context_cards": len(context.get("cards", []))}
    (DIST_DIR / "build-manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"Master dictionary: {len(master)} entries")
    print(f"FormatJS translations: {len(formatjs_map)}")
    print(f"Context cards: {len(context.get('cards', []))}")
    print("Build completed")


if __name__ == "__main__":
    main()
