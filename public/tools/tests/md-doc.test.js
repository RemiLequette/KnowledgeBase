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

const TOOL         = path.join(__dirname, '..', 'md-doc.js');
const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const SANDBOX_DIR  = path.join(__dirname, 'sandbox');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns absolute path to a fixture file (read-only reference). */
function fixture(name) {
  return path.join(FIXTURES_DIR, name);
}

/**
 * Copies a fixture into the sandbox and returns the sandbox path.
 * The sandbox copy is safe to modify — the fixture is never touched.
 * @param {string} fixtureName - filename in fixtures/
 * @param {string} [destName]  - optional different name in sandbox
 */
function sandbox(fixtureName, destName) {
  const src  = fixture(fixtureName);
  const dest = path.join(SANDBOX_DIR, destName || fixtureName);
  fs.copyFileSync(src, dest);
  return dest;
}

/** Removes files from sandbox (ignores missing). */
function cleanup(...files) {
  for (const f of files) {
    try { fs.unlinkSync(f); } catch (_) {}
  }
}

/** Writes a JSON file to sandbox and returns its path. */
function sandboxJson(data, name) {
  const f = path.join(SANDBOX_DIR, name || ('tmp-' + Date.now() + '.json'));
  fs.writeFileSync(f, JSON.stringify(data, null, 2), 'utf-8');
  return f;
}

/** Reads and parses a JSON file. */
function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

/** Runs md-doc.js with given args, returns { status, lines }. */
function run(args) {
  const result = cp.spawnSync('node', [TOOL, ...args], { encoding: 'utf-8' });
  const lines  = result.stdout.trim().split('\n');
  return { status: lines[0], lines: lines.slice(1) };
}

// ---------------------------------------------------------------------------
// check — reads from fixtures directly (no writes)
// ---------------------------------------------------------------------------

test('check: OK on conformant document', () => {
  const r = run(['check', fixture('conformant.md')]);
  assert.strictEqual(r.status, 'OK');
  assert.strictEqual(r.lines.filter(Boolean).length, 0);
});

test('check: reports missing Index section', () => {
  const r = run(['check', fixture('missing-index.md')]);
  assert.strictEqual(r.status, 'OK');
  assert.ok(r.lines.some(l => l.includes('Index')));
});

test('check: reports empty Keywords section', () => {
  const r = run(['check', fixture('empty-keywords.md')]);
  assert.strictEqual(r.status, 'OK');
  assert.ok(r.lines.some(l => l.toLowerCase().includes('keywords')));
});

test('check: ERROR when file not found', () => {
  const r = run(['check', '/nonexistent/file.md']);
  assert.ok(r.status.startsWith('ERROR:FILE_NOT_FOUND'));
});

// ---------------------------------------------------------------------------
// dump — reads from fixtures directly (no writes to source)
// ---------------------------------------------------------------------------

test('dump: writes JSON output with title and all sections', () => {
  const out = path.join(SANDBOX_DIR, 'dump-output.json');
  const r   = run(['dump', fixture('conformant.md'), out]);
  assert.strictEqual(r.status, 'OK');
  const data = readJson(out);
  cleanup(out);
  assert.strictEqual(data.title, 'Conformant Document');
  assert.ok(data['Quick Start'].includes('conformant'));
  assert.ok(data['Keywords'].includes('conformant'));
  assert.ok('Index' in data);
  assert.ok('Changelog' in data);
});

test('dump: ERROR when file not found', () => {
  const out = path.join(SANDBOX_DIR, 'dump-missing.json');
  const r   = run(['dump', '/nonexistent/file.md', out]);
  cleanup(out);
  assert.ok(r.status.startsWith('ERROR:FILE_NOT_FOUND'));
});

// ---------------------------------------------------------------------------
// read — reads from fixtures directly (no writes to source)
// ---------------------------------------------------------------------------

test('read: returns requested elements', () => {
  const input = sandboxJson(['title', 'Quick Start', 'Keywords'], 'read-input.json');
  const out   = path.join(SANDBOX_DIR, 'read-output.json');
  const r     = run(['read', fixture('conformant.md'), input, out]);
  cleanup(input);
  assert.strictEqual(r.status, 'OK');
  const data = readJson(out);
  cleanup(out);
  assert.strictEqual(data.title, 'Conformant Document');
  assert.ok(data['Quick Start'].includes('conformant'));
  assert.ok(data['Keywords'].includes('conformant'));
});

test('read: returns null for absent section', () => {
  const input = sandboxJson(['Nonexistent'], 'read-absent-input.json');
  const out   = path.join(SANDBOX_DIR, 'read-absent-output.json');
  run(['read', fixture('conformant.md'), input, out]);
  cleanup(input);
  const data = readJson(out);
  cleanup(out);
  assert.strictEqual(data['Nonexistent'], null);
});

test('read: ERROR when json-input is not an array', () => {
  const input = sandboxJson({ title: true }, 'read-invalid-input.json');
  const out   = path.join(SANDBOX_DIR, 'read-invalid-output.json');
  const r     = run(['read', fixture('conformant.md'), input, out]);
  cleanup(input, out);
  assert.ok(r.status.startsWith('ERROR:INVALID_INPUT'));
});

// ---------------------------------------------------------------------------
// create — writes new files to sandbox
// ---------------------------------------------------------------------------

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

test('update: creates backup before writing', () => {
  const f     = sandbox('conformant.md', 'update-backup.md');
  const bak   = f + '.bak';
  const input = sandboxJson({ 'Quick Start': 'Updated.' }, 'update-backup-input.json');
  run(['update', f, input]);
  cleanup(input, f);
  assert.ok(fs.existsSync(bak), 'backup file should exist');
  cleanup(bak);
});

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

test('update: ERROR when file not found', () => {
  const input = sandboxJson({ 'Quick Start': 'x' }, 'update-missing-input.json');
  const r     = run(['update', '/nonexistent/file.md', input]);
  cleanup(input);
  assert.ok(r.status.startsWith('ERROR:FILE_NOT_FOUND'));
});

// ---------------------------------------------------------------------------
// restore — copies fixture to sandbox, creates manual backup, then restores
// ---------------------------------------------------------------------------

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

test('restore: ERROR when no backup exists', () => {
  const f = sandbox('conformant.md', 'restore-no-bak.md');
  const r = run(['restore', f]);
  cleanup(f);
  assert.ok(r.status.startsWith('ERROR:FILE_NOT_FOUND'));
});

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
  assert.ok(r.status.startsWith('ERROR:MISSING_ARG'));
});

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------

process.exit(failed > 0 ? 1 : 0);
