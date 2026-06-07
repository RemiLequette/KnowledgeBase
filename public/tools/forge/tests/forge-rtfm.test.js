/**
 * forge-rtfm.test.js
 *
 * Tests for the RTFM gate in TypeRegistry — v7.0 interface.
 * All tests MUST FAIL on the current implementation (v2.4).
 *
 * RTFM principle: forge_read and forge_write require a prior forge_describe
 * call for the artifact's type in the current session. Without it, they throw:
 *   "Call forge_describe(fal) first — RTFM: no read or write before the type is understood."
 *
 * The RTFM gate is checked AFTER the Brand gate (v7.0 design decision).
 * Tests here pre-brand FALs to isolate RTFM behaviour.
 *
 * Note: force parameter removed from forge_describe (v7.0 — see forge.md v7.0 Changelog).
 *
 * References:
 *   - conventions/forge.md v7.0 [section MCP tools — RTFM principle]
 *   - conventions/forge.md v7.0 [section Registry / Type registry — RTFM gate]
 *   - guides/working-with-forge.md v1.3 [section The RTFM workflow]
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

const SAMPLE_REF = artifactRef('sample', 'md');
const SAMPLE_FAL = toFAL(SAMPLE_REF);
const RTFM_MSG   = 'Call forge_describe(fal) first — RTFM: no read or write before the type is understood.';

// ---------------------------------------------------------------------------
// RTFM gate — read
// ---------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section MCP tools — RTFM principle]
await testAsync('forge_read without forge_describe throws RTFM message', async () => {
  const { tr } = await makeRegistries();
  // Pre-brand to isolate RTFM gate
  tr.brandRegistry.add(SAMPLE_FAL);
  try {
    await tr.read(SAMPLE_REF);
    assert.fail('Expected RTFM error but read succeeded');
  } catch (e) {
    assert.strictEqual(e.message, RTFM_MSG, `got: ${e.message}`);
  }
});

// @convention conventions/forge.md v7.0 [section MCP tools — RTFM principle]
await testAsync('forge_write without forge_describe throws RTFM message', async () => {
  const { tr } = await makeRegistries();
  tr.brandRegistry.add(SAMPLE_FAL);
  try {
    await tr.write(SAMPLE_REF, null, '', 'content');
    assert.fail('Expected RTFM error but write succeeded');
  } catch (e) {
    assert.strictEqual(e.message, RTFM_MSG, `got: ${e.message}`);
  }
});

// ---------------------------------------------------------------------------
// describe
// ---------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section Type handlers — describe()]
await testAsync('forge_describe returns { recognition, capabilities, usage }', async () => {
  const { tr } = await makeRegistries();
  const result = tr.describe(SAMPLE_REF);
  assert.ok(result, 'describe returned nothing');
  assert.ok(typeof result.recognition === 'string');
  assert.ok(result.recognition.startsWith('A FAL ending with .md'),
    `recognition: ${result.recognition}`);
  assert.ok(typeof result.capabilities === 'object');
  assert.strictEqual(typeof result.capabilities.read,   'boolean');
  assert.strictEqual(typeof result.capabilities.write,  'boolean');
  assert.strictEqual(typeof result.capabilities.blocks, 'boolean');
  assert.ok(typeof result.usage === 'string');
});

// @convention conventions/forge.md v7.0 [section MCP tools — RTFM principle]
await testAsync('forge_read after forge_describe succeeds', async () => {
  const { tr, rr } = await makeRegistries();
  // Brand via forge_ls
  await rr.list('forge://test/', tr);
  tr.describe(SAMPLE_REF);
  const content = await tr.read(SAMPLE_REF, rr);
  assert.ok(typeof content === 'string' && content.length > 0);
  assert.ok(content.includes('# Sample'));
});

// @convention conventions/forge.md v7.0 [section RTFM principle — once per type]
await testAsync('forge_describe once unlocks all FALs of the same type', async () => {
  const { tr } = await makeRegistries();
  tr.describe(SAMPLE_REF);
  // Brand a second FAL manually — the RTFM gate should already be open for type md
  const otherFAL = 'forge://test/other.md';
  tr.brandRegistry.add(otherFAL);
  const otherRef = artifactRef('other', 'md');
  try {
    await tr.read(otherRef, null);
    // May fail for other reasons — but not RTFM
  } catch (e) {
    assert.notStrictEqual(e.message, RTFM_MSG,
      'RTFM thrown for second FAL of same type after describe — should be unlocked');
  }
});

// ---------------------------------------------------------------------------
// Startup state
// ---------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section Registry / Type registry — described flag]
await testAsync('described=false for all types at startup', async () => {
  const { tr } = await makeRegistries();
  for (const [typeName, entry] of tr.handlers.entries()) {
    assert.strictEqual(entry.described, false,
      `type "${typeName}" should start described=false`);
  }
});

// @convention conventions/forge.md v7.0 [section Registry / Type registry — described flag]
await testAsync('forge_describe sets described=true for the type', async () => {
  const { tr } = await makeRegistries();
  const entry = tr.handlers.get('md');
  assert.ok(entry, 'md not in registry');
  assert.strictEqual(entry.described, false);
  tr.describe(SAMPLE_REF);
  assert.strictEqual(entry.described, true);
});

summary();
