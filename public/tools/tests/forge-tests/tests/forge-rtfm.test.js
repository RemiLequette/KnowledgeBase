/**
 * forge-rtfm.test.js
 *
 * A priori tests for the RTFM gate in TypeRegistry.
 * All tests MUST FAIL before the RTFM gate is implemented in forge.js.
 *
 * RTFM principle: forge_read and forge_write require a prior forge_describe
 * call for the artifact's type in the current session. Without it, they throw:
 *   "Call forge_describe(fal) first — RTFM: no read or write before the type is understood."
 *
 * References:
 *   - conventions/forge.md v6.3 [section RTFM principle]
 *   - conventions/forge.md v6.3 [section Registry / Type registry]
 *   - conventions/forge.md v6.3 [section MCP tools]
 *   - guides/working-with-forge.md v1.2 [section The RTFM workflow]
 *
 * Not yet in references: none
 */

import assert from 'assert';
import { TypeRegistry, RootRegistry, testConfig } from './forge-testable.js';

async function makeRegistry() {
  const tr = new TypeRegistry();
  await tr.load(testConfig.types);
  const rr = new RootRegistry();
  await rr.load(testConfig.roots);
  return { tr, rr };
}

const SAMPLE_FAL = 'forge://test/sample.md';
const RTFM_MSG = 'Call forge_describe(fal) first — RTFM: no read or write before the type is understood.';

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

// @convention conventions/forge.md [section RTFM principle]
await testAsync('forge_read without forge_describe throws RTFM message', async () => {
  const { tr } = await makeRegistry();
  tr.brandRegister(SAMPLE_FAL);
  try {
    await tr.read(SAMPLE_FAL, testConfig.roots);
    assert.fail('Expected RTFM error but read succeeded');
  } catch (e) {
    assert.strictEqual(e.message, RTFM_MSG, `Expected RTFM message, got: ${e.message}`);
  }
});

// @convention conventions/forge.md [section RTFM principle]
await testAsync('forge_write without forge_describe throws RTFM message', async () => {
  const { tr } = await makeRegistry();
  tr.brandRegister(SAMPLE_FAL);
  try {
    await tr.write(SAMPLE_FAL, testConfig.roots, '', 'new content');
    assert.fail('Expected RTFM error but write succeeded');
  } catch (e) {
    assert.strictEqual(e.message, RTFM_MSG, `Expected RTFM message, got: ${e.message}`);
  }
});

// @convention conventions/forge.md [section Type handlers / describe()]
await testAsync('forge_describe returns { recognition, capabilities, usage }', async () => {
  const { tr } = await makeRegistry();
  const result = tr.describe(SAMPLE_FAL);
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
await testAsync('forge_read after forge_describe succeeds', async () => {
  const { tr, rr } = await makeRegistry();
  const entries = await rr.list('forge://test/', testConfig.roots, tr);
  const sampleEntry = entries.find(e => e.fal === SAMPLE_FAL);
  assert.ok(sampleEntry, `${SAMPLE_FAL} not found in forge_ls results`);
  tr.describe(SAMPLE_FAL);
  const content = await tr.read(SAMPLE_FAL, testConfig.roots);
  assert.ok(typeof content === 'string' && content.length > 0, 'read returned empty content');
  assert.ok(content.includes('# Sample'), 'content does not look like sample.md');
});

// @convention conventions/forge.md [section RTFM principle]
await testAsync('forge_describe once unlocks all FALs of the same type', async () => {
  const { tr, rr } = await makeRegistry();
  tr.describe(SAMPLE_FAL);
  const anotherFal = 'forge://test/fixtures/sample.md';
  tr.brandRegister(anotherFal);
  try {
    await tr.read(anotherFal, testConfig.roots);
  } catch (e) {
    assert.notStrictEqual(e.message, RTFM_MSG,
      'RTFM thrown for second FAL of same type after describe — should be unlocked');
  }
});

// @convention conventions/forge.md [section Type handlers / describe() — force flag]
await testAsync('forge_describe with force=true resets the flag — subsequent read throws RTFM', async () => {
  const { tr } = await makeRegistry();
  tr.brandRegister(SAMPLE_FAL);
  tr.describe(SAMPLE_FAL);
  tr.describe(SAMPLE_FAL, true);
  try {
    await tr.read(SAMPLE_FAL, testConfig.roots);
    assert.fail('Expected RTFM after force re-describe but read succeeded');
  } catch (e) {
    assert.strictEqual(e.message, RTFM_MSG,
      `Expected RTFM after force re-describe, got: ${e.message}`);
  }
});

// @convention conventions/forge.md [section Registry / Type registry — described flag]
await testAsync('described flag starts as false for all types at load', async () => {
  const { tr } = await makeRegistry();
  for (const [typeName, entry] of tr.handlers.entries()) {
    assert.strictEqual(entry.described, false,
      `Type "${typeName}" should have described=false at load, was ${entry.described}`);
  }
});

// @convention conventions/forge.md [section Registry / Type registry — described flag]
await testAsync('forge_describe sets described=true for the type', async () => {
  const { tr } = await makeRegistry();
  const mdEntry = tr.handlers.get('md');
  assert.ok(mdEntry, 'md type not found in registry');
  assert.strictEqual(mdEntry.described, false, 'md should start as described=false');
  tr.describe(SAMPLE_FAL);
  assert.strictEqual(mdEntry.described, true, 'md should be described=true after forge_describe');
});

console.log(`\n${failed === 0 ? 'All tests passed' : `${failed} test(s) failed`}`);
process.exit(failed > 0 ? 1 : 0);
