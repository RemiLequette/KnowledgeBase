/**
 * md-doc.test.js
 *
 * A priori tests for tools/md-doc.js (integration tests via child_process)
 *
 * Args: (none)
 */

'use strict';

const assert = require('assert');
const cp     = require('child_process');
const fs     = require('fs');
const path   = require('path');

let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log('PASS: ' + name);
  } catch (e) {
    console.log('FAIL: ' + name + ' -- ' + e.message);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const TOOL         = path.join(__dirname, '..', 'public', 'tools', 'md-doc.js');
const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const SANDBOX_DIR  = path.join(__dirname, 'sandbox');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fixture(name) {
  return path.join(FIXTURES_DIR, name);
}

function sandbox(fixtureName, destName) {
  const src  = fixture(fixtureName);
  const dest = path.join(SANDBOX_DIR, destName || fixtureName);
  fs.copyFileSync(src, dest);
  return dest;
}

function cleanup(...files) {
  for (const f of files) {
    try { fs.unlinkSync(f); } catch (_) {}
  }
}

function sandboxJson(data, name) {
  const f = path.join(SANDBOX_DIR, name || ('tmp-' + Date.now() + '.json'));
  fs.writeFileSync(f, JSON.stringify(data, null, 2), 'utf-8');
  return f;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function run(args) {
  const result = cp.spawnSync('node', [TOOL, ...args], { encoding: 'utf-8' });
  const lines  = result.stdout.trim().split('\n');
  return { status: lines[0], lines: lines.slice(1) };
}

// ---------------------------------------------------------------------------
// check — reads from fixtures directly (no writes)
// ---------------------------------------------------------------------------

// @convention conventions/documentation.md [section Document Structure]
test('check: OK on conformant document', () => {
  const r = run(['check', fixture('conformant.md')]);
  assert.strictEqual(r.status, 'OK');
  assert.strictEqual(r.lines.filter(Boolean).length, 0);
});

// @convention conventions/documentation.md [section Document Structure]
test('check: reports missing Index section', () => {
  const r = run(['check', fixture('missing-index.md')]);
  assert.strictEqual(r.status, 'OK');
  assert.ok(r.lines.some(l => l.includes('Index')));
});

// @convention conventions/documentation.md [section Keywords Rule]
test('check: reports empty Keywords section', () => {
  const r = run(['check', fixture('empty-keywords.md')]);
  assert.strictEqual(r.status, 'OK');
  assert.ok(r.lines.some(l => l.toLowerCase().includes('keywords')));
});

// @convention conventions/tools.md [section Standard Interface]
test('check: ERROR when file not found', () => {
  const r = run(['check', '/nonexistent/file.md']);
  assert.ok(r.status.startsWith('ERROR:FILE_NOT_FOUND'));
});

// ---------------------------------------------------------------------------
// create — writes new files to sandbox
// ---------------------------------------------------------------------------

// @convention conventions/md-doc-usage.md [section Writing a Document]
test('create: creates conformant document with provided content', () => {
  const dest  = path.join(SANDBOX_DIR, 'created.md');
  const input = sandboxJson({
    title:         'New Doc',
    'Quick Start': 'Created by test.',
    'Keywords':    'new, doc, test',
  }, 'create-input.json');
  const r = run(['create', dest, input]);
  cleanup(input);
  assert.strictEqual(r.status, 'OK');
  const content = fs.readFileSync(dest, 'utf-8');
  cleanup(dest);
  assert.ok(content.includes('# New Doc'));
  assert.ok(content.includes('Created by test.'));
  assert.ok(content.includes('## Keywords'));
  assert.ok(content.includes('## Index'));
  assert.ok(content.includes('## Changelog'));
});

// @convention conventions/tools.md [section Standard Interface]
test('create: ERROR when file already exists', () => {
  const dest  = sandbox('conformant.md', 'create-existing.md');
  const input = sandboxJson({ title: 'New Doc' }, 'create-existing-input.json');
  const r     = run(['create', dest, input]);
  cleanup(dest, input);
  assert.ok(r.status.startsWith('ERROR:FILE_ALREADY_EXISTS'));
});

// ---------------------------------------------------------------------------
// update — copies fixture to sandbox before modifying
// ---------------------------------------------------------------------------

// @convention conventions/md-doc-usage.md [section Writing a Document]
test('update: replaces existing section content', () => {
  const f     = sandbox('conformant.md', 'update-replace.md');
  const input = sandboxJson({ 'Quick Start': 'Updated content.' }, 'update-replace-input.json');
  const r     = run(['update', f, input]);
  cleanup(input);
  assert.strictEqual(r.status, 'OK');
  const content = fs.readFileSync(f, 'utf-8');
  cleanup(f, f + '.bak');
  assert.ok(content.includes('Updated content.'));
});

// @convention conventions/md-doc-usage.md [section Writing a Document]
test('update: creates backup before writing', () => {
  const f     = sandbox('conformant.md', 'update-backup.md');
  const bak   = f + '.bak';
  const input = sandboxJson({ 'Quick Start': 'Updated.' }, 'update-backup-input.json');
  run(['update', f, input]);
  cleanup(input, f);
  assert.ok(fs.existsSync(bak), 'backup file should exist');
  cleanup(bak);
});

// @convention conventions/md-doc-usage.md [section Writing a Document]
test('update: creates new section when absent', () => {
  const f     = sandbox('conformant.md', 'update-new-section.md');
  const input = sandboxJson({ 'Rationale': 'New section via update.' }, 'update-new-section-input.json');
  run(['update', f, input]);
  cleanup(input);
  const content = fs.readFileSync(f, 'utf-8');
  cleanup(f, f + '.bak');
  assert.ok(content.includes('## Rationale'));
  assert.ok(content.includes('New section via update.'));
});

// @convention conventions/md-doc-usage.md [section Writing a Document]
test('update: new section is inserted before Index', () => {
  const f     = sandbox('conformant.md', 'update-order.md');
  const input = sandboxJson({ 'Rationale': 'content' }, 'update-order-input.json');
  run(['update', f, input]);
  cleanup(input);
  const content = fs.readFileSync(f, 'utf-8');
  cleanup(f, f + '.bak');
  const iRat = content.indexOf('## Rationale');
  const iIdx = content.indexOf('## Index');
  assert.ok(iRat < iIdx, 'Rationale should appear before Index');
});

// @convention conventions/tools.md [section Standard Interface]
test('update: ERROR when file not found', () => {
  const input = sandboxJson({ 'Quick Start': 'x' }, 'update-missing-input.json');
  const r     = run(['update', '/nonexistent/file.md', input]);
  cleanup(input);
  assert.ok(r.status.startsWith('ERROR:FILE_NOT_FOUND'));
});

// ---------------------------------------------------------------------------
// restore
// ---------------------------------------------------------------------------

// @convention conventions/md-doc-usage.md [section Writing a Document]
test('restore: restores file from backup and removes backup', () => {
  const f   = sandbox('conformant.md', 'restore-target.md');
  const bak = f + '.bak';
  fs.copyFileSync(fixture('missing-index.md'), bak);
  const r       = run(['restore', f]);
  assert.strictEqual(r.status, 'OK');
  const content = fs.readFileSync(f, 'utf-8');
  cleanup(f);
  assert.ok(content.includes('Missing Index Document'), 'file should be restored from backup');
  assert.ok(!fs.existsSync(bak), 'backup should be removed after restore');
});

// @convention conventions/tools.md [section Standard Interface]
test('restore: ERROR when no backup exists', () => {
  const f = sandbox('conformant.md', 'restore-no-bak.md');
  const r = run(['restore', f]);
  cleanup(f);
  assert.ok(r.status.startsWith('ERROR:FILE_NOT_FOUND'));
});

// @convention conventions/md-doc-usage.md [section Writing a Document]
test('update: empty title value leaves existing title unchanged', () => {
  const f     = sandbox('conformant.md', 'update-empty-title.md');
  const input = sandboxJson({ title: '' }, 'update-empty-title-input.json');
  const r     = run(['update', f, input]);
  cleanup(input);
  assert.strictEqual(r.status, 'OK');
  const content = fs.readFileSync(f, 'utf-8');
  cleanup(f, f + '.bak');
  assert.ok(content.includes('# Conformant Document'), 'title should be unchanged');
});

// ---------------------------------------------------------------------------
// Missing args
// ---------------------------------------------------------------------------

test('missing command: ERROR', () => {
  const r = run([]);
  assert.ok(r.status.startsWith('ERROR:'));
});

test('read missing args: ERROR', () => {
  const r = run(['read', '/some/file.md']);
  assert.ok(r.status.startsWith('ERROR:'));
});

test('dump missing args: ERROR', () => {
  const r = run(['dump', '/some/file.md']);
  assert.ok(r.status.startsWith('ERROR:'));
});

test('create missing args: ERROR', () => {
  const r = run(['create', '/some/file.md']);
  assert.ok(r.status.startsWith('ERROR:MISSING_ARG'));
});

test('update missing args: ERROR', () => {
  const r = run(['update', '/some/file.md']);
  assert.ok(r.status.startsWith('ERROR:MISSING_ARG'));
});

test('delete missing args: ERROR', () => {
  const r = run(['delete', '/some/file.md']);
  assert.ok(r.status.startsWith('ERROR:MISSING_ARG'));
});

test('restore missing args: ERROR', () => {
  const r = run(['restore']);
  assert.ok(r.status.startsWith('ERROR:MISSING_ARG'));
});

test('unknown command: ERROR', () => {
  const r = run(['unknown']);
  assert.ok(r.status.startsWith('ERROR:'));
});

// ---------------------------------------------------------------------------
// check — required sections
// ---------------------------------------------------------------------------

test('check: reports missing Quick Start section', () => {
  const f = path.join(SANDBOX_DIR, 'check-missing-qs.md');
  fs.writeFileSync(f, '# Title\n## Keywords\nfoo\n## Index\n\n## Changelog\n', 'utf-8');
  const r = run(['check', f]);
  cleanup(f);
  assert.strictEqual(r.status, 'OK');
  assert.ok(r.lines.some(l => l.includes('Quick Start')));
});

test('check: reports missing Changelog section', () => {
  const f = path.join(SANDBOX_DIR, 'check-missing-changelog.md');
  fs.writeFileSync(f, '# Title\n## Quick Start\nok\n## Keywords\nfoo\n## Index\n\n', 'utf-8');
  const r = run(['check', f]);
  cleanup(f);
  assert.strictEqual(r.status, 'OK');
  assert.ok(r.lines.some(l => l.includes('Changelog')));
});

// ---------------------------------------------------------------------------
// create — edge cases
// ---------------------------------------------------------------------------

test('create: ERROR when input is an array instead of object', () => {
  const dest  = path.join(SANDBOX_DIR, 'create-array-input.md');
  const input = sandboxJson(['title', 'foo'], 'create-array-input.json');
  const r     = run(['create', dest, input]);
  cleanup(dest, input);
  assert.ok(r.status.startsWith('ERROR:INVALID_INPUT'));
});

test('create: ERROR when title is absent', () => {
  const dest  = path.join(SANDBOX_DIR, 'create-no-title.md');
  const input = sandboxJson({ 'Quick Start': 'No title doc.', Keywords: 'foo' }, 'create-no-title-input.json');
  const r     = run(['create', dest, input]);
  cleanup(input, dest);
  assert.ok(r.status.startsWith('ERROR:'), 'create without title should return ERROR');
});

test('create: canonical section order — Quick Start before Keywords', () => {
  const dest  = path.join(SANDBOX_DIR, 'create-order.md');
  const input = sandboxJson({
    title:         'Order Test',
    Keywords:      'order, test',
    'Quick Start': 'Testing order.',
  }, 'create-order-input.json');
  run(['create', dest, input]);
  cleanup(input);
  const content = fs.readFileSync(dest, 'utf-8');
  cleanup(dest);
  const iQS  = content.indexOf('## Quick Start');
  const iKW  = content.indexOf('## Keywords');
  assert.ok(iQS < iKW, 'Quick Start should appear before Keywords');
});

// ---------------------------------------------------------------------------
// update — edge cases
// ---------------------------------------------------------------------------

test('update: ERROR when input is an array instead of object', () => {
  const f     = sandbox('conformant.md', 'update-array-input.md');
  const input = sandboxJson(['Quick Start'], 'update-array-input.json');
  const r     = run(['update', f, input]);
  cleanup(f, input);
  assert.ok(r.status.startsWith('ERROR:INVALID_INPUT'));
});

test('update: updates title when title key is provided', () => {
  const f     = sandbox('conformant.md', 'update-title.md');
  const input = sandboxJson({ title: 'Updated Title' }, 'update-title-input.json');
  const r     = run(['update', f, input]);
  cleanup(input);
  assert.strictEqual(r.status, 'OK');
  const content = fs.readFileSync(f, 'utf-8');
  cleanup(f, f + '.bak');
  assert.ok(content.includes('# Updated Title'));
});

// ---------------------------------------------------------------------------
// mutation tests on real KB file: documentation.md
// ---------------------------------------------------------------------------

const KB_ROOT      = path.join(__dirname, '..');
const KB_TMP       = path.join(KB_ROOT, 'tmp');
const KB_CONV      = path.join(KB_ROOT, 'public', 'conventions');

if (!fs.existsSync(KB_TMP)) fs.mkdirSync(KB_TMP, { recursive: true });

const MUTATION_SRC  = path.join(KB_CONV, 'documentation.md');
const MUTATION_NAME = 'documentation';
const mdParser      = require('../public/tools/lib/md-parser');

function mutationTarget() {
  const p = path.join(KB_TMP, `md-doc-mutation-${MUTATION_NAME}-${Date.now()}.md`);
  fs.copyFileSync(MUTATION_SRC, p);
  return p;
}

function readSection(filePath, sectionName) {
  const doc = mdParser.parseFile(filePath);
  return mdParser.getSection(doc, sectionName);
}

function updateSection(filePath, sectionName, content) {
  const inputPath = path.join(KB_TMP, `md-doc-mutation-update-input-${Date.now()}.json`);
  fs.writeFileSync(inputPath, JSON.stringify({ [sectionName]: content }, null, 2), 'utf-8');
  const r = run(['update', filePath, inputPath]);
  try { fs.unlinkSync(inputPath); } catch (_) {}
  return r;
}

// @convention conventions/md-doc-usage.md [section Writing a Document]
test('mutation: replace Quick Start content', () => {
  const f = mutationTarget();
  try {
    const newContent = 'Replaced Quick Start content for mutation test.';
    const r = updateSection(f, 'Quick Start', newContent);
    assert.strictEqual(r.status, 'OK');
    assert.strictEqual(readSection(f, 'Quick Start'), newContent);
  } finally {
    cleanup(f, f + '.bak');
  }
});

// @convention conventions/md-doc-usage.md [section Writing a Document]
test('mutation: replace Keywords content', () => {
  const f = mutationTarget();
  try {
    const newContent = 'mutation, test, keywords';
    const r = updateSection(f, 'Keywords', newContent);
    assert.strictEqual(r.status, 'OK');
    assert.strictEqual(readSection(f, 'Keywords'), newContent);
  } finally {
    cleanup(f, f + '.bak');
  }
});

// @convention conventions/md-doc-usage.md [section Writing a Document]
test('mutation: empty Index content leaves section present', () => {
  const f = mutationTarget();
  try {
    const r = updateSection(f, 'Index', '');
    assert.strictEqual(r.status, 'OK');
    assert.strictEqual(readSection(f, 'Index'), '');
  } finally {
    cleanup(f, f + '.bak');
  }
});

// @convention conventions/md-doc-usage.md [section Writing a Document]
test('mutation: prepend entry to Changelog', () => {
  const f = mutationTarget();
  try {
    const original = readSection(f, 'Changelog');
    const newEntry  = '### Version 99.0 - Mutation test\n**Date:** 2026-05-31\n**Reason:** Test entry.\n\n---\n\n';
    const r = updateSection(f, 'Changelog', newEntry + original);
    assert.strictEqual(r.status, 'OK');
    const updated = readSection(f, 'Changelog');
    assert.ok(updated.startsWith('### Version 99.0'), 'new entry should be at the top');
    assert.ok(updated.includes(original.slice(0, 40)), 'original content should be preserved');
  } finally {
    cleanup(f, f + '.bak');
  }
});

// @convention conventions/md-doc-usage.md [section Writing a Document]
test('mutation: add section at beginning — appears before Document Structure', () => {
  const f = mutationTarget();
  try {
    const inputPath = path.join(KB_TMP, 'md-doc-mutation-position-beginning-input.json');
    fs.writeFileSync(inputPath, JSON.stringify({
      'Preamble': 'Section added at beginning.',
      '__positions': { 'Preamble': 'beginning' },
    }, null, 2), 'utf-8');
    const r = run(['update', f, inputPath]);
    try { fs.unlinkSync(inputPath); } catch (_) {}
    assert.strictEqual(r.status, 'OK');
    const content = fs.readFileSync(f, 'utf-8');
    const iPreamble  = content.indexOf('## Preamble');
    const iDocStruct = content.indexOf('## Document Structure');
    assert.ok(iPreamble !== -1, 'Preamble section should exist');
    assert.ok(iPreamble < iDocStruct, 'Preamble should appear before Document Structure');
  } finally {
    cleanup(f, f + '.bak');
  }
});

// @convention conventions/md-doc-usage.md [section Writing a Document]
test('mutation: add section in middle — appears between Language and Numbering', () => {
  const f = mutationTarget();
  try {
    const inputPath = path.join(KB_TMP, 'md-doc-mutation-position-middle-input.json');
    fs.writeFileSync(inputPath, JSON.stringify({
      'Interlude': 'Section added in the middle.',
      '__positions': { 'Interlude': 'after:Language' },
    }, null, 2), 'utf-8');
    const r = run(['update', f, inputPath]);
    try { fs.unlinkSync(inputPath); } catch (_) {}
    assert.strictEqual(r.status, 'OK');
    const content = fs.readFileSync(f, 'utf-8');
    const iInterlude = content.indexOf('## Interlude');
    const iLanguage  = content.indexOf('## Language');
    const iNumbering = content.indexOf('## Numbering');
    assert.ok(iInterlude !== -1, 'Interlude section should exist');
    assert.ok(iLanguage < iInterlude && iInterlude < iNumbering,
      'Interlude should appear between Language and Numbering');
  } finally {
    cleanup(f, f + '.bak');
  }
});

// @convention conventions/md-doc-usage.md [section Writing a Document]
test('mutation: delete non-mandatory section removes it from the document', () => {
  const f = mutationTarget();
  try {
    updateSection(f, 'ToDelete', 'This section will be deleted.');
    assert.ok(fs.readFileSync(f, 'utf-8').includes('## ToDelete'), 'section should exist before delete');
    const r = run(['delete', f, 'ToDelete']);
    assert.strictEqual(r.status, 'OK', 'delete should succeed');
    assert.ok(!fs.readFileSync(f, 'utf-8').includes('## ToDelete'), 'section should be gone after delete');
  } finally {
    cleanup(f, f + '.bak');
  }
});

// @convention conventions/md-doc-usage.md [section Writing a Document]
test('mutation: delete mandatory section returns ERROR', () => {
  const f = mutationTarget();
  try {
    const r = run(['delete', f, 'Quick Start']);
    assert.ok(r.status.startsWith('ERROR:'), 'deleting a mandatory section should return ERROR');
    assert.ok(fs.readFileSync(f, 'utf-8').includes('## Quick Start'), 'Quick Start should still be present');
  } finally {
    cleanup(f, f + '.bak');
  }
});

// @convention conventions/documentation.md [section Document Structure]
test('mutation: update on non-conformant file returns ERROR:NOT_CONFORMANT', () => {
  const f = path.join(KB_TMP, `md-doc-mutation-nonconformant-${Date.now()}.md`);
  fs.writeFileSync(f, '# Title\n## Quick Start\nok\n', 'utf-8');
  try {
    const r = updateSection(f, 'Quick Start', 'new content');
    assert.ok(r.status.startsWith('ERROR:NOT_CONFORMANT'), 'update on non-conformant file should fail');
  } finally {
    cleanup(f);
  }
});

// ---------------------------------------------------------------------------
// subtitle and language — integration tests via md-doc update command
// ---------------------------------------------------------------------------

// @convention conventions/documentation.md [section Document Structure]
test('update: subtitle key writes subtitle under title', () => {
  const f     = sandbox('conformant-with-subtitle-language.md', 'update-subtitle-write.md');
  const input = sandboxJson({ subtitle: 'My new subtitle.' }, 'update-subtitle-write-input.json');
  const r     = run(['update', f, input]);
  cleanup(input);
  assert.strictEqual(r.status, 'OK');
  const content = fs.readFileSync(f, 'utf-8');
  cleanup(f, f + '.bak');
  const lines    = content.split('\n');
  const titleIdx = lines.findIndex(l => l.startsWith('# '));
  const qsIdx    = lines.findIndex(l => l.startsWith('## '));
  const between  = lines.slice(titleIdx + 1, qsIdx).join('\n');
  assert.ok(between.includes('My new subtitle.'), 'subtitle should appear between title and first section');
});

// @convention conventions/documentation.md [section Document Structure]
test('update: existing subtitle preserved when subtitle key absent', () => {
  const f     = sandbox('conformant-with-subtitle-language.md', 'update-subtitle-preserve.md');
  const input = sandboxJson({ 'Quick Start': 'Updated quick start.' }, 'update-subtitle-preserve-input.json');
  const r     = run(['update', f, input]);
  cleanup(input);
  assert.strictEqual(r.status, 'OK');
  const content = fs.readFileSync(f, 'utf-8');
  cleanup(f, f + '.bak');
  assert.ok(content.includes('A short subtitle for testing purposes.'), 'existing subtitle should be preserved');
});

// @convention conventions/documentation.md [section Document Structure]
test('update: subtitle empty string removes subtitle', () => {
  const f     = sandbox('conformant-with-subtitle-language.md', 'update-subtitle-remove.md');
  const input = sandboxJson({ subtitle: '' }, 'update-subtitle-remove-input.json');
  const r     = run(['update', f, input]);
  cleanup(input);
  assert.strictEqual(r.status, 'OK');
  const content = fs.readFileSync(f, 'utf-8');
  cleanup(f, f + '.bak');
  assert.ok(!content.includes('A short subtitle for testing purposes.'), 'subtitle should be removed');
});

// @convention conventions/documentation.md [section Language]
test('update: language key writes language declaration under subtitle', () => {
  const f     = sandbox('conformant-with-subtitle-language.md', 'update-language-write.md');
  const input = sandboxJson({ language: '*Language: Spanish — test.*' }, 'update-language-write-input.json');
  const r     = run(['update', f, input]);
  cleanup(input);
  assert.strictEqual(r.status, 'OK');
  const content = fs.readFileSync(f, 'utf-8');
  cleanup(f, f + '.bak');
  assert.ok(content.includes('*Language: Spanish'), 'language declaration should be updated');
});

// @convention conventions/documentation.md [section Language]
test('update: existing language preserved when language key absent', () => {
  const f     = sandbox('conformant-with-subtitle-language.md', 'update-language-preserve.md');
  const input = sandboxJson({ 'Quick Start': 'Updated quick start.' }, 'update-language-preserve-input.json');
  const r     = run(['update', f, input]);
  cleanup(input);
  assert.strictEqual(r.status, 'OK');
  const content = fs.readFileSync(f, 'utf-8');
  cleanup(f, f + '.bak');
  assert.ok(content.includes('*Language: French'), 'existing language should be preserved');
});

// @convention conventions/documentation.md [section Language]
test('update: language empty string removes language declaration', () => {
  const f     = sandbox('conformant-with-subtitle-language.md', 'update-language-remove.md');
  const input = sandboxJson({ language: '' }, 'update-language-remove-input.json');
  const r     = run(['update', f, input]);
  cleanup(input);
  assert.strictEqual(r.status, 'OK');
  const content = fs.readFileSync(f, 'utf-8');
  cleanup(f, f + '.bak');
  assert.ok(!content.includes('*Language:'), 'language declaration should be removed');
});

// @convention conventions/documentation.md [section Document Structure]
test('update: subtitle and language together — both written correctly', () => {
  const f     = sandbox('conformant.md', 'update-subtitle-language-together.md');
  const input = sandboxJson({
    subtitle: 'Combined subtitle.',
    language: '*Language: German — test.*',
  }, 'update-subtitle-language-together-input.json');
  const r     = run(['update', f, input]);
  cleanup(input);
  assert.strictEqual(r.status, 'OK');
  const content = fs.readFileSync(f, 'utf-8');
  cleanup(f, f + '.bak');
  assert.ok(content.includes('Combined subtitle.'), 'subtitle should be present');
  assert.ok(content.includes('*Language: German'), 'language should be present');
  const iSub  = content.indexOf('Combined subtitle.');
  const iLang = content.indexOf('*Language: German');
  assert.ok(iSub < iLang, 'subtitle should appear before language');
});

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------

process.exit(failed > 0 ? 1 : 0);
