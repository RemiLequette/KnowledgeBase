/**
 * type-registry.test.js
 *
 * Unit tests for TypeRegistry — v7.0 interface.
 * All tests MUST FAIL on the current implementation (v2.4) which uses the v6.x interface.
 *
 * Tests:
 *   - discover(urlRef, rootRegistry) → ArtifactRef
 *   - ArtifactRef ↔ UrlRef conversion (extension field on handler)
 *   - describe(ref) → { recognition, capabilities, usage }; sets described=true per type
 *   - Brand gate fires before RTFM gate
 *   - RTFM gate fires when described=false
 *   - read/write succeed after brand + describe
 *   - described=false at startup for all types
 *   - brandRegistry empty at startup
 *
 * Imports TypeRegistry and RootRegistry from forge.js once they are exported.
 *
 * References:
 *   - conventions/forge.md v7.0 [section Registry]
 *   - conventions/forge.md v7.0 [section Type discovery]
 *   - conventions/forge.md v7.0 [section Brand principle]
 *   - conventions/forge.md v7.0 [section MCP tools — Brand before RTFM]
 */

import assert from 'assert';
import { testAsync, summary, urlRef, artifactRef, toFAL, sandboxCreate, sandboxClean, sandboxRead } from './forge-testable.js';
import { TypeRegistry, RootRegistry, testConfig } from '../forge.js';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

async function makeRegistries() {
  const tr = new TypeRegistry();
  await tr.load(testConfig.types);
  const rr = new RootRegistry();
  await rr.load(testConfig.roots);
  return { tr, rr };
}

const SAMPLE_URLREF   = urlRef('sample', '.md');
const SAMPLE_REF      = artifactRef('sample', 'md');
const SAMPLE_FAL      = toFAL(SAMPLE_REF);
const SANDBOX_REF     = artifactRef('tr-write-test', 'md', 'sandbox');
const SANDBOX_FAL     = toFAL(SANDBOX_REF);
const BRAND_MSG       = 'This FAL was not issued by Forge — call forge_ls to obtain a valid FAL.';
const RTFM_MSG        = 'Call forge_describe(fal) first — RTFM: no read or write before the type is understood.';

// ---------------------------------------------------------------------------
// Startup state
// ---------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section Registry / Type registry — described flag]
await testAsync('described=false for all types at startup', async () => {
  const { tr } = await makeRegistries();
  for (const [typeName, entry] of tr.handlers.entries()) {
    assert.strictEqual(entry.described, false,
      `type "${typeName}" should start with described=false, was ${entry.described}`);
  }
});

// @convention conventions/forge.md v7.0 [section Brand principle]
await testAsync('brandRegistry is empty at startup', async () => {
  const { tr } = await makeRegistries();
  assert.strictEqual(tr.brandRegistry.size, 0,
    `brandRegistry should be empty at startup, has ${tr.brandRegistry.size} entries`);
});

// ---------------------------------------------------------------------------
// discover — UrlRef → ArtifactRef
// ---------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section Type discovery]
await testAsync('discover returns ArtifactRef with correct fields', async () => {
  const { tr, rr } = await makeRegistries();
  const ref = await tr.discover(SAMPLE_URLREF, rr);
  assert.ok(ref && typeof ref === 'object', 'discover did not return an object');
  assert.strictEqual(ref.root,  'test',   `root mismatch: ${ref.root}`);
  assert.strictEqual(ref.name,  'sample', `name mismatch: ${ref.name}`);
  assert.strictEqual(ref.type,  'md',     `type mismatch: ${ref.type}`);
  assert.ok('path' in ref,  'ArtifactRef missing path');
});

// @convention conventions/forge.md v7.0 [section Type discovery]
await testAsync('discover registers the resulting FAL in brandRegistry', async () => {
  const { tr, rr } = await makeRegistries();
  await tr.discover(SAMPLE_URLREF, rr);
  assert.ok(tr.brandRegistry.has(SAMPLE_FAL),
    `FAL ${SAMPLE_FAL} not found in brandRegistry after discover`);
});

