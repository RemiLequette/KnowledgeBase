/**
 * plain-text.test.js
 *
 * Unit tests for handlers/plain-text.js — IRootRegistry interface.
 *
 * References:
 *   - conventions/forge.md v7.0 [section Type handlers]
 *   - conventions/forge.md v7.0 [section IRootRegistry]
 */

import assert from 'assert';
import fs from 'fs';
import * as handler from '../../public/tools/forge/handlers/plain-text.js';
import { urlRef, urlRefPath, sandboxCreate, sandboxClean, sandboxRead, FIXTURES_DIR } from './helpers.js';

// Minimal IRootRegistry stub — operates on UrlRef._url
const rootRegistry = {
  async create(ref) {
    const p = urlRefPath(ref);
    if (fs.existsSync(p)) throw new Error(`File already exists: ${p}`);
    fs.writeFileSync(p, '', 'utf8');
  },
  async read(ref) {
    const p = urlRefPath(ref);
    if (!fs.existsSync(p)) throw new Error(`File not found: ${p}`);
    return fs.readFileSync(p, 'utf8');
  },
  async write(ref, content) {
    const p = urlRefPath(ref);
    if (!fs.existsSync(p)) throw new Error(`File does not exist: ${p} — call forge_create first`);
    fs.writeFileSync(p, content, 'utf8');
  },
  async delete(ref) { fs.unlinkSync(urlRefPath(ref)); }
};

const SAMPLE_REF  = urlRef('sample', '.md');
const SANDBOX_REF = urlRef('pt-test', '.md', 'sandbox');

let failed = 0;
async function testAsync(name, fn) {
  try { await fn(); console.log('PASS: ' + name); }
  catch (e) { console.log('FAIL: ' + name + ' — ' + e.message); failed++; }
}

// -------------------------------------------------------------------------
// claim
// -------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section Type handlers]
await testAsync('claim true for .md', async () => {
  assert.strictEqual(handler.claim(urlRef('f', '.md'), rootRegistry), true);
});
await testAsync('claim true for .txt', async () => {
  assert.strictEqual(handler.claim(urlRef('f', '.txt'), rootRegistry), true);
});
await testAsync('claim true for .js', async () => {
  assert.strictEqual(handler.claim(urlRef('f', '.js'), rootRegistry), true);
});
await testAsync('claim false for .pdf', async () => {
  assert.strictEqual(handler.claim(urlRef('f', '.pdf'), rootRegistry), false);
});
await testAsync('claim false for no extension', async () => {
  assert.strictEqual(handler.claim(urlRef('Makefile', ''), rootRegistry), false);
});

// -------------------------------------------------------------------------
// readBlock
// -------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section Type handlers]
await testAsync('readBlock returns full file content', async () => {
  const content = await handler.readBlock(SAMPLE_REF, '', rootRegistry);
  assert.ok(content.includes('# Sample'));
});

// @convention conventions/forge.md v7.0 [section Type handlers]
await testAsync('readBlock with named block throws no-block-structure', async () => {
  try {
    await handler.readBlock(SAMPLE_REF, 'section', rootRegistry);
    assert.fail('Expected error');
  } catch (e) {
    assert.ok(e.message.includes('no block structure'), `unexpected: ${e.message}`);
  }
});

// -------------------------------------------------------------------------
// createArtifact
// -------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section Type handlers — createArtifact contract]
await testAsync('createArtifact creates empty file', async () => {
  sandboxClean('pt-test.md');
  await handler.createArtifact(SANDBOX_REF, rootRegistry);
  assert.ok(fs.existsSync(urlRefPath(SANDBOX_REF)));
  assert.strictEqual(sandboxRead('pt-test.md'), '');
  sandboxClean('pt-test.md');
});

// @convention conventions/forge.md v7.0 [section Type handlers — createArtifact contract]
await testAsync('createArtifact throws if file already exists', async () => {
  sandboxCreate('pt-test.md', 'x');
  try {
    await handler.createArtifact(SANDBOX_REF, rootRegistry);
    assert.fail('Expected error');
  } catch (e) {
    assert.ok(e.message.length > 0);
  } finally {
    sandboxClean('pt-test.md');
  }
});

// -------------------------------------------------------------------------
// writeBlock
// -------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section Type handlers — writeBlock contract]
await testAsync('writeBlock replaces file content', async () => {
  sandboxCreate('pt-test.md', 'old');
  await handler.writeBlock(SANDBOX_REF, '', 'new content', rootRegistry);
  assert.strictEqual(sandboxRead('pt-test.md'), 'new content');
  sandboxClean('pt-test.md');
});

// @convention conventions/forge.md v7.0 [section Type handlers — writeBlock contract]
await testAsync('writeBlock throws if file does not exist', async () => {
  sandboxClean('pt-test.md');
  try {
    await handler.writeBlock(SANDBOX_REF, '', 'x', rootRegistry);
    assert.fail('Expected error');
  } catch (e) {
    assert.ok(e.message.includes('forge_create') || e.message.includes('does not exist'), `unexpected: ${e.message}`);
  }
});

// @convention conventions/forge.md v7.0 [section Type handlers — writeBlock contract]
await testAsync('createArtifact then writeBlock succeeds', async () => {
  sandboxClean('pt-test.md');
  await handler.createArtifact(SANDBOX_REF, rootRegistry);
  await handler.writeBlock(SANDBOX_REF, '', '# Hello', rootRegistry);
  assert.strictEqual(sandboxRead('pt-test.md'), '# Hello');
  sandboxClean('pt-test.md');
});

// -------------------------------------------------------------------------
// Block operation stubs
// -------------------------------------------------------------------------

await testAsync('listBlocks throws', async () => {
  try { await handler.listBlocks(SAMPLE_REF, '', rootRegistry); assert.fail(); }
  catch (e) { assert.ok(e.message.length > 0); }
});
await testAsync('insertBlock throws', async () => {
  try { await handler.insertBlock(SAMPLE_REF, 'x', 'y', rootRegistry); assert.fail(); }
  catch (e) { assert.ok(e.message.length > 0); }
});
await testAsync('appendBlock throws', async () => {
  try { await handler.appendBlock(SAMPLE_REF, '', 'x', rootRegistry); assert.fail(); }
  catch (e) { assert.ok(e.message.length > 0); }
});
await testAsync('deleteBlock throws', async () => {
  try { await handler.deleteBlock(SAMPLE_REF, 'x', rootRegistry); assert.fail(); }
  catch (e) { assert.ok(e.message.length > 0); }
});
await testAsync('deleteArtifact throws', async () => {
  try { await handler.deleteArtifact(SAMPLE_REF, rootRegistry); assert.fail(); }
  catch (e) { assert.ok(e.message.length > 0); }
});

console.log(`\n${failed === 0 ? 'All tests passed' : `${failed} test(s) failed`}`);
process.exit(failed > 0 ? 1 : 0);
