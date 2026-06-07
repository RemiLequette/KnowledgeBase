/**
 * file-root.test.js
 *
 * Unit tests for handlers/file-root.js — IRootRegistry interface.
 *
 * References:
 *   - conventions/forge.md v7.0 [section Root registry]
 *   - conventions/forge.md v7.0 [section IRootRegistry]
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import * as rootHandler from '../../public/tools/forge/handlers/file-root.js';
import { urlRef, urlRefPath, sandboxCreate, sandboxClean, sandboxRead, SANDBOX_DIR, FIXTURES_DIR } from './helpers.js';

// Register the test root so refToPath works without _url
rootHandler.registerRoot('test', 'file:///' + FIXTURES_DIR.replace(/\\/g, '/').replace(/^\//, '') + '/');

const SAMPLE_REF       = urlRef('sample', '.md');
const SANDBOX_REF      = urlRef('fr-test', '.md', 'sandbox');
const MISSING_REF      = urlRef('does-not-exist', '.md');
const FIXTURES_DIR_REF = { root: 'test', path: '', name: '', extension: '', _url: 'file:///' + FIXTURES_DIR.replace(/\\/g, '/').replace(/^\//, '') + '/' };

let failed = 0;
async function testAsync(name, fn) {
  try { await fn(); console.log('PASS: ' + name); }
  catch (e) { console.log('FAIL: ' + name + ' — ' + e.message); failed++; }
}

// -------------------------------------------------------------------------
// create
// -------------------------------------------------------------------------

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

// -------------------------------------------------------------------------
// read
// -------------------------------------------------------------------------

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

// -------------------------------------------------------------------------
// write
// -------------------------------------------------------------------------

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
    assert.ok(e.message.includes('does not exist') || e.message.includes('forge_create'), `unexpected: ${e.message}`);
  }
});

// -------------------------------------------------------------------------
// delete
// -------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section IRootRegistry]
await testAsync('delete removes the file', async () => {
  sandboxCreate('fr-test.md', 'x');
  await rootHandler.delete(SANDBOX_REF);
  assert.ok(!fs.existsSync(urlRefPath(SANDBOX_REF)));
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

// -------------------------------------------------------------------------
// list
// -------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section Root registry]
await testAsync('list returns { folders, artifacts } as UrlRef arrays', async () => {
  const result = await rootHandler.list(FIXTURES_DIR_REF);
  assert.ok(Array.isArray(result.folders),   'folders not an array');
  assert.ok(Array.isArray(result.artifacts), 'artifacts not an array');
});

// @convention conventions/forge.md v7.0 [section Root registry]
await testAsync('list artifact UrlRefs have extension starting with dot', async () => {
  const result = await rootHandler.list(FIXTURES_DIR_REF);
  assert.ok(result.artifacts.length > 0, 'no artifacts found');
  for (const a of result.artifacts) {
    assert.ok(a.extension.startsWith('.'), `extension missing dot: ${a.extension}`);
  }
});

// @convention conventions/forge.md v7.0 [section Root registry]
await testAsync('list finds sample.md', async () => {
  const result = await rootHandler.list(FIXTURES_DIR_REF);
  const sample = result.artifacts.find(r => r.name === 'sample' && r.extension === '.md');
  assert.ok(sample, 'sample.md not found');
});

// @convention conventions/forge.md v7.0 [section Root registry]
await testAsync('list finds sandbox/ folder', async () => {
  const result = await rootHandler.list(FIXTURES_DIR_REF);
  const sandbox = result.folders.find(r => r.name === 'sandbox');
  assert.ok(sandbox, 'sandbox/ not found');
});

// -------------------------------------------------------------------------
// mkdir / rmdir
// -------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section Root registry]
await testAsync('mkdir creates a folder', async () => {
  const dirRef = urlRef('tmpdir', '', 'sandbox');
  dirRef.extension = '';
  const dirPath = path.join(SANDBOX_DIR, 'tmpdir');
  if (fs.existsSync(dirPath)) fs.rmdirSync(dirPath);
  await rootHandler.mkdir(dirRef);
  assert.ok(fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory());
  fs.rmdirSync(dirPath);
});

// @convention conventions/forge.md v7.0 [section Root registry]
await testAsync('rmdir removes an empty folder', async () => {
  const dirRef = urlRef('tmpdir', '', 'sandbox');
  dirRef.extension = '';
  const dirPath = path.join(SANDBOX_DIR, 'tmpdir');
  fs.mkdirSync(dirPath, { recursive: true });
  await rootHandler.rmdir(dirRef);
  assert.ok(!fs.existsSync(dirPath));
});

// @convention conventions/forge.md v7.0 [section Root registry]
await testAsync('rmdir throws if folder not empty', async () => {
  const dirRef = urlRef('tmpdir', '', 'sandbox');
  dirRef.extension = '';
  const dirPath = path.join(SANDBOX_DIR, 'tmpdir');
  fs.mkdirSync(dirPath, { recursive: true });
  fs.writeFileSync(path.join(dirPath, 'x.txt'), 'x');
  try {
    await rootHandler.rmdir(dirRef);
    assert.fail('Expected error');
  } catch (e) {
    assert.ok(e.message.length > 0);
  } finally {
    fs.rmSync(dirPath, { recursive: true });
  }
});

// -------------------------------------------------------------------------
// rename / move
// -------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section Root registry]
await testAsync('rename renames a folder in place', async () => {
  const srcRef = urlRef('ren-src', '', 'sandbox'); srcRef.extension = '';
  const srcPath = path.join(SANDBOX_DIR, 'ren-src');
  const dstPath = path.join(SANDBOX_DIR, 'ren-dst');
  fs.mkdirSync(srcPath, { recursive: true });
  if (fs.existsSync(dstPath)) fs.rmdirSync(dstPath);
  await rootHandler.rename(srcRef, 'ren-dst');
  assert.ok(!fs.existsSync(srcPath));
  assert.ok(fs.existsSync(dstPath));
  fs.rmdirSync(dstPath);
});

// @convention conventions/forge.md v7.0 [section Root registry]
await testAsync('move moves a folder', async () => {
  const srcRef = urlRef('mv-src', '', 'sandbox'); srcRef.extension = '';
  const dstRef = urlRef('mv-dst', '', 'sandbox'); dstRef.extension = '';
  const srcPath = path.join(SANDBOX_DIR, 'mv-src');
  const dstPath = path.join(SANDBOX_DIR, 'mv-dst');
  fs.mkdirSync(srcPath, { recursive: true });
  if (fs.existsSync(dstPath)) fs.rmdirSync(dstPath);
  await rootHandler.move(srcRef, dstRef);
  assert.ok(!fs.existsSync(srcPath));
  assert.ok(fs.existsSync(dstPath));
  fs.rmdirSync(dstPath);
});

console.log(`\n${failed === 0 ? 'All tests passed' : `${failed} test(s) failed`}`);
process.exit(failed > 0 ? 1 : 0);