// @convention conventions/forge.md v7.0 [section Type discovery — outcome: 0 claims]
await testAsync('discover returns undefined type for unrecognised extension', async () => {
  const { tr, rr } = await makeRegistries();
  const unknownRef = urlRef('archive', '.xyz');
  const ref = await tr.discover(unknownRef, rr);
  assert.strictEqual(ref.type, 'undefined',
    `expected type 'undefined', got '${ref.type}'`);
});

// ---------------------------------------------------------------------------
// ArtifactRef ↔ UrlRef conversion
// ---------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section Registry / Type registry — core responsibility]
await testAsync('handler exposes extension property', async () => {
  const { tr } = await makeRegistries();
  const entry = tr.handlers.get('md');
  assert.ok(entry, 'md handler not found');
  assert.ok(typeof entry.handler.extension === 'string',
    'handler.extension missing or not a string');
  assert.ok(entry.handler.extension.startsWith('.'),
    `extension should start with dot: ${entry.handler.extension}`);
});

// @convention conventions/forge.md v7.0 [section Registry / Type registry — ArtifactRef↔UrlRef]
await testAsync('ArtifactRef→UrlRef: root/path/name pass through, type→extension via handler', async () => {
  const { tr } = await makeRegistries();
  const urlRefResult = tr.artifactRefToUrlRef(SAMPLE_REF);
  assert.strictEqual(urlRefResult.root, SAMPLE_REF.root);
  assert.strictEqual(urlRefResult.path, SAMPLE_REF.path);
  assert.strictEqual(urlRefResult.name, SAMPLE_REF.name);
  assert.ok(urlRefResult.extension.startsWith('.'),
    `extension missing dot: ${urlRefResult.extension}`);
});

// @convention conventions/forge.md v7.0 [section Registry / Type registry — ArtifactRef↔UrlRef]
await testAsync('UrlRef→ArtifactRef: root/path/name pass through, extension→type via handler', async () => {
  const { tr } = await makeRegistries();
  const ref = tr.urlRefToArtifactRef(SAMPLE_URLREF);
  assert.strictEqual(ref.root, SAMPLE_URLREF.root);
  assert.strictEqual(ref.path, SAMPLE_URLREF.path);
  assert.strictEqual(ref.name, SAMPLE_URLREF.name);
  assert.strictEqual(ref.type, 'md');
});

// ---------------------------------------------------------------------------
// describe
// ---------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section Type handlers — describe()]
await testAsync('describe returns { recognition, capabilities, usage }', async () => {
  const { tr } = await makeRegistries();
  const result = tr.describe(SAMPLE_REF);
  assert.ok(result && typeof result === 'object', 'describe returned nothing');
  assert.ok(typeof result.recognition === 'string', 'recognition missing');
  assert.ok(result.recognition.startsWith('A FAL ending with .md'),
    `recognition: ${result.recognition}`);
  assert.ok(typeof result.capabilities === 'object', 'capabilities missing');
  assert.strictEqual(typeof result.capabilities.read,   'boolean');
  assert.strictEqual(typeof result.capabilities.write,  'boolean');
  assert.strictEqual(typeof result.capabilities.blocks, 'boolean');
  assert.ok(typeof result.usage === 'string', 'usage missing');
});

// @convention conventions/forge.md v7.0 [section Registry / Type registry — described flag]
await testAsync('describe sets described=true for the type', async () => {
  const { tr } = await makeRegistries();
  const entry = tr.handlers.get('md');
  assert.strictEqual(entry.described, false);
  tr.describe(SAMPLE_REF);
  assert.strictEqual(entry.described, true);
});

