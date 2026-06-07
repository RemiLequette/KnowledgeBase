/**
 * file-root.test.js
 *
 * Unit tests for file-root.js — v7.0 interface.
 * All tests MUST FAIL on the current handler (v1.1) which uses the v6.x interface.
 *
 * Tests IRootRegistry (create/read/write/delete on UrlRef) and folder
 * navigation (list/mkdir/rmdir/rename/move returning UrlRef).
 *
 * References:
 *   - conventions/forge.md v7.0 [section Root registry]
 *   - conventions/forge.md v7.0 [section IRootRegistry]
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { test, testAsync, summary, urlRef, urlRefPath, sandboxCreate, sandboxClean, sandboxRead } from './forge-testable.js';
import * as rootHandler from '../handlers/file-root.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SANDBOX_DIR = path.join(__dirname, 'fixtures', 'sandbox');

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SAMPLE_REF       = urlRef('sample', '.md');
const SANDBOX_REF      = urlRef('fr-test', '.md', 'sandbox');
const MISSING_REF      = urlRef('does-not-exist', '.md');
const FIXTURES_DIR_REF = { root: 'test', path: '', name: '', extension: '' }; // folder ref

// ---------------------------------------------------------------------------
// IRootRegistry — create
// ---------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section IRootRegistry]
await testAsync('create makes a new empty file', async () => {
  sandboxClean('fr-test.md');
  await rootHandler.create(SANDBOX_REF);
  assert.ok(fs.existsSync(urlRefPath(SANDBOX_REF)), 'file not created');
  assert.strictEqual(fs.readFileSync(urlRefPath(SANDBOX_REF), 'utf8'), '');
  sandboxClean('fr-test.md');
});

// @convention conventions/forge.md v7.0 [section IRootRegistry]
await testAsync('create throws if file already exists', async () => {
  sandboxCreate('fr-test.md', 'existing');
  try {
    await rootHandler.create(SANDBOX_REF);
    assert.fail('Expected error');
  } catch (e) {
    assert.ok(e.message.length > 0);
  } finally {
    sandboxClean('fr-test.md');
  }
});

// ---------------------------------------------------------------------------
// IRootRegistry — read
// ---------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section IRootRegistry]
await testAsync('read returns file content as string', async () => {
  const content = await rootHandler.read(SAMPLE_REF);
  assert.ok(typeof content === 'string' && content.length > 0);
  assert.ok(content.includes('# Sample'));
});

// @convention conventions/forge.md v7.0 [section IRootRegistry]
await testAsync('read throws for missing file', async () => {
  try {
    await rootHandler.read(MISSING_REF);
    assert.fail('Expected error');
  } catch (e) {
    assert.ok(e.message.length > 0);
  }
});

// ---------------------------------------------------------------------------
// IRootRegistry — write
// ---------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section IRootRegistry]
await testAsync('write replaces file content', async () => {
  sandboxCreate('fr-test.md', 'old');
  await rootHandler.write(SANDBOX_REF, 'new content');
  assert.strictEqual(sandboxRead('fr-test.md'), 'new content');
  sandboxClean('fr-test.md');
});

// @convention conventions/forge.md v7.0 [section IRootRegistry]
await testAsync('write throws if file does not exist', async () => {
  sandboxClean('fr-test.md');
  try {
    await rootHandler.write(SANDBOX_REF, 'content');
    assert.fail('Expected error');
  } catch (e) {
    assert.ok(
      e.message.includes('does not exist') || e.message.includes('forge_create'),
      `unexpected: ${e.message}`
    );
  }
});

// ---------------------------------------------------------------------------
// IRootRegistry — delete
// ---------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section IRootRegistry]
await testAsync('delete removes the file', async () => {
  sandboxCreate('fr-test.md', 'content');
  await rootHandler.delete(SANDBOX_REF);
  assert.ok(!fs.existsSync(urlRefPath(SANDBOX_REF)), 'file still exists after delete');
});

// @convention conventions/forge.md v7.0 [section IRootRegistry]
await testAsync('delete throws for missing file', async () => {
  sandboxClean('fr-test.md');
  try {
    await rootHandler.delete(SANDBOX_REF);
    assert.fail('Expected error');
  } catch (e) {
    assert.ok(e.message.length > 0);
  }
});

// ---------------------------------------------------------------------------
// list — returns { folders: UrlRef[], artifacts: UrlRef[] }
// ---------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section Root registry]
await testAsync('list returns folders and artifacts as UrlRef objects', async () => {
  const result = await rootHandler.list(FIXTURES_DIR_REF);
  assert.ok(result && typeof result === 'object', 'list did not return an object');
  assert.ok(Array.isArray(result.folders), 'folders is not an array');
  assert.ok(Array.isArray(result.artifacts), 'artifacts is not an array');
});

// @convention conventions/forge.md v7.0 [section Root registry]
await testAsync('list folders contain UrlRef with root, path, name, extension', async () => {
  const result = await rootHandler.list(FIXTURES_DIR_REF);
  assert.ok(result.folders.length > 0, 'no folders found');
  const folder = result.folders[0];
  assert.ok('root' in folder, 'folder UrlRef missing root');
  assert.ok('path' in folder, 'folder UrlRef missing path');
  assert.ok('name' in folder, 'folder UrlRef missing name');
  assert.ok('extension' in folder, 'folder UrlRef missing extension');
});

// @convention conventions/forge.md v7.0 [section Root registry]
await testAsync('list artifacts contain UrlRef with extension', async () => {
  const result = await rootHandler.list(FIXTURES_DIR_REF);
  assert.ok(result.artifacts.length > 0, 'no artifacts found');
  const artifact = result.artifacts[0];
  assert.ok('extension' in artifact, 'artifact UrlRef missing extension');
  assert.ok(artifact.extension.startsWith('.'), `extension should start with dot: ${artifact.extension}`);
});

// @convention conventions/forge.md v7.0 [section Root registry]
await testAsync('list finds sample.md in fixtures', async () => {
  const result = await rootHandler.list(FIXTURES_DIR_REF);
  const sample = result.artifacts.find(r => r.name === 'sample' && r.extension === '.md');
  assert.ok(sample, 'sample.md not found in list result');
});

// @convention conventions/forge.md v7.0 [section Root registry]
await testAsync('list finds sandbox/ folder in fixtures', async () => {
  const result = await rootHandler.list(FIXTURES_DIR_REF);
  const sandbox = result.folders.find(r => r.name === 'sandbox');
  assert.ok(sandbox, 'sandbox/ folder not found in list result');
});

// ---------------------------------------------------------------------------
// mkdir / rmdir
// ---------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section Root registry]
await testAsync('mkdir creates a folder', async () => {
  const dirRef = { root: 'test', path: 'sandbox/', name: 'tmpdir', extension: '' };
  const dirPath = path.join(SANDBOX_DIR, 'tmpdir');
  if (fs.existsSync(dirPath)) fs.rmdirSync(dirPath);
  await rootHandler.mkdir(dirRef);
  assert.ok(fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory());
  fs.rmdirSync(dirPath);
});

// @convention conventions/forge.md v7.0 [section Root registry]
await testAsync('mkdir throws if folder already exists', async () => {
  const dirRef = { root: 'test', path: 'sandbox/', name: 'tmpdir', extension: '' };
  const dirPath = path.join(SANDBOX_DIR, 'tmpdir');
  fs.mkdirSync(dirPath, { recursive: true });
  try {
    await rootHandler.mkdir(dirRef);
    assert.fail('Expected error');
  } catch (e) {
    assert.ok(e.message.length > 0);
  } finally {
    fs.rmdirSync(dirPath);
  }
});

// @convention conventions/forge.md v7.0 [section Root registry]
await testAsync('rmdir removes an empty folder', async () => {
  const dirRef = { root: 'test', path: 'sandbox/', name: 'tmpdir', extension: '' };
  const dirPath = path.join(SANDBOX_DIR, 'tmpdir');
  fs.mkdirSync(dirPath, { recursive: true });
  await rootHandler.rmdir(dirRef);
  assert.ok(!fs.existsSync(dirPath));
});

// @convention conventions/forge.md v7.0 [section Root registry]
await testAsync('rmdir throws if folder is not empty', async () => {
  const dirRef = { root: 'test', path: 'sandbox/', name: 'tmpdir', extension: '' };
  const dirPath = path.join(SANDBOX_DIR, 'tmpdir');
  fs.mkdirSync(dirPath, { recursive: true });
  fs.writeFileSync(path.join(dirPath, 'file.txt'), 'x');
  try {
    await rootHandler.rmdir(dirRef);
    assert.fail('Expected error');
  } catch (e) {
    assert.ok(e.message.length > 0);
  } finally {
    fs.rmSync(dirPath, { recursive: true });
  }
});

// ---------------------------------------------------------------------------
// rename
// ---------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section Root registry]
await testAsync('rename renames a folder in place', async () => {
  const srcRef = { root: 'test', path: 'sandbox/', name: 'tmpdir-src', extension: '' };
  const srcPath = path.join(SANDBOX_DIR, 'tmpdir-src');
  const dstPath = path.join(SANDBOX_DIR, 'tmpdir-dst');
  fs.mkdirSync(srcPath, { recursive: true });
  if (fs.existsSync(dstPath)) fs.rmdirSync(dstPath);
  await rootHandler.rename(srcRef, 'tmpdir-dst');
  assert.ok(!fs.existsSync(srcPath), 'source still exists');
  assert.ok(fs.existsSync(dstPath), 'destination not created');
  fs.rmdirSync(dstPath);
});

// @convention conventions/forge.md v7.0 [section Root registry]
await testAsync('rename throws if target name already exists', async () => {
  const srcRef = { root: 'test', path: 'sandbox/', name: 'tmpdir-src', extension: '' };
  const srcPath = path.join(SANDBOX_DIR, 'tmpdir-src');
  const dstPath = path.join(SANDBOX_DIR, 'tmpdir-dst');
  fs.mkdirSync(srcPath, { recursive: true });
  fs.mkdirSync(dstPath, { recursive: true });
  try {
    await rootHandler.rename(srcRef, 'tmpdir-dst');
    assert.fail('Expected error');
  } catch (e) {
    assert.ok(e.message.length > 0);
  } finally {
    fs.rmdirSync(srcPath);
    fs.rmdirSync(dstPath);
  }
});

// ---------------------------------------------------------------------------
// move
// ---------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section Root registry]
await testAsync('move moves a folder to a new location', async () => {
  const srcRef = { root: 'test', path: 'sandbox/', name: 'move-src', extension: '' };
  const dstRef = { root: 'test', path: 'sandbox/', name: 'move-dst', extension: '' };
  const srcPath = path.join(SANDBOX_DIR, 'move-src');
  const dstPath = path.join(SANDBOX_DIR, 'move-dst');
  fs.mkdirSync(srcPath, { recursive: true });
  if (fs.existsSync(dstPath)) fs.rmdirSync(dstPath);
  await rootHandler.move(srcRef, dstRef);
  assert.ok(!fs.existsSync(srcPath), 'source still exists');
  assert.ok(fs.existsSync(dstPath), 'destination not created');
  fs.rmdirSync(dstPath);
});

// @convention conventions/forge.md v7.0 [section Root registry]
await testAsync('move throws if target already exists', async () => {
  const srcRef = { root: 'test', path: 'sandbox/', name: 'move-src', extension: '' };
  const dstRef = { root: 'test', path: 'sandbox/', name: 'move-dst', extension: '' };
  const srcPath = path.join(SANDBOX_DIR, 'move-src');
  const dstPath = path.join(SANDBOX_DIR, 'move-dst');
  fs.mkdirSync(srcPath, { recursive: true });
  fs.mkdirSync(dstPath, { recursive: true });
  try {
    await rootHandler.move(srcRef, dstRef);
    assert.fail('Expected error');
  } catch (e) {
    assert.ok(e.message.length > 0);
  } finally {
    fs.rmdirSync(srcPath);
    fs.rmdirSync(dstPath);
  }
});

summary();
