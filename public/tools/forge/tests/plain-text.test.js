/**
 * plain-text.test.js
 *
 * Unit tests for the plain-text type handler — v7.0 interface.
 * All tests MUST FAIL on the current handler (v1.3) which uses the v6.x interface.
 *
 * Tests the new interface:
 *   claim(urlRef, rootRegistry)
 *   readBlock(urlRef, block, rootRegistry)
 *   writeBlock(urlRef, block, content, rootRegistry)
 *   createArtifact(urlRef, rootRegistry)
 *   listBlocks / insertBlock / appendBlock / deleteBlock — stub throws
 *
 * References:
 *   - conventions/forge.md v7.0 [section Type handlers]
 *   - conventions/forge.md v7.0 [section IRootRegistry]
 */

import assert from 'assert';
import fs from 'fs';
import { test, testAsync, summary, urlRef, urlRefPath, sandboxCreate, sandboxClean, sandboxRead } from './forge-testable.js';
import * as handler from '../handlers/plain-text.js';

// ---------------------------------------------------------------------------
// Minimal IRootRegistry stub
// Implements create/read/write/delete on UrlRef objects.
// Used to test the handler in isolation — no real RootRegistry needed.
// ---------------------------------------------------------------------------

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
  async delete(ref) {
    fs.unlinkSync(urlRefPath(ref));
  }
};

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SAMPLE_REF  = urlRef('sample', '.md');
const SANDBOX_REF = urlRef('pt-write-test', '.md', 'sandbox');
const MISSING_REF = urlRef('does-not-exist', '.md');

// ---------------------------------------------------------------------------
// claim
// ---------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section Type handlers]
test('claim returns true for .md UrlRef', () => {
  assert.strictEqual(handler.claim(urlRef('sample', '.md'), rootRegistry), true);
});

// @convention conventions/forge.md v7.0 [section Type handlers]
test('claim returns true for .txt UrlRef', () => {
  assert.strictEqual(handler.claim(urlRef('notes', '.txt'), rootRegistry), true);
});

// @convention conventions/forge.md v7.0 [section Type handlers]
test('claim returns true for .js UrlRef', () => {
  assert.strictEqual(handler.claim(urlRef('script', '.js'), rootRegistry), true);
});

// @convention conventions/forge.md v7.0 [section Type handlers]
test('claim returns false for .pdf UrlRef', () => {
  assert.strictEqual(handler.claim(urlRef('doc', '.pdf'), rootRegistry), false);
});

// @convention conventions/forge.md v7.0 [section Type handlers]
test('claim returns false for .zip UrlRef', () => {
  assert.strictEqual(handler.claim(urlRef('archive', '.zip'), rootRegistry), false);
});

// @convention conventions/forge.md v7.0 [section Type handlers]
test('claim returns false for UrlRef with no extension', () => {
  assert.strictEqual(handler.claim(urlRef('Makefile', ''), rootRegistry), false);
});

// ---------------------------------------------------------------------------
// readBlock
// ---------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section Type handlers]
await testAsync('readBlock returns full file content for sample.md', async () => {
  const content = await handler.readBlock(SAMPLE_REF, '', rootRegistry);
  assert.ok(typeof content === 'string' && content.length > 0, 'content is empty');
  assert.ok(content.includes('# Sample'), 'expected sample.md heading');
});

// @convention conventions/forge.md v7.0 [section Type handlers]
await testAsync('readBlock with non-empty block throws no-block-structure error', async () => {
  try {
    await handler.readBlock(SAMPLE_REF, 'some-block', rootRegistry);
    assert.fail('Expected error for named block on plain-text type');
  } catch (e) {
    assert.ok(e.message.includes('no block structure'), `unexpected: ${e.message}`);
  }
});

// @convention conventions/forge.md v7.0 [section Type handlers]
await testAsync('readBlock on non-existent file throws', async () => {
  try {
    await handler.readBlock(MISSING_REF, '', rootRegistry);
    assert.fail('Expected error for missing file');
  } catch (e) {
    assert.ok(e.message.length > 0, 'error message is empty');
  }
});

// ---------------------------------------------------------------------------
// createArtifact
// ---------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section Type handlers — createArtifact contract]
await testAsync('createArtifact creates an empty file', async () => {
  sandboxClean('pt-write-test.md');
  await handler.createArtifact(SANDBOX_REF, rootRegistry);
  assert.ok(fs.existsSync(urlRefPath(SANDBOX_REF)), 'file was not created');
  assert.strictEqual(sandboxRead('pt-write-test.md'), '', 'file is not empty after create');
  sandboxClean('pt-write-test.md');
});

