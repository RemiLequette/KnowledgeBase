/**
 * integration.test.js
 *
 * End-to-end tests — forge_ls → describe → read/write cycle via dispatch().
 *
 * References:
 *   - conventions/forge.md v7.0 [section MCP tools]
 *   - conventions/forge.md v7.0 [section Registry / Sequence diagrams]
 */

import assert from 'assert';
import { TypeRegistry, RootRegistry, testConfig } from '../../public/tools/forge/forge.js';
import { brand, brandRegistry } from '../../public/tools/forge/src/brand.js';
import { dispatch } from '../../public/tools/forge/src/mcp-tools.js';
import { sandboxClean } from './helpers.js';

const FOLDER_FAL  = 'forge://test/';
const SAMPLE_FAL  = 'forge://test/sample.md';
const SANDBOX_FAL = 'forge://test/sandbox/int-test.md';
const BRAND_MSG   = 'This FAL was not issued by Forge — call forge_ls to obtain a valid FAL.';
const RTFM_MSG    = 'Call forge_describe(fal) first — RTFM: no read or write before the type is understood.';

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
  try { await fn(); console.log('PASS: ' + name); }
  catch (e) { console.log('FAIL: ' + name + ' — ' + e.message); failed++; }
}

// -------------------------------------------------------------------------
// forge_ls
// -------------------------------------------------------------------------

await testAsync('forge_ls returns entries with fal and type', async () => {
  const ctx = await makeCtx();
  const result = await dispatch('forge_ls', { fal: FOLDER_FAL }, ctx);
  assert.ok(!result.isError, result.content[0].text);
  const body = JSON.parse(result.content[0].text);
  assert.ok(Array.isArray(body.entries) && body.entries.length > 0);
});

await testAsync('forge_ls brands all returned FALs', async () => {
  const ctx = await makeCtx();
  await dispatch('forge_ls', { fal: FOLDER_FAL }, ctx);
  assert.ok(brandRegistry.has(SAMPLE_FAL), `${SAMPLE_FAL} not branded after forge_ls`);
});

await testAsync('forge_ls finds sample.md', async () => {
  const ctx = await makeCtx();
  const result = await dispatch('forge_ls', { fal: FOLDER_FAL }, ctx);
  const body = JSON.parse(result.content[0].text);
  assert.ok(body.entries.find(e => e.fal === SAMPLE_FAL), 'sample.md not found');
});

// -------------------------------------------------------------------------
// Gate errors
// -------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section Brand principle — Brand before RTFM]
await testAsync('forge_read without forge_ls → Brand error', async () => {
  const ctx = await makeCtx();
  const result = await dispatch('forge_read', { fal: SAMPLE_FAL }, ctx);
  assert.ok(result.isError);
  assert.strictEqual(JSON.parse(result.content[0].text).error, BRAND_MSG);
});

// @convention conventions/forge.md v7.0 [section RTFM principle]
await testAsync('forge_read after forge_ls but without forge_describe → RTFM error', async () => {
  const ctx = await makeCtx();
  await dispatch('forge_ls', { fal: FOLDER_FAL }, ctx);
  const result = await dispatch('forge_read', { fal: SAMPLE_FAL }, ctx);
  assert.ok(result.isError);
  assert.strictEqual(JSON.parse(result.content[0].text).error, RTFM_MSG);
});

// -------------------------------------------------------------------------
// Full read cycle
// -------------------------------------------------------------------------

await testAsync('forge_ls → forge_describe → forge_read succeeds', async () => {
  const ctx = await makeCtx();
  await dispatch('forge_ls',       { fal: FOLDER_FAL }, ctx);
  await dispatch('forge_describe', { fal: SAMPLE_FAL }, ctx);
  const result = await dispatch('forge_read', { fal: SAMPLE_FAL }, ctx);
  assert.ok(!result.isError, result.content[0].text);
  // O8: response starts with [fal: ...] header, content follows
  assert.ok(result.content[0].text.startsWith('[fal:'), 'response missing FAL header');
  assert.ok(result.content[0].text.includes('# Sample'), 'content missing');
});

await testAsync('forge_read response includes FAL header (O8)', async () => {
  const ctx = await makeCtx();
  await dispatch('forge_ls',       { fal: FOLDER_FAL }, ctx);
  await dispatch('forge_describe', { fal: SAMPLE_FAL }, ctx);
  const result = await dispatch('forge_read', { fal: SAMPLE_FAL }, ctx);
  assert.ok(!result.isError);
  assert.ok(result.content[0].text.includes(SAMPLE_FAL), 'FAL not in response header');
});

await testAsync('forge_describe once unlocks all md FALs', async () => {
  const ctx = await makeCtx();
  await dispatch('forge_ls',       { fal: FOLDER_FAL }, ctx);
  await dispatch('forge_describe', { fal: SAMPLE_FAL }, ctx);
  const result = await dispatch('forge_read', { fal: SAMPLE_FAL }, ctx);
  assert.ok(!result.isError);
});

// -------------------------------------------------------------------------
// Full write cycle
// -------------------------------------------------------------------------

await testAsync('forge_create → forge_ls → forge_describe → forge_write → forge_read', async () => {
  const ctx = await makeCtx();
  sandboxClean('int-test.md');

  await dispatch('forge_create',   { fal: SANDBOX_FAL },                              ctx);
  await dispatch('forge_ls',       { fal: 'forge://test/sandbox/' },                  ctx);
  await dispatch('forge_describe', { fal: SANDBOX_FAL },                              ctx);
  const writeResult = await dispatch('forge_write', { fal: SANDBOX_FAL, content: '# Integration' }, ctx);
  assert.ok(!writeResult.isError, writeResult.content[0].text);

  const readResult = await dispatch('forge_read', { fal: SANDBOX_FAL }, ctx);
  assert.ok(!readResult.isError);
  // O8: content follows the header line
  assert.ok(readResult.content[0].text.includes('# Integration'), 'written content not found');

  sandboxClean('int-test.md');
});

// @convention conventions/forge.md v7.0 [section Type handlers — writeBlock contract]
await testAsync('forge_write without forge_create → existence guard error', async () => {
  const ctx = await makeCtx();
  sandboxClean('int-test.md');
  // Brand + describe manually — file does not exist so forge_ls would not list it
  brand(SANDBOX_FAL);
  await dispatch('forge_describe', { fal: SANDBOX_FAL }, ctx);
  const result = await dispatch('forge_write', { fal: SANDBOX_FAL, content: 'x' }, ctx);
  assert.ok(result.isError);
  const err = JSON.parse(result.content[0].text).error;
  assert.ok(err.includes('forge_create') || err.includes('does not exist'), `unexpected: ${err}`);
});

console.log(`\n${failed === 0 ? 'All tests passed' : `${failed} test(s) failed`}`);
process.exit(failed > 0 ? 1 : 0);