// @convention conventions/forge.md v7.0 [section RTFM principle]
await testAsync('describe once unlocks all FALs of same type', async () => {
  const { tr, rr } = await makeRegistries();
  // Describe via sample.md — unlocks type "md" for the session
  tr.describe(SAMPLE_REF);
  // Brand a second FAL manually to isolate RTFM gate check
  const otherRef = artifactRef('other', 'md', 'sandbox');
  const otherFAL = toFAL(otherRef);
  tr.brandRegistry.add(otherFAL);
  // Should not throw RTFM
  try {
    await tr.read(otherRef, rr);
  } catch (e) {
    assert.notStrictEqual(e.message, RTFM_MSG,
      'RTFM thrown for second FAL of same type — should be unlocked');
  }
});

// ---------------------------------------------------------------------------
// Gate order: Brand before RTFM
// ---------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section MCP tools — Brand before RTFM]
await testAsync('unbranded + undescribed FAL throws Brand message (not RTFM)', async () => {
  const { tr } = await makeRegistries();
  // Neither branded nor described
  try {
    await tr.read(SAMPLE_REF);
    assert.fail('Expected Brand error');
  } catch (e) {
    assert.strictEqual(e.message, BRAND_MSG,
      `Expected Brand gate (first), got: ${e.message}`);
  }
});

// @convention conventions/forge.md v7.0 [section MCP tools — Brand before RTFM]
await testAsync('branded + undescribed FAL throws RTFM message (not Brand)', async () => {
  const { tr } = await makeRegistries();
  tr.brandRegistry.add(SAMPLE_FAL);
  try {
    await tr.read(SAMPLE_REF);
    assert.fail('Expected RTFM error');
  } catch (e) {
    assert.strictEqual(e.message, RTFM_MSG,
      `Expected RTFM gate (second), got: ${e.message}`);
  }
});

// ---------------------------------------------------------------------------
// read / write — happy path
// ---------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section MCP tools]
await testAsync('read succeeds after brand + describe', async () => {
  const { tr, rr } = await makeRegistries();
  tr.brandRegistry.add(SAMPLE_FAL);
  tr.describe(SAMPLE_REF);
  const content = await tr.read(SAMPLE_REF, rr);
  assert.ok(typeof content === 'string' && content.length > 0);
  assert.ok(content.includes('# Sample'));
});

// @convention conventions/forge.md v7.0 [section MCP tools]
await testAsync('write throws Brand if FAL not branded', async () => {
  const { tr, rr } = await makeRegistries();
  tr.describe(SANDBOX_REF);
  sandboxCreate('tr-write-test.md', 'old');
  try {
    await tr.write(SANDBOX_REF, rr, '', 'new');
    assert.fail('Expected Brand error');
  } catch (e) {
    assert.strictEqual(e.message, BRAND_MSG);
  } finally {
    sandboxClean('tr-write-test.md');
  }
});

// @convention conventions/forge.md v7.0 [section MCP tools]
await testAsync('write succeeds after brand + describe', async () => {
  const { tr, rr } = await makeRegistries();
  sandboxCreate('tr-write-test.md', 'old content');
  tr.brandRegistry.add(SANDBOX_FAL);
  tr.describe(SANDBOX_REF);
  await tr.write(SANDBOX_REF, rr, '', 'new content');
  assert.strictEqual(sandboxRead('tr-write-test.md'), 'new content');
  sandboxClean('tr-write-test.md');
});

// ---------------------------------------------------------------------------
// createArtifact — no gates
// ---------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section MCP tools]
await testAsync('createArtifact does not require brand or describe', async () => {
  const { tr, rr } = await makeRegistries();
  sandboxClean('tr-write-test.md');
  // No brand, no describe — createArtifact should still work
  await tr.createArtifact(SANDBOX_REF, rr);
  const { default: fs } = await import('fs');
  const { urlRefPath: urp } = await import('./forge-testable.js');
  const sandboxUrlRef = { root: 'test', path: 'sandbox/', name: 'tr-write-test', extension: '.md' };
  assert.ok(fs.existsSync(urp(sandboxUrlRef)), 'file not created');
  sandboxClean('tr-write-test.md');
});

summary();
