/**
 * md-doc.test.js
 *
 * Tests for md-doc.js backup lifecycle behaviour.
 * Uses Node.js built-in assert — no external dependencies.
 *
 * Run: node tests/md-doc.test.js
 */

'use strict';

const assert = require('assert');
const fs     = require('fs');
const path   = require('path');
const os     = require('os');
const cp     = require('child_process');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TOOL = path.resolve(__dirname, '..', 'md-doc.js');

const CONFORMANT_DOC = `# Test Document

## Quick Start
A test document.

## Keywords
test, backup

## Index

## Changelog
### Version 1.0
Initial.
`;

function run(args) {
  const result = cp.spawnSync('node', [TOOL, ...args], { encoding: 'utf-8' });
  const lines  = result.stdout.trim().split('\n');
  return {
    status: lines[0],
    output: lines.slice(1).join('\n'),
    stderr: result.stderr
  };
}

function setup() {
  const dir  = fs.mkdtempSync(path.join(os.tmpdir(), 'md-doc-test-'));
  const file = path.join(dir, 'doc.md');
  const bak  = file + '.bak';
  const json = path.join(dir, 'input.json');
  fs.writeFileSync(file, CONFORMANT_DOC, 'utf-8');
  return { dir, file, bak, json };
}

function teardown(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log('  ✅ ' + name);
    passed++;
  } catch (e) {
    console.log('  ❌ ' + name);
    console.log('     ' + e.message);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Tests — update
// ---------------------------------------------------------------------------

console.log('\nupdate');

test('succeeds and returns OK', () => {
  const { dir, file, json } = setup();
  fs.writeFileSync(json, JSON.stringify({ 'Quick Start': 'Updated content.' }));
  const r = run(['update', file, json]);
  assert.strictEqual(r.status, 'OK');
  teardown(dir);
});

test('backup is absent after successful update', () => {
  const { dir, file, bak, json } = setup();
  fs.writeFileSync(json, JSON.stringify({ 'Quick Start': 'Updated content.' }));
  run(['update', file, json]);
  assert.strictEqual(fs.existsSync(bak), false, '.bak should not exist after successful update');
  teardown(dir);
});

test('backup is absent after update adds a new section', () => {
  const { dir, file, bak, json } = setup();
  fs.writeFileSync(json, JSON.stringify({ 'New Section': 'Some content.' }));
  run(['update', file, json]);
  assert.strictEqual(fs.existsSync(bak), false, '.bak should not exist after successful update');
  teardown(dir);
});

test('returns ERROR and leaves no backup when file not found', () => {
  const { dir, file, bak, json } = setup();
  fs.writeFileSync(json, JSON.stringify({ 'Quick Start': 'x' }));
  const r = run(['update', path.join(dir, 'missing.md'), json]);
  assert.ok(r.status.startsWith('ERROR'), 'should return ERROR for missing file');
  assert.strictEqual(fs.existsSync(bak), false, '.bak should not exist when file was not found');
  teardown(dir);
});

// ---------------------------------------------------------------------------
// Tests — delete
// ---------------------------------------------------------------------------

console.log('\ndelete');

test('succeeds and returns OK', () => {
  const { dir, file, json } = setup();
  // Add a non-mandatory section to delete
  fs.writeFileSync(json, JSON.stringify({ 'Extra Section': 'Content.' }));
  run(['update', file, json]);
  const r = run(['delete', file, 'Extra Section']);
  assert.strictEqual(r.status, 'OK');
  teardown(dir);
});

test('backup is absent after successful delete', () => {
  const { dir, file, bak, json } = setup();
  fs.writeFileSync(json, JSON.stringify({ 'Extra Section': 'Content.' }));
  run(['update', file, json]);
  run(['delete', file, 'Extra Section']);
  assert.strictEqual(fs.existsSync(bak), false, '.bak should not exist after successful delete');
  teardown(dir);
});

test('returns ERROR for missing section without creating backup', () => {
  const { dir, file, bak } = setup();
  const r = run(['delete', file, 'Nonexistent Section']);
  assert.ok(r.status.startsWith('ERROR'));
  assert.strictEqual(fs.existsSync(bak), false, '.bak should not exist when section was not found');
  teardown(dir);
});

test('returns ERROR for protected section without creating backup', () => {
  const { dir, file, bak } = setup();
  const r = run(['delete', file, 'Quick Start']);
  assert.ok(r.status.startsWith('ERROR'));
  assert.strictEqual(fs.existsSync(bak), false, '.bak should not exist for protected section error');
  teardown(dir);
});

// ---------------------------------------------------------------------------
// Tests — restore
// ---------------------------------------------------------------------------

console.log('\nrestore');

test('restore succeeds when backup exists', () => {
  const { dir, file, bak, json } = setup();
  const original = fs.readFileSync(file, 'utf-8');
  // Create a backup manually (simulating a failed write)
  fs.copyFileSync(file, bak);
  // Corrupt the file
  fs.writeFileSync(file, '# Corrupted\n');
  const r = run(['restore', file]);
  assert.strictEqual(r.status, 'OK');
  assert.strictEqual(fs.readFileSync(file, 'utf-8'), original);
  teardown(dir);
});

test('backup is absent after successful restore', () => {
  const { dir, file, bak } = setup();
  fs.copyFileSync(file, bak);
  run(['restore', file]);
  assert.strictEqual(fs.existsSync(bak), false, '.bak should be deleted after restore');
  teardown(dir);
});

test('restore returns ERROR when no backup exists', () => {
  const { dir, file } = setup();
  const r = run(['restore', file]);
  assert.ok(r.status.startsWith('ERROR'));
  teardown(dir);
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log('\n' + (failed === 0 ? '✅' : '❌') + ' ' + passed + ' passed, ' + failed + ' failed\n');
process.exit(failed > 0 ? 1 : 0);
