/**
 * forge-brand.test.js
 *
 * A priori tests for the Brand gate in TypeRegistry.
 * All tests MUST FAIL before the Brand gate is implemented in forge.js.
 *
 * Brand principle: a FAL is only valid if it was issued by Forge (via forge_ls
 * or forge_mkdir). A manually constructed FAL is rejected with:
 *   "This FAL was not issued by Forge — call forge_ls to obtain a valid FAL."
 *
 * References:
 *   - conventions/forge.md v6.4 [section Brand principle]
 *   - conventions/forge.md v6.4 [section Registry / Type registry — Brand gate]
 *   - conventions/forge.md v6.4 [section MCP tools — Brand principle]
 *   - guides/working-with-forge.md v1.2 [section The Brand principle]
 *
 * Not yet in references: none
 */

import assert from 'assert';
import { TypeRegistry, RootRegistry, testConfig } from './forge-testable.js';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

async function makeRegistry() {
  const tr = new TypeRegistry();
  await tr.load(testConfig.types);
  const rr = new RootRegistry();
  await rr.load(testConfig.roots);
  return { tr, rr };
}

// A FAL that was never issued by forge_ls — constructed manually
const MANUAL_FAL  = 'forge://test/sample.md';
const BRAND_MSG   = 'This FAL was not issued by Forge — call forge_ls to obtain a valid FAL.';
const RTFM_MSG    = 'Call forge_describe(fal) first — RTFM: no read or write before the type is understood.';

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

// @convention conventions/forge.md [section Brand principle]
await testAsync('forge_read with manually constructed FAL throws Brand message', async () => {
  const { tr } = await makeRegistry();
  // Describe the type so only Brand is tested, not RTFM
  tr.describe(MANUAL_FAL);
  // Do NOT brand — simulates a manually constructed FAL
  try {
    await tr.read(MANUAL_FAL, testConfig.roots);
    assert.fail('Expected Brand error but read succeeded');
  } catch (e) {
    assert.strictEqual(e.message, BRAND_MSG,
      `Expected Brand message, got: ${e.message}`);
  }
});

// @convention conventions/forge.md [section Brand principle]
await testAsync('forge_write with manually constructed FAL throws Brand message', async () => {
  const { tr } = await makeRegistry();
  tr.describe(MANUAL_FAL);
  try {
    await tr.write(MANUAL_FAL, testConfig.roots, '', 'content');
    assert.fail('Expected Brand error but write succeeded');
  } catch (e) {
    assert.strictEqual(e.message, BRAND_MSG,
      `Expected Brand message, got: ${e.message}`);
  }
});

// @convention conventions/forge.md [section Brand principle]
await testAsync('forge_ls registers FALs — forge_read on a forge_ls FAL succeeds', async () => {
  const { tr, rr } = await makeRegistry();
  // forge_ls — discovers and brands FALs
  const entries = await rr.list('forge://test/', testConfig.roots, tr);
  const sampleEntry = entries.find(e => e.fal === MANUAL_FAL);
  assert.ok(sampleEntry, `${MANUAL_FAL} not found after forge_ls`);
  // The FAL must now be in the Brand registry
  assert.ok(tr.brandRegistry.has(MANUAL_FAL),
    `FAL not registered in Brand registry after forge_ls`);
  // Describe + read should both succeed
  tr.describe(MANUAL_FAL);
  const content = await tr.read(MANUAL_FAL, testConfig.roots);
  assert.ok(typeof content === 'string' && content.length > 0,
    'read returned empty content on a branded FAL');
});

// @convention conventions/forge.md [section Registry / Type registry — Brand gate checked after RTFM gate]
await testAsync('RTFM gate fires before Brand gate — unbranded + undescribed FAL throws RTFM not Brand', async () => {
  const { tr } = await makeRegistry();
  // Neither described nor branded
  try {
    await tr.read(MANUAL_FAL, testConfig.roots);
    assert.fail('Expected RTFM error but read succeeded');
  } catch (e) {
    assert.strictEqual(e.message, RTFM_MSG,
      `Expected RTFM (gate order), got: ${e.message}`);
    assert.notStrictEqual(e.message, BRAND_MSG,
      'Brand gate fired before RTFM gate — wrong order');
  }
});

// @convention conventions/forge.md [section Brand principle — Brand registry is session-scoped]
await testAsync('Brand registry is empty at TypeRegistry construction', async () => {
  const { tr } = await makeRegistry();
  assert.strictEqual(tr.brandRegistry.size, 0,
    `Brand registry should be empty at init, has ${tr.brandRegistry.size} entries`);
});

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------

console.log(`\n${failed === 0 ? 'All tests passed' : `${failed} test(s) failed`}`);
process.exit(failed > 0 ? 1 : 0);
