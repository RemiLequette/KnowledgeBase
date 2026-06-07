/**
 * forge-brand.test.js
 *
 * Tests for the Brand gate.
 *
 * Brand principle: a FAL is only valid if it was issued by Forge (via forge_ls
 * or forge_mkdir). A manually constructed FAL is rejected with:
 *   "This FAL was not issued by Forge — call forge_ls to obtain a valid FAL."
 *
 * Gate order (v7.0): Brand gate is checked BEFORE RTFM gate (in mcp-tools.js dispatch).
 * An unbranded + undescribed FAL triggers the Brand error, not RTFM.
 *
 * References:
 *   - conventions/forge.md v7.0 [section Brand principle]
 *   - conventions/forge.md v7.0 [section Registry / Type registry — Brand gate]
 *   - conventions/forge.md v7.0 [section MCP tools — Brand principle]
 *   - guides/working-with-forge.md [section The Brand principle]
 */

import assert from 'assert';
import { TypeRegistry, RootRegistry, testConfig } from '../../public/tools/forge/forge.js';
import { brand, brandRegistry } from '../../public/tools/forge/src/brand.js';
import { parseFAL } from '../../public/tools/forge/src/fal.js';
import { dispatch } from '../../public/tools/forge/src/mcp-tools.js';

const MANUAL_FAL = 'forge://test/sample.md';
const BRAND_MSG  = 'This FAL was not issued by Forge — call forge_ls to obtain a valid FAL.';
const RTFM_MSG   = 'Call forge_describe(fal) first — RTFM: no read or write before the type is understood.';

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

// @convention conventions/forge.md [section Brand principle — Brand registry is session-scoped]
await testAsync('Brand registry is empty at startup', async () => {
  await makeCtx();
  assert.strictEqual(brandRegistry.size, 0,
    `Brand registry should be empty at init, has ${brandRegistry.size} entries`);
});

// @convention conventions/forge.md [section Brand principle — Brand gate before RTFM gate]
await testAsync('Brand gate fires before RTFM gate — unbranded + undescribed FAL throws Brand not RTFM', async () => {
  const ctx = await makeCtx();
  // Neither branded nor described
  const result = await dispatch('forge_read', { fal: MANUAL_FAL }, ctx);
  assert.ok(result.isError, 'Expected isError=true');
  const body = JSON.parse(result.content[0].text);
  assert.strictEqual(body.error, BRAND_MSG,
    `Expected Brand message (gate order v7.0), got: ${body.error}`);
  assert.notStrictEqual(body.error, RTFM_MSG,
    'RTFM gate fired before Brand gate — wrong order');
});

// @convention conventions/forge.md [section Brand principle]
await testAsync('forge_read with unbranded FAL throws Brand message (even after describe)', async () => {
  const ctx = await makeCtx();
  // Describe but do NOT brand
  const ref = parseFAL(MANUAL_FAL);
  ctx.typeRegistry.describe(ref);
  const result = await dispatch('forge_read', { fal: MANUAL_FAL }, ctx);
  assert.ok(result.isError, 'Expected isError=true');
  const body = JSON.parse(result.content[0].text);
  assert.strictEqual(body.error, BRAND_MSG, `Expected Brand message, got: ${body.error}`);
});

// @convention conventions/forge.md [section Brand principle]
await testAsync('forge_write with unbranded FAL throws Brand message (even after describe)', async () => {
  const ctx = await makeCtx();
  const ref = parseFAL(MANUAL_FAL);
  ctx.typeRegistry.describe(ref);
  const result = await dispatch('forge_write', { fal: MANUAL_FAL, content: 'x' }, ctx);
  assert.ok(result.isError, 'Expected isError=true');
  const body = JSON.parse(result.content[0].text);
  assert.strictEqual(body.error, BRAND_MSG, `Expected Brand message, got: ${body.error}`);
});

// @convention conventions/forge.md [section Brand principle — forge_ls registers FALs]
await testAsync('forge_ls registers FALs in Brand registry', async () => {
  const ctx = await makeCtx();
  assert.strictEqual(brandRegistry.size, 0, 'Brand registry should be empty before forge_ls');
  await dispatch('forge_ls', { fal: 'forge://test/' }, ctx);
  assert.ok(brandRegistry.size > 0, 'Brand registry should be populated after forge_ls');
  assert.ok(brandRegistry.has(MANUAL_FAL), `${MANUAL_FAL} should be in Brand registry after forge_ls`);
});

// @convention conventions/forge.md [section Brand principle — forge_ls registers FALs]
await testAsync('forge_ls then forge_describe then forge_read succeeds', async () => {
  const ctx = await makeCtx();
  await dispatch('forge_ls', { fal: 'forge://test/' }, ctx);
  await dispatch('forge_describe', { fal: MANUAL_FAL }, ctx);
  const result = await dispatch('forge_read', { fal: MANUAL_FAL }, ctx);
  assert.ok(!result.isError, `forge_read should succeed, got: ${result.content[0].text}`);
  assert.ok(result.content[0].text.includes('# Sample'), 'content does not look like sample.md');
});

// @convention conventions/forge.md [section Brand principle — forge_mkdir registers FALs]
await testAsync('forge_mkdir registers the folder FAL in Brand registry', async () => {
  const ctx = await makeCtx();
  const sandboxFAL = 'forge://test/sandbox/';
  // sandbox/ already exists in fixtures — rmdir first to avoid conflict, then mkdir
  // (or just test that after mkdir the FAL is branded)
  // We use a sub-folder that does not exist
  const tmpFAL = 'forge://test/sandbox/brand-test-tmp/';
  await dispatch('forge_mkdir', { fal: tmpFAL }, ctx);
  assert.ok(brandRegistry.has(tmpFAL), `${tmpFAL} should be in Brand registry after forge_mkdir`);
  // Cleanup
  await dispatch('forge_rmdir', { fal: tmpFAL }, ctx);
});

console.log(`\n${failed === 0 ? 'All tests passed' : `${failed} test(s) failed`}`);
process.exit(failed > 0 ? 1 : 0);
