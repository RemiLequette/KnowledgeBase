/**
 * file-root.test.js
 *
 * Unit tests for forge/handlers/file-root.js
 * Covers: list — normal cases, edge cases, error cases.
 * Note: mkdir, rmdir, move, rename not yet implemented in file-root.js v1.0.
 *
 * Run: node tests/forge/file-root.test.js
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { pathToFileURL } from 'url';

import * as handler from '../../forge/handlers/file-root.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'forge-file-root-test-'));
}

function removeTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function folderUrl(dirPath) {
  return pathToFileURL(dirPath).href + '/';
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
// list — normal cases
// ---------------------------------------------------------------------------

console.log('\nlist — normal cases');

test('returns an empty array for an empty folder', () => {
  const dir = makeTempDir();
  const entries = handler.list(folderUrl(dir));
  assert.deepStrictEqual(entries, []);
  removeTempDir(dir);
});

test('returns one entry for a single file', () => {
  const dir = makeTempDir();
  fs.writeFileSync(path.join(dir, 'hello.md'), 'hi');
  const entries = handler.list(folderUrl(dir));
  assert.strictEqual(entries.length, 1);
  assert.strictEqual(entries[0].isFolder, false);
  assert.ok(entries[0].url.endsWith('hello.md'), `expected url to end with hello.md, got ${entries[0].url}`);
  removeTempDir(dir);
});

test('returns one entry for a single subfolder', () => {
  const dir = makeTempDir();
  fs.mkdirSync(path.join(dir, 'sub'));
  const entries = handler.list(folderUrl(dir));
  assert.strictEqual(entries.length, 1);
  assert.strictEqual(entries[0].isFolder, true);
  assert.ok(entries[0].url.endsWith('sub/'), `expected url to end with sub/, got ${entries[0].url}`);
  removeTempDir(dir);
});

test('folders come before files', () => {
  const dir = makeTempDir();
  fs.writeFileSync(path.join(dir, 'alpha.md'), '');
  fs.mkdirSync(path.join(dir, 'zeta'));
  const entries = handler.list(folderUrl(dir));
  assert.strictEqual(entries.length, 2);
  assert.strictEqual(entries[0].isFolder, true, 'first entry should be a folder');
  assert.strictEqual(entries[1].isFolder, false, 'second entry should be a file');
  removeTempDir(dir);
});

test('files are sorted alphabetically within their group', () => {
  const dir = makeTempDir();
  fs.writeFileSync(path.join(dir, 'c.md'), '');
  fs.writeFileSync(path.join(dir, 'a.md'), '');
  fs.writeFileSync(path.join(dir, 'b.md'), '');
  const entries = handler.list(folderUrl(dir));
  const names = entries.map(e => e.url.split('/').pop());
  assert.deepStrictEqual(names, ['a.md', 'b.md', 'c.md']);
  removeTempDir(dir);
});

test('folders are sorted alphabetically within their group', () => {
  const dir = makeTempDir();
  fs.mkdirSync(path.join(dir, 'charlie'));
  fs.mkdirSync(path.join(dir, 'alpha'));
  fs.mkdirSync(path.join(dir, 'bravo'));
  const entries = handler.list(folderUrl(dir));
  const names = entries.map(e => e.url.split('/').slice(-2, -1)[0]);
  assert.deepStrictEqual(names, ['alpha', 'bravo', 'charlie']);
  removeTempDir(dir);
});

test('folder URLs end with /', () => {
  const dir = makeTempDir();
  fs.mkdirSync(path.join(dir, 'sub'));
  const entries = handler.list(folderUrl(dir));
  assert.ok(entries[0].url.endsWith('/'), 'folder URL must end with /');
  removeTempDir(dir);
});

test('file URLs do not end with /', () => {
  const dir = makeTempDir();
  fs.writeFileSync(path.join(dir, 'file.md'), '');
  const entries = handler.list(folderUrl(dir));
  assert.ok(!entries[0].url.endsWith('/'), 'file URL must not end with /');
  removeTempDir(dir);
});

test('all entry URLs start with file://', () => {
  const dir = makeTempDir();
  fs.writeFileSync(path.join(dir, 'x.md'), '');
  fs.mkdirSync(path.join(dir, 'sub'));
  const entries = handler.list(folderUrl(dir));
  for (const entry of entries) {
    assert.ok(entry.url.startsWith('file://'), `URL should start with file://, got ${entry.url}`);
  }
  removeTempDir(dir);
});

test('mixed content: folders first then files, each group sorted', () => {
  const dir = makeTempDir();
  fs.writeFileSync(path.join(dir, 'z.md'), '');
  fs.mkdirSync(path.join(dir, 'b-folder'));
  fs.writeFileSync(path.join(dir, 'a.md'), '');
  fs.mkdirSync(path.join(dir, 'a-folder'));
  const entries = handler.list(folderUrl(dir));
  assert.strictEqual(entries[0].isFolder, true);
  assert.ok(entries[0].url.includes('a-folder'));
  assert.strictEqual(entries[1].isFolder, true);
  assert.ok(entries[1].url.includes('b-folder'));
  assert.strictEqual(entries[2].isFolder, false);
  assert.ok(entries[2].url.endsWith('a.md'));
  assert.strictEqual(entries[3].isFolder, false);
  assert.ok(entries[3].url.endsWith('z.md'));
  removeTempDir(dir);
});

// ---------------------------------------------------------------------------
// list — error cases
// ---------------------------------------------------------------------------

console.log('\nlist — error cases');

test('throws if folder does not exist', () => {
  assert.throws(
    () => handler.list('file:///nonexistent/path/that/does/not/exist/'),
    /not found|ENOENT/i
  );
});

test('throws if path is a file, not a folder', () => {
  const dir = makeTempDir();
  const filePath = path.join(dir, 'file.md');
  fs.writeFileSync(filePath, 'content');
  assert.throws(
    () => handler.list(pathToFileURL(filePath).href),
    /not a directory/i
  );
  removeTempDir(dir);
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log('\n' + (failed === 0 ? '✅' : '❌') + ' ' + passed + ' passed, ' + failed + ' failed\n');
process.exit(failed > 0 ? 1 : 0);
