/**
 * forge-rtfm.test.js
 *
 * Tests for the RTFM gate.
 *
 * RTFM principle: forge_read and forge_write require a prior forge_describe
 * call for the artifact's type in the current session. Without it, checkRTFM throws:
 *   "Call forge_describe(fal) first — RTFM: no read or write before the type is understood."
 *
 * Gate order (v7.0): Brand gate is checked BEFORE RTFM gate (in mcp-tools.js dispatch).
 * These tests call checkRTFM directly (bypassing Brand) to test RTFM in isolation,
 * and use dispatch() for integration tests that exercise the full gate sequence.
 *
 * References:
 *   - conventions/forge.md v7.0 [section RTFM principle]
 *   - conventions/forge.md v7.0 [section Registry / Type registry]
 *   - conventions/forge.md v7.0 [section MCP tools]
 *   - guides/working-with-forge.md [section The RTFM workflow]
 */

import assert from 'assert';
import { TypeRegistry, RootRegistry, testConfig } from '../../public/tools/forge/forge.js';
import { brand, brandRegistry, checkRTFM } from '../../public/tools/forge/src/brand.js';
import { parseFAL, toFAL } from '../../public/tools/forge/src/fal.js';
import { dispatch } from '../../public/tools/forge/src/mcp-tools.js';

const RTFM_MSG = 'Call forge_describe(fal) first — RTFM: no read or write before the type is understood.';
const SAMPLE_FAL = 'forge://test/sample.md';

async function makeCtx() {
  brandRegistry.clear();
  const typeRegistry = new TypeRegistry();
  await typeRegistry.load(testConfig.types);
  const rootRegistry = new RootRegistry();
  await rootRegistry.load(testConfig.roots);
  return { typeRegistry, rootRegistry, config: testConfig };
}

let failed = 0;
async function testAsync(name, fn) {
  try {
    await fn();
    console.log('PASS: ' + name);
  } catch (e) {
    console.log('FAIL: ' + name + ' -- ' + e.message);
    failed++;
  }
}

// @convention conventions/forge.md [section Registry / Type registry — described flag]
await testAsync('described flag starts as false for all types at load', async () => {
  const { typeRegistry } = await makeCtx();
  for (const [typeName, entry] of typeRegistry.handlers.entries()) {
    assert.strictEqual(entry.described, false,
      `Type "${typeName}" should have described=false at load, was ${entry.described}`);
  }
});

// @convention conventions/forge.md [section Registry / Type registry — described flag]
await testAsync('forge_describe sets described=true for the type', async () => {
  const { typeRegistry } = await makeCtx();
  const ref = parseFAL(SAMPLE_FAL);
  const mdEntry = typeRegistry.handlers.get('md');
  assert.ok(mdEntry, 'md type not found in registry');
  assert.strictEqual(mdEntry.described, false, 'md should start as described=false');
  typeRegistry.describe(ref);
  assert.strictEqual(mdEntry.described, true, 'md should be described=true after describe()');
});

// @convention conventions/forge.md [section Type handlers / describe()]
await testAsync('forge_describe returns { recognition, capabilities, usage }', async () => {
  const { typeRegistry } = await makeCtx();
  const ref = parseFAL(SAMPLE_FAL);
  const result = typeRegistry.describe(ref);
  assert.ok(result, 'describe() returned nothing');
  assert.ok(typeof result.recognition === 'string', 'recognition missing or not a string');
  assert.ok(result.recognition.startsWith('A FAL ending with .md'),
    `recognition must start with "A FAL ending with .md", got: ${result.recognition}`);
  assert.ok(typeof result.capabilities === 'object', 'capabilities missing');
  assert.ok(typeof result.capabilities.read === 'boolean', 'capabilities.read missing');
  assert.ok(typeof result.capabilities.write === 'boolean', 'capabilities.write missing');
  assert.ok(typeof result.capabilities.blocks === 'boolean', 'capabilities.blocks missing');
  assert.ok(typeof result.usage === 'string', 'usage missing or not a string');
});

// @convention conventions/forge.md [section RTFM principle]
await testAsync('checkRTFM throws RTFM message when type not described', async () => {
  const { typeRegistry } = await makeCtx();
  try {
    checkRTFM('md', typeRegistry);
    assert.fail('Expected RTFM error but checkRTFM did not throw');
  } catch (e) {
    assert.strictEqual(e.message, RTFM_MSG, `Expected RTFM message, got: ${e.message}`);
  }
});

// @convention conventions/forge.md [section RTFM principle]
await testAsync('checkRTFM does not throw after describe', async () => {
  const { typeRegistry } = await makeCtx();
  const ref = parseFAL(SAMPLE_FAL);
  typeRegistry.describe(ref);
  // Should not throw
  checkRTFM('md', typeRegistry);
});

// @convention conventions/forge.md [section RTFM principle]
await testAsync('dispatch forge_read without forge_describe returns RTFM error', async () => {
  const ctx = await makeCtx();
  // Brand the FAL so Brand gate passes, leaving RTFM as the active gate
  brand(SAMPLE_FAL);
  const result = await dispatch('forge_read', { fal: SAMPLE_FAL }, ctx);
  assert.ok(result.isError, 'Expected isError=true');
  const body = JSON.parse(result.content[0].text);
  assert.strictEqual(body.error, RTFM_MSG, `Expected RTFM message, got: ${body.error}`);
});

// @convention conventions/forge.md [section RTFM principle]
await testAsync('dispatch forge_read after forge_describe succeeds', async () => {
  const ctx = await makeCtx();
  // Issue a branded FAL via forge_ls
  const lsResult = await dispatch('forge_ls', { fal: 'forge://test/' }, ctx);
  assert.ok(!lsResult.isError, `forge_ls failed: ${lsResult.content[0].text}`);
  // Describe the type
  const descResult = await dispatch('forge_describe', { fal: SAMPLE_FAL }, ctx);
  assert.ok(!descResult.isError, `forge_describe failed: ${descResult.content[0].text}`);
  // Read
  const readResult = await dispatch('forge_read', { fal: SAMPLE_FAL }, ctx);
  assert.ok(!readResult.isError, `forge_read failed: ${readResult.content[0].text}`);
  assert.ok(readResult.content[0].text.includes('# Sample'), 'content does not look like sample.md');
});

// @convention conventions/forge.md [section RTFM principle — once per type per session]
await testAsync('forge_describe once unlocks all FALs of the same type', async () => {
  const ctx = await makeCtx();
  // Issue FALs via forge_ls
  await dispatch('forge_ls', { fal: 'forge://test/' }, ctx);
  // Describe once with sample.md — unlocks type "md"
  await dispatch('forge_describe', { fal: SAMPLE_FAL }, ctx);
  // Brand a second md FAL and read — RTFM should not fire
  const anotherFal = 'forge://test/other.md';
  brand(anotherFal);
  const result = await dispatch('forge_read', { fal: anotherFal }, ctx);
  // May fail for file-not-found, but NOT for RTFM
  if (result.isError) {
    const body = JSON.parse(result.content[0].text);
    assert.notStrictEqual(body.error, RTFM_MSG,
      'RTFM thrown for second FAL of same type after describe — should be unlocked');
  }
});

console.log(`\n${failed === 0 ? 'All tests passed' : `${failed} test(s) failed`}`);
process.exit(failed > 0 ? 1 : 0);
