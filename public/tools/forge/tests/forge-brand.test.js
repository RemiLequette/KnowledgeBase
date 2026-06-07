/**
 * forge-brand.test.js
 *
 * Tests for the Brand gate in TypeRegistry — v7.0 interface.
 * All tests MUST FAIL on the current implementation (v2.4).
 *
 * Brand principle: a FAL is only valid if it was issued by Forge (via forge_ls
 * or forge_mkdir). A manually constructed FAL is rejected with:
 *   "This FAL was not issued by Forge — call forge_ls to obtain a valid FAL."
 *
 * Gate order (v7.0): Brand gate fires BEFORE RTFM gate.
 * An unbranded FAL throws Brand regardless of the described flag.
 *
 * References:
 *   - conventions/forge.md v7.0 [section Brand principle]
 *   - conventions/forge.md v7.0 [section Registry / Type registry — Brand gate]
 *   - conventions/forge.md v7.0 [section MCP tools — Brand before RTFM]
 *   - guides/working-with-forge.md v1.3 [section The Brand principle]
 */

import assert from 'assert';
import { testAsync, summary, artifactRef, toFAL } from './forge-testable.js';
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

const SAMPLE_REF  = artifactRef('sample', 'md');
const SAMPLE_FAL  = toFAL(SAMPLE_REF);
const BRAND_MSG   = 'This FAL was not issued by Forge — call forge_ls to obtain a valid FAL.';
const RTFM_MSG    = 'Call forge_describe(fal) first — RTFM: no read or write before the type is understood.';

// ---------------------------------------------------------------------------
// Brand gate — fires first
// ---------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section Brand principle]
await testAsync('forge_read with unbranded + described FAL throws Brand message', async () => {
  const { tr } = await makeRegistries();
  // Describe so only Brand is tested
  tr.describe(SAMPLE_REF);
  // Do NOT brand
  try {
    await tr.read(SAMPLE_REF);
    assert.fail('Expected Brand error');
  } catch (e) {
    assert.strictEqual(e.message, BRAND_MSG, `got: ${e.message}`);
  }
});

// @convention conventions/forge.md v7.0 [section Brand principle]
await testAsync('forge_write with unbranded + described FAL throws Brand message', async () => {
  const { tr } = await makeRegistries();
  tr.describe(SAMPLE_REF);
  try {
    await tr.write(SAMPLE_REF, null, '', 'content');
    assert.fail('Expected Brand error');
  } catch (e) {
    assert.strictEqual(e.message, BRAND_MSG, `got: ${e.message}`);
  }
});

// @convention conventions/forge.md v7.0 [section MCP tools — Brand before RTFM]
await testAsync('unbranded + undescribed FAL throws Brand message (not RTFM)', async () => {
  const { tr } = await makeRegistries();
  // Neither branded nor described — Brand gate must fire first
  try {
    await tr.read(SAMPLE_REF);
    assert.fail('Expected Brand error');
  } catch (e) {
    assert.strictEqual(e.message, BRAND_MSG,
      `Expected Brand (first gate), got: ${e.message}`);
    assert.notStrictEqual(e.message, RTFM_MSG,
      'RTFM fired before Brand — wrong order');
  }
});

// ---------------------------------------------------------------------------
// Brand registry — populated by forge_ls
// ---------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section Brand principle]
await testAsync('forge_ls registers artifact FALs in brandRegistry', async () => {
  const { tr, rr } = await makeRegistries();
  await rr.list('forge://test/', tr);
  assert.ok(tr.brandRegistry.has(SAMPLE_FAL),
    `${SAMPLE_FAL} not in brandRegistry after forge_ls`);
});

// @convention conventions/forge.md v7.0 [section Brand principle]
await testAsync('forge_ls registers folder FALs in brandRegistry', async () => {
  const { tr, rr } = await makeRegistries();
  await rr.list('forge://test/', tr);
  const folderFAL = 'forge://test/sandbox/';
  assert.ok(tr.brandRegistry.has(folderFAL),
    `${folderFAL} not in brandRegistry after forge_ls`);
});

// @convention conventions/forge.md v7.0 [section Brand principle]
await testAsync('forge_ls FAL + describe allows forge_read to succeed', async () => {
  const { tr, rr } = await makeRegistries();
  await rr.list('forge://test/', tr);
  tr.describe(SAMPLE_REF);
  const content = await tr.read(SAMPLE_REF, rr);
  assert.ok(typeof content === 'string' && content.length > 0);
  assert.ok(content.includes('# Sample'));
});

// ---------------------------------------------------------------------------
// Brand registry — startup state
// ---------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section Brand principle — session-scoped]
await testAsync('brandRegistry is empty at startup', async () => {
  const { tr } = await makeRegistries();
  assert.strictEqual(tr.brandRegistry.size, 0,
    `brandRegistry should be empty at startup, has ${tr.brandRegistry.size} entries`);
});

// @convention conventions/forge.md v7.0 [section Brand principle — session-scoped]
await testAsync('brandRegistry is independent between TypeRegistry instances', async () => {
  const { tr: tr1 } = await makeRegistries();
  const { tr: tr2 } = await makeRegistries();
  tr1.brandRegistry.add(SAMPLE_FAL);
  assert.ok(tr1.brandRegistry.has(SAMPLE_FAL));
  assert.ok(!tr2.brandRegistry.has(SAMPLE_FAL),
    'brandRegistry leaked between instances');
});

summary();
