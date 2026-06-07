/**
 * type-registry.test.js
 *
 * Unit tests for TypeRegistry — discover, describe, gates, read/write.
 *
 * Gates (Brand + RTFM) are enforced by TypeRegistry.read/write directly.
 *
 * References:
 *   - conventions/forge.md v7.0 [section Registry / Type registry]
 *   - conventions/forge.md v7.0 [section Type discovery]
 *   - conventions/forge.md v7.0 [section Brand principle]
 */

import assert from 'assert';
import { TypeRegistry, RootRegistry, testConfig } from '../../public/tools/forge/forge.js';
import { brand, brandRegistry } from '../../public/tools/forge/src/brand.js';
import { toFAL } from '../../public/tools/forge/src/fal.js';
import { urlRef, artifactRef, sandboxCreate, sandboxClean, sandboxRead } from './helpers.js';

const SAMPLE_URLREF = urlRef('sample', '.md');
const SAMPLE_REF    = artifactRef('sample', 'md');
const SAMPLE_FAL    = toFAL(SAMPLE_REF);
const SANDBOX_REF   = artifactRef('tr-test', 'md', 'sandbox');
const SANDBOX_FAL   = toFAL(SANDBOX_REF);
const BRAND_MSG     = 'This FAL was not issued by Forge — call forge_ls to obtain a valid FAL.';
const RTFM_MSG      = 'Call forge_describe(fal) first — RTFM: no read or write before the type is understood.';

async function makeCtx() {
  brandRegistry.clear();
  const typeRegistry = new TypeRegistry();
  await typeRegistry.load(testConfig.types);
  const rootRegistry = new RootRegistry();
  await rootRegistry.load(testConfig.roots);
  return { typeRegistry, rootRegistry };
}

let failed = 0;
async function testAsync(name, fn) {
  try { await fn(); console.log('PASS: ' + name); }
  catch (e) { console.log('FAIL: ' + name + ' — ' + e.message); failed++; }
}

// -------------------------------------------------------------------------
// Startup state
// -------------------------------------------------------------------------

await testAsync('described=false for all types at startup', async () => {
  const { typeRegistry } = await makeCtx();
  for (const [name, entry] of typeRegistry.handlers.entries()) {
    assert.strictEqual(entry.described, false, `${name} should start described=false`);
  }
});

await testAsync('brandRegistry empty at startup', async () => {
  await makeCtx();
  assert.strictEqual(brandRegistry.size, 0);
});

// -------------------------------------------------------------------------
// discover
// -------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section Type discovery]
await testAsync('discover returns ArtifactRef with correct type for .md', async () => {
  const { typeRegistry, rootRegistry } = await makeCtx();
  const ref = await typeRegistry.discover(SAMPLE_URLREF, rootRegistry);
  assert.strictEqual(ref.root, 'test');
  assert.strictEqual(ref.name, 'sample');
  assert.strictEqual(ref.type, 'md');
  assert.ok('path' in ref);
});

// @convention conventions/forge.md v7.0 [section Type discovery — extension pre-filter]
await testAsync('discover does not return wrong type for .md (pre-filter)', async () => {
  const { typeRegistry, rootRegistry } = await makeCtx();
  const ref = await typeRegistry.discover(SAMPLE_URLREF, rootRegistry);
  assert.notStrictEqual(ref.type, 'css', 'css handler should not claim a .md file');
  assert.notStrictEqual(ref.type, 'js',  'js handler should not claim a .md file');
});

// @convention conventions/forge.md v7.0 [section Type discovery — outcome: 0 claims]
await testAsync('discover returns type=undefined for unknown extension', async () => {
  const { typeRegistry, rootRegistry } = await makeCtx();
  const ref = await typeRegistry.discover(urlRef('archive', '.xyz'), rootRegistry);
  assert.strictEqual(ref.type, 'undefined');
});

// -------------------------------------------------------------------------
// ArtifactRef ↔ UrlRef
// -------------------------------------------------------------------------

