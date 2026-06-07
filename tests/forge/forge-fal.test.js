/**
 * forge-fal.test.js
 *
 * Unit tests for parseFAL and toFAL (src/fal.js).
 * fal.js is the MCP boundary layer — imported only by mcp-tools.js.
 *
 * References:
 *   - conventions/forge.md v7.0 [section Forge Artifact Locator FAL]
 */

import assert from 'assert';
import { parseFAL, toFAL } from '../../public/tools/forge/src/fal.js';

let failed = 0;
function test(name, fn) {
  try {
    fn();
    console.log('PASS: ' + name);
  } catch (e) {
    console.log('FAIL: ' + name + ' — ' + e.message);
    failed++;
  }
}

// -------------------------------------------------------------------------
// parseFAL — artifact FALs
// -------------------------------------------------------------------------

test('artifact FAL — simple', () => {
  const r = parseFAL('forge://test/sample.md');
  assert.strictEqual(r.root,  'test');
  assert.strictEqual(r.path,  '');
  assert.strictEqual(r.name,  'sample');
  assert.strictEqual(r.type,  'md');
  assert.strictEqual(r.block, '');
});

test('artifact FAL — with folder path', () => {
  const r = parseFAL('forge://development/with-claude/knowledgebase/public/INDEX.md');
  assert.strictEqual(r.root, 'development');
  assert.strictEqual(r.path, 'with-claude/knowledgebase/public/');
  assert.strictEqual(r.name, 'INDEX');
  assert.strictEqual(r.type, 'md');
  assert.strictEqual(r.block, '');
});

test('artifact FAL — with block', () => {
  const r = parseFAL('forge://kb/public/TODO.doc-todolist#section:High-priority');
  assert.strictEqual(r.name,  'TODO');
  assert.strictEqual(r.type,  'doc-todolist');
  assert.strictEqual(r.block, 'section:High-priority');
});

test('artifact FAL — dash in type name', () => {
  const r = parseFAL('forge://dev/notes.md-doc');
  assert.strictEqual(r.type, 'md-doc');
  assert.strictEqual(r.name, 'notes');
});

test('artifact FAL — namespaced type', () => {
  const r = parseFAL('forge://commwise:production/bloc.commwise:layout');
  assert.strictEqual(r.root, 'commwise:production');
  assert.strictEqual(r.name, 'bloc');
  assert.strictEqual(r.type, 'commwise:layout');
});

// -------------------------------------------------------------------------
// parseFAL — folder FALs
// -------------------------------------------------------------------------

test('folder FAL — root level', () => {
  const r = parseFAL('forge://test/');
  assert.strictEqual(r.root, 'test');
  assert.strictEqual(r.path, '');
  assert.strictEqual(r.name, '');
  assert.strictEqual(r.type, '');
});

test('folder FAL — with path', () => {
  const r = parseFAL('forge://development/with-claude/knowledgebase/');
  assert.strictEqual(r.root, 'development');
  assert.strictEqual(r.path, 'with-claude/knowledgebase/');
  assert.strictEqual(r.name, '');
});

test('folder FAL — name is empty string', () => {
  const r = parseFAL('forge://test/subdir/');
  assert.strictEqual(r.name, '');
});

// -------------------------------------------------------------------------
// parseFAL — errors
// -------------------------------------------------------------------------

test('throws on missing forge:// prefix', () => {
  assert.throws(() => parseFAL('test/sample.md'), /must start with forge:\/\//);
});

test('throws on missing path separator', () => {
  assert.throws(() => parseFAL('forge://test'), /missing path separator/);
});

test('throws on empty root', () => {
  assert.throws(() => parseFAL('forge:///sample.md'), /empty root/);
});

test('throws on artifact name without extension', () => {
  assert.throws(() => parseFAL('forge://test/noextension'), /no type extension/);
});

test('throws on empty name before extension', () => {
  assert.throws(() => parseFAL('forge://test/.md'), /empty before extension/);
});

test('throws on empty type extension', () => {
  assert.throws(() => parseFAL('forge://test/name.'), /empty type extension/);
});

// -------------------------------------------------------------------------
// toFAL — round-trip
// -------------------------------------------------------------------------

test('toFAL — artifact ref round-trip', () => {
  const fal = 'forge://test/sample.md';
  assert.strictEqual(toFAL(parseFAL(fal)), fal);
});

test('toFAL — artifact with path round-trip', () => {
  const fal = 'forge://development/with-claude/knowledgebase/public/INDEX.md';
  assert.strictEqual(toFAL(parseFAL(fal)), fal);
});

test('toFAL — folder ref round-trip', () => {
  const fal = 'forge://test/';
  assert.strictEqual(toFAL(parseFAL(fal)), fal);
});

test('toFAL — folder with path round-trip', () => {
  const fal = 'forge://development/with-claude/knowledgebase/';
  assert.strictEqual(toFAL(parseFAL(fal)), fal);
});

test('toFAL — folder ref (name empty) produces trailing slash', () => {
  const ref = { root: 'test', path: 'subdir/', name: '', type: '' };
  assert.ok(toFAL(ref).endsWith('/'));
});

// -------------------------------------------------------------------------
// isFolder helper — name === '' discriminates folder vs artifact
// -------------------------------------------------------------------------

test('folder FAL has name === ""', () => {
  assert.strictEqual(parseFAL('forge://test/').name, '');
});

test('artifact FAL has name !== ""', () => {
  assert.notStrictEqual(parseFAL('forge://test/sample.md').name, '');
});

console.log(`\n${failed === 0 ? 'All tests passed' : `${failed} test(s) failed`}`);
process.exit(failed > 0 ? 1 : 0);
