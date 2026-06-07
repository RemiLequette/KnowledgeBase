/**
 * plain-text.test.js
 *
 * Unit tests for forge/handlers/plain-text.js
 * Covers: claim, urlToFAL, falToURL, readBlock, writeBlock, unimplemented ops.
 *
 * Run: node tests/forge/plain-text.test.js
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath, pathToFileURL } from 'url';

import * as handler from '../../forge/handlers/plain-text.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'forge-plain-text-test-'));
}

function removeTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function fileUrl(filePath) {
  return pathToFileURL(filePath).href;
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

async function testAsync(name, fn) {
  try {
    await fn();
    console.log('  ✅ ' + name);
    passed++;
  } catch (e) {
    console.log('  ❌ ' + name);
    console.log('     ' + e.message);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// claim
// ---------------------------------------------------------------------------

console.log('\nclaim');

test('claims a .md file when typeName is "md"', () => {
  assert.strictEqual(handler.claim(fileUrl('/some/path/PROJECT.md'), 'md'), true);
});

test('claims a .js file when typeName is "js"', () => {
  assert.strictEqual(handler.claim(fileUrl('/some/path/script.js'), 'js'), true);
});

test('claims a .json file when typeName is "json"', () => {
  assert.strictEqual(handler.claim(fileUrl('/some/path/data.json'), 'json'), true);
});

test('does not claim a .md file when typeName is "js"', () => {
  assert.strictEqual(handler.claim(fileUrl('/some/path/PROJECT.md'), 'js'), false);
});

test('does not claim a file with no extension', () => {
  assert.strictEqual(handler.claim(fileUrl('/some/path/Makefile'), 'md'), false);
});

test('claim is case-insensitive on extension', () => {
  assert.strictEqual(handler.claim(fileUrl('/some/path/README.MD'), 'md'), true);
});

// ---------------------------------------------------------------------------
// urlToFAL
// ---------------------------------------------------------------------------

console.log('\nurlToFAL');

test('returns the filename unchanged for a .md file', () => {
  assert.strictEqual(handler.urlToFAL(fileUrl('/some/path/PROJECT.md')), 'PROJECT.md');
});

test('returns the filename unchanged for a .js file', () => {
  assert.strictEqual(handler.urlToFAL(fileUrl('/some/path/forge.js')), 'forge.js');
});

test('preserves original casing', () => {
  assert.strictEqual(handler.urlToFAL(fileUrl('/some/path/MyFile.JSON')), 'MyFile.JSON');
});

// ---------------------------------------------------------------------------
// falToURL
// ---------------------------------------------------------------------------

console.log('\nfalToURL');

test('reconstructs a file:// URL from FAL name and base URL with trailing slash', () => {
  assert.strictEqual(
    handler.falToURL('PROJECT.md', 'file:///some/path/'),
    'file:///some/path/PROJECT.md'
  );
});

test('adds trailing slash to base URL if missing', () => {
  assert.strictEqual(
    handler.falToURL('README.md', 'file:///some/path'),
    'file:///some/path/README.md'
  );
});

// ---------------------------------------------------------------------------
// readBlock
// ---------------------------------------------------------------------------

console.log('\nreadBlock');

await testAsync('reads full file content when block is ""', async () => {
  const dir = makeTempDir();
  const filePath = path.join(dir, 'test.md');
  fs.writeFileSync(filePath, '# Hello\nWorld', 'utf8');
  const content = await handler.readBlock(fileUrl(filePath), '');
  assert.strictEqual(content, '# Hello\nWorld');
  removeTempDir(dir);
});

await testAsync('reads full file content when block argument is omitted', async () => {
  const dir = makeTempDir();
  const filePath = path.join(dir, 'test.md');
  fs.writeFileSync(filePath, 'content here', 'utf8');
  const content = await handler.readBlock(fileUrl(filePath));
  assert.strictEqual(content, 'content here');
  removeTempDir(dir);
});

await testAsync('throws if block is a non-empty string', async () => {
  const dir = makeTempDir();
  const filePath = path.join(dir, 'test.md');
  fs.writeFileSync(filePath, '# Hello', 'utf8');
  await assert.rejects(
    () => handler.readBlock(fileUrl(filePath), 'some-block'),
    /plain-text type has no block structure/
  );
  removeTempDir(dir);
});

await testAsync('error message includes the offending block name', async () => {
  const dir = makeTempDir();
  const filePath = path.join(dir, 'test.md');
  fs.writeFileSync(filePath, '# Hello', 'utf8');
  await assert.rejects(
    () => handler.readBlock(fileUrl(filePath), 'changelog'),
    /changelog/
  );
  removeTempDir(dir);
});

// ---------------------------------------------------------------------------
// writeBlock
// ---------------------------------------------------------------------------

console.log('\nwriteBlock');

await testAsync('writes full file content when block is ""', async () => {
  const dir = makeTempDir();
  const filePath = path.join(dir, 'test.md');
  fs.writeFileSync(filePath, 'old content', 'utf8');
  await handler.writeBlock(fileUrl(filePath), '', 'new content');
  assert.strictEqual(fs.readFileSync(filePath, 'utf8'), 'new content');
  removeTempDir(dir);
});

await testAsync('overwrites existing content entirely', async () => {
  const dir = makeTempDir();
  const filePath = path.join(dir, 'test.md');
  fs.writeFileSync(filePath, 'line1\nline2\nline3', 'utf8');
  await handler.writeBlock(fileUrl(filePath), '', 'replaced');
  assert.strictEqual(fs.readFileSync(filePath, 'utf8'), 'replaced');
  removeTempDir(dir);
});

await testAsync('throws if block is non-empty — file must remain untouched', async () => {
  const dir = makeTempDir();
  const filePath = path.join(dir, 'test.md');
  fs.writeFileSync(filePath, 'original', 'utf8');
  await assert.rejects(
    () => handler.writeBlock(fileUrl(filePath), 'some-block', 'new content'),
    /plain-text type has no block structure/
  );
  assert.strictEqual(fs.readFileSync(filePath, 'utf8'), 'original');
  removeTempDir(dir);
});

await testAsync('error message includes the offending block name', async () => {
  const dir = makeTempDir();
  const filePath = path.join(dir, 'test.md');
  fs.writeFileSync(filePath, 'original', 'utf8');
  await assert.rejects(
    () => handler.writeBlock(fileUrl(filePath), 'quick-start', 'x'),
    /quick-start/
  );
  removeTempDir(dir);
});

// ---------------------------------------------------------------------------
// Unimplemented operations — all must throw
// ---------------------------------------------------------------------------

console.log('\nunimplemented operations');

await testAsync('listBlocks throws', async () => {
  await assert.rejects(() => handler.listBlocks('file:///x.md'), /plain-text/);
});

await testAsync('insertBlock throws', async () => {
  await assert.rejects(() => handler.insertBlock('file:///x.md', 'a', 'b'), /plain-text/);
});

await testAsync('appendBlock throws', async () => {
  await assert.rejects(() => handler.appendBlock('file:///x.md', '', 'x'), /plain-text/);
});

await testAsync('deleteBlock throws', async () => {
  await assert.rejects(() => handler.deleteBlock('file:///x.md', 'a'), /plain-text/);
});

await testAsync('createArtifact throws', async () => {
  await assert.rejects(() => handler.createArtifact('file:///x.md'), /plain-text/);
});

await testAsync('deleteArtifact throws', async () => {
  await assert.rejects(() => handler.deleteArtifact('file:///x.md'), /plain-text/);
});

await testAsync('moveArtifact throws', async () => {
  await assert.rejects(() => handler.moveArtifact('file:///x.md', 'file:///y.md'), /plain-text/);
});

await testAsync('renameArtifact throws', async () => {
  await assert.rejects(() => handler.renameArtifact('file:///x.md', 'y.md'), /plain-text/);
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log('\n' + (failed === 0 ? '✅' : '❌') + ' ' + passed + ' passed, ' + failed + ' failed\n');
process.exit(failed > 0 ? 1 : 0);
