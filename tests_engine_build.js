#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = __dirname;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const runtime = fs.readFileSync(path.join(root, 'src', 'i18n_runtime.js'), 'utf8');
assert(runtime.includes('const DICT = __DICT__'), 'runtime must use an explicit dictionary placeholder');
assert(runtime.includes('const FORMATJS_MAP = __FORMATJS_MAP__'), 'runtime must use an explicit FormatJS placeholder');
assert(runtime.includes('const CONTEXT_FRAGMENTS = __CONTEXT_FRAGMENTS__'), 'runtime must use a context placeholder');
assert(runtime.includes('res.clone().json()'), 'fetch fallback must preserve the original response');
assert(runtime.includes('isSlashCommandText'), 'slash command matching must be contextual');
assert(runtime.includes("'KBD', 'SAMP'"), 'code-like content must be protected');
assert(!runtime.includes('COMMAND_NAMES_SET.has(trimmed.toLowerCase())'), 'ordinary UI labels must not be blocked as commands');

const baseline = JSON.parse(fs.readFileSync(path.join(root, 'src', 'baseline_data.json'), 'utf8'));
assert(Object.keys(baseline.DICT).length >= 4000, 'baseline DICT unexpectedly small');
assert(Object.keys(baseline.FORMATJS_MAP).length >= 6000, 'baseline FormatJS map unexpectedly small');

const dist = fs.readFileSync(path.join(root, 'dist', 'i18n-ru.js'), 'utf8');
assert(dist.includes('CommunityContribModule'), 'generated runtime lost community module');
assert(dist.includes('ReasoningAndThinkingModule'), 'generated runtime lost reasoning module');
assert(dist.includes('const CONTEXT_FRAGMENTS ='), 'generated runtime lost context data');
new vm.Script(dist, { filename: 'dist/i18n-ru.js' });

for (const file of ['src/en-US.original.json', 'src/native-en-US.original.json']) {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
  assert(Object.keys(catalog).length > 500, `${file} is unexpectedly small`);
}

const build = fs.readFileSync(path.join(root, 'src', 'build.py'), 'utf8');
assert(build.includes('source_path("en-US.original.json", "CLAUDE_EN_CATALOG")'), 'build must use explicit main English input');
assert(build.includes('source_path("native-en-US.original.json", "CLAUDE_NATIVE_EN_CATALOG")'), 'build must use explicit native English input');
assert(!build.includes('DIST_DIR, "en-US.json"'), 'build must not use translated dist as English source');
const manifestPath = path.join(root, 'dist', 'build-manifest.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert(manifest.baseline && manifest.outputs, 'manifest must contain baseline and outputs');
}
console.log('engine/build checks passed');