await testAsync('artifactRefToUrlRef: type→extension', async () => {
  const { typeRegistry } = await makeCtx();
  const result = typeRegistry.artifactRefToUrlRef(SAMPLE_REF);
  assert.strictEqual(result.root, SAMPLE_REF.root);
  assert.strictEqual(result.name, SAMPLE_REF.name);
  assert.strictEqual(result.extension, '.md');
});

await testAsync('urlRefToArtifactRef: extension→type', async () => {
  const { typeRegistry } = await makeCtx();
  const ref = typeRegistry.urlRefToArtifactRef(SAMPLE_URLREF);
  assert.strictEqual(ref.type, 'md');
});

// -------------------------------------------------------------------------
// describe
// -------------------------------------------------------------------------

await testAsync('describe returns { recognition, capabilities, usage }', async () => {
  const { typeRegistry } = await makeCtx();
  const result = typeRegistry.describe(SAMPLE_REF);
  assert.ok(result.recognition.startsWith('A FAL ending with .md'));
  assert.strictEqual(typeof result.capabilities.read,   'boolean');
  assert.strictEqual(typeof result.capabilities.write,  'boolean');
  assert.strictEqual(typeof result.capabilities.blocks, 'boolean');
  assert.ok(typeof result.usage === 'string');
});

await testAsync('describe sets described=true', async () => {
  const { typeRegistry } = await makeCtx();
  typeRegistry.describe(SAMPLE_REF);
  assert.strictEqual(typeRegistry.handlers.get('md').described, true);
});

// -------------------------------------------------------------------------
// Gate order: Brand before RTFM (enforced in TypeRegistry.read/write)
// -------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section MCP tools — Brand before RTFM]
await testAsync('unbranded + undescribed → Brand error', async () => {
  const { typeRegistry, rootRegistry } = await makeCtx();
  try {
    await typeRegistry.read(SAMPLE_REF, rootRegistry);
    assert.fail('Expected Brand error');
  } catch (e) {
    assert.strictEqual(e.message, BRAND_MSG, `got: ${e.message}`);
  }
});

// @convention conventions/forge.md v7.0 [section MCP tools — Brand before RTFM]
await testAsync('branded + undescribed → RTFM error', async () => {
  const { typeRegistry, rootRegistry } = await makeCtx();
  brand(SAMPLE_FAL);
  try {
    await typeRegistry.read(SAMPLE_REF, rootRegistry);
    assert.fail('Expected RTFM error');
  } catch (e) {
    assert.strictEqual(e.message, RTFM_MSG, `got: ${e.message}`);
  }
});

// -------------------------------------------------------------------------
// read / write happy path
// -------------------------------------------------------------------------

await testAsync('read succeeds after brand + describe', async () => {
  const { typeRegistry, rootRegistry } = await makeCtx();
  brand(SAMPLE_FAL);
  typeRegistry.describe(SAMPLE_REF);
  const content = await typeRegistry.read(SAMPLE_REF, rootRegistry);
  assert.ok(content.includes('# Sample'));
});

await testAsync('write succeeds after brand + describe', async () => {
  const { typeRegistry, rootRegistry } = await makeCtx();
  sandboxCreate('tr-test.md', 'old');
  brand(SANDBOX_FAL);
  typeRegistry.describe(SANDBOX_REF);
  await typeRegistry.write(SANDBOX_REF, rootRegistry, '', 'new content');
  assert.strictEqual(sandboxRead('tr-test.md'), 'new content');
  sandboxClean('tr-test.md');
});

await testAsync('createArtifact requires no gates', async () => {
  const { typeRegistry, rootRegistry } = await makeCtx();
  sandboxClean('tr-test.md');
  await typeRegistry.createArtifact(SANDBOX_REF, rootRegistry);
  assert.strictEqual(sandboxRead('tr-test.md'), '');
  sandboxClean('tr-test.md');
});

console.log(`\n${failed === 0 ? 'All tests passed' : `${failed} test(s) failed`}`);
process.exit(failed > 0 ? 1 : 0);