// @convention conventions/forge.md v7.0 [section Type handlers — createArtifact contract]
await testAsync('createArtifact throws if file already exists', async () => {
  sandboxCreate('pt-write-test.md', 'existing content');
  try {
    await handler.createArtifact(SANDBOX_REF, rootRegistry);
    assert.fail('Expected error on already-existing file');
  } catch (e) {
    assert.ok(e.message.length > 0, 'error message is empty');
  } finally {
    sandboxClean('pt-write-test.md');
  }
});

// ---------------------------------------------------------------------------
// writeBlock
// ---------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section Type handlers — writeBlock contract]
await testAsync('writeBlock replaces full file content', async () => {
  sandboxCreate('pt-write-test.md', 'old content');
  await handler.writeBlock(SANDBOX_REF, '', 'new content', rootRegistry);
  assert.strictEqual(sandboxRead('pt-write-test.md'), 'new content');
  sandboxClean('pt-write-test.md');
});

// @convention conventions/forge.md v7.0 [section Type handlers — writeBlock contract]
await testAsync('writeBlock throws if file does not exist', async () => {
  sandboxClean('pt-write-test.md');
  try {
    await handler.writeBlock(SANDBOX_REF, '', 'content', rootRegistry);
    assert.fail('Expected error for missing file');
  } catch (e) {
    assert.ok(
      e.message.includes('forge_create') || e.message.includes('does not exist'),
      `unexpected error: ${e.message}`
    );
  }
});

// @convention conventions/forge.md v7.0 [section Type handlers]
await testAsync('writeBlock with non-empty block throws no-block-structure error', async () => {
  sandboxCreate('pt-write-test.md', 'content');
  try {
    await handler.writeBlock(SANDBOX_REF, 'some-block', 'new', rootRegistry);
    assert.fail('Expected error for named block on plain-text type');
  } catch (e) {
    assert.ok(e.message.includes('no block structure'), `unexpected: ${e.message}`);
  } finally {
    sandboxClean('pt-write-test.md');
  }
});

// @convention conventions/forge.md v7.0 [section Type handlers — writeBlock contract]
await testAsync('createArtifact then writeBlock succeeds', async () => {
  sandboxClean('pt-write-test.md');
  await handler.createArtifact(SANDBOX_REF, rootRegistry);
  await handler.writeBlock(SANDBOX_REF, '', '# Hello', rootRegistry);
  assert.strictEqual(sandboxRead('pt-write-test.md'), '# Hello');
  sandboxClean('pt-write-test.md');
});

// ---------------------------------------------------------------------------
// Block operation stubs — must all throw
// ---------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section Type handlers]
await testAsync('listBlocks throws — no block structure', async () => {
  try {
    await handler.listBlocks(SAMPLE_REF, '', rootRegistry);
    assert.fail('Expected error');
  } catch (e) { assert.ok(e.message.length > 0); }
});

await testAsync('insertBlock throws — not implemented', async () => {
  try {
    await handler.insertBlock(SAMPLE_REF, 'x', 'y', rootRegistry);
    assert.fail('Expected error');
  } catch (e) { assert.ok(e.message.length > 0); }
});

await testAsync('appendBlock throws — not implemented', async () => {
  try {
    await handler.appendBlock(SAMPLE_REF, '', 'x', rootRegistry);
    assert.fail('Expected error');
  } catch (e) { assert.ok(e.message.length > 0); }
});

await testAsync('deleteBlock throws — not implemented', async () => {
  try {
    await handler.deleteBlock(SAMPLE_REF, 'x', rootRegistry);
    assert.fail('Expected error');
  } catch (e) { assert.ok(e.message.length > 0); }
});

// ---------------------------------------------------------------------------
// Artifact CRUD stubs
// ---------------------------------------------------------------------------

await testAsync('deleteArtifact throws — not implemented', async () => {
  try {
    await handler.deleteArtifact(SAMPLE_REF, rootRegistry);
    assert.fail('Expected error');
  } catch (e) { assert.ok(e.message.length > 0); }
});

await testAsync('moveArtifact throws — not implemented', async () => {
  try {
    await handler.moveArtifact(SAMPLE_REF, SANDBOX_REF, rootRegistry);
    assert.fail('Expected error');
  } catch (e) { assert.ok(e.message.length > 0); }
});

await testAsync('renameArtifact throws — not implemented', async () => {
  try {
    await handler.renameArtifact(SAMPLE_REF, 'new-name', rootRegistry);
    assert.fail('Expected error');
  } catch (e) { assert.ok(e.message.length > 0); }
});

summary();
