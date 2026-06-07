/**
 * type-registry.test.js
 *
 * Unit tests for TypeRegistry — discover, describe, gates, read/write.
 *
 * Gates (Brand + RTFM) are enforced by TypeRegistry.read/write directly.
 *
 * References:
 *   - conventions/forge.md v7.1 [section Registry / Type registry]
 *   - conventions/forge.md v7.1 [section Type discovery]
 *   - conventions/forge.md v7.1 [section Brand principle]
 *   - conventions/forge.md v7.1 [section Registry / Collision rule]
 */

import assert from 'assert';
import path from 'path';
import { pathToFileURL } from 'url';
import { TypeRegistry, RootRegistry, testConfig } from '../../public/tools/forge/forge.js';
import { brand, brandRegistry } from '../../public/tools/forge/src/brand.js';
import { toFAL } from '../../public/tools/forge/src/fal.js';
import { urlRef, artifactRef, sandboxCreate, sandboxClean, sandboxRead, FIXTURES_DIR } from './helpers.js';

const SAMPLE_URLREF         = urlRef('sample', '.md');
const SAMPLE_REF            = artifactRef('sample', 'md');
const SAMPLE_FAL            = toFAL(SAMPLE_REF);
const SAMPLE_MANAGED_URLREF = urlRef('sample-managed', '.js');
const SAMPLE_PLAIN_URLREF   = urlRef('sample-plain', '.js');
const SANDBOX_REF           = artifactRef('tr-test', 'md', 'sandbox');
const SANDBOX_FAL           = toFAL(SANDBOX_REF);
const BRAND_MSG             = 'This FAL was not issued by Forge — call forge_ls to obtain a valid FAL.';
const RTFM_MSG              = 'Call forge_describe(fal) first — RTFM: no read or write before the type is understood.';

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

// @convention conventions/forge.md [section Registry / Collision rule]
await testAsync('load: duplicate type name → throws collision error', async () => {
  // Build a types JSON with two entries sharing the same name.
  // The handler URL points to the real structured-text.js so import() succeeds.
  const handlerUrl = pathToFileURL(
    path.resolve(FIXTURES_DIR, '..', '..', '..', 'public', 'tools', 'forge', 'handlers', 'structured-text.js')
  ).href;
  const collisionTypes = {
    version: '0.0.0-test',
    types: {
      'dup': { version: '1.0', handler: handlerUrl },
      'dup-sub': { version: '1.0', handler: handlerUrl }  // registers 'dup-sub' first
    }
  };
  // Write to sandbox, then manually inject a second 'dup-sub' after load by
  // pre-seeding the registry — simulates what a collision JSON would trigger.
  // Direct approach: pre-seed handlers then call load() on a single-type JSON.
  const singleType = { version: '0.0.0-test', types: { 'dup': { version: '1.0', handler: handlerUrl } } };
  sandboxCreate('collision-types.json', JSON.stringify(singleType));
  const typesUrl = pathToFileURL(path.join(FIXTURES_DIR, 'sandbox', 'collision-types.json')).href;

  const typeRegistry = new TypeRegistry();
  await typeRegistry.load(typesUrl);                    // loads 'dup' — succeeds
  typeRegistry.handlers.set('dup', { handler: {}, described: false, extension: '.dup' }); // pre-seed duplicate

  // Second load of same file — 'dup' is already in handlers → must throw
  try {
    await typeRegistry.load(typesUrl);
    assert.fail('Expected collision error');
  } catch (e) {
    assert.ok(
      e.message.includes("Type name collision") && e.message.includes("'dup'"),
      `unexpected error: ${e.message}`
    );
  } finally {
    sandboxClean('collision-types.json');
  }
});

// -------------------------------------------------------------------------
// discover — basic
// -------------------------------------------------------------------------

// @convention conventions/forge.md [section Type discovery]
await testAsync('discover returns ArtifactRef with correct type for .md', async () => {
  const { typeRegistry, rootRegistry } = await makeCtx();
  const ref = await typeRegistry.discover(SAMPLE_URLREF, rootRegistry);
  assert.strictEqual(ref.root, 'test');
  assert.strictEqual(ref.name, 'sample');
  assert.strictEqual(ref.type, 'md');
  assert.ok('path' in ref);
});

// @convention conventions/forge.md [section Type discovery — outcome: 0 claims]
await testAsync('discover returns type=undefined for unknown extension', async () => {
  const { typeRegistry, rootRegistry } = await makeCtx();
  const ref = await typeRegistry.discover(urlRef('archive', '.xyz'), rootRegistry);
  assert.strictEqual(ref.type, 'undefined');
});

// -------------------------------------------------------------------------
// discover — hierarchy (js / js-managed)
// -------------------------------------------------------------------------

// @convention conventions/forge.md [section Type discovery — hierarchy]
await testAsync('discover: .js file with shebang → js-managed', async () => {
  const { typeRegistry, rootRegistry } = await makeCtx();
  const ref = await typeRegistry.discover(SAMPLE_MANAGED_URLREF, rootRegistry);
  assert.strictEqual(ref.type, 'js-managed', `expected js-managed, got ${ref.type}`);
});

// @convention conventions/forge.md [section Type discovery — hierarchy]
await testAsync('discover: .js file without shebang → js', async () => {
  const { typeRegistry, rootRegistry } = await makeCtx();
  const ref = await typeRegistry.discover(SAMPLE_PLAIN_URLREF, rootRegistry);
  assert.strictEqual(ref.type, 'js', `expected js, got ${ref.type}`);
});

// @convention conventions/forge.md [section Type discovery — hierarchy: stop at first in group]
await testAsync('discover: js-managed claimed → js not evaluated in same hierarchy', async () => {
  const { typeRegistry, rootRegistry } = await makeCtx();
  const ref = await typeRegistry.discover(SAMPLE_MANAGED_URLREF, rootRegistry);
  assert.notStrictEqual(ref.type, 'js', 'js should not claim when js-managed already did');
});

// -------------------------------------------------------------------------
// discover — multiple independent claims → error
// -------------------------------------------------------------------------

// @convention conventions/forge.md [section Type discovery — outcome: >1 claims]
await testAsync('discover: two independent handlers claim same file → error', async () => {
  const { typeRegistry, rootRegistry } = await makeCtx();

  // Inject a second independent handler that claims all .js files unconditionally.
  // Placed in its own group (independent hierarchy) so both it and 'js'
  // can claim the same file — triggering the >1 claims error.
  typeRegistry.handlers.set('js-rival', {
    handler: { claim: async (ref) => (ref.extension || '').toLowerCase() === '.js' },
    described: false,
    extension: '.js'
  });
  typeRegistry.discoveryGroups.push(['js-rival']); // independent group

  try {
    await typeRegistry.discover(SAMPLE_PLAIN_URLREF, rootRegistry);
    assert.fail('Expected error for multiple claims');
  } catch (e) {
    assert.ok(
      e.message.includes('Multiple independent handlers'),
      `unexpected error: ${e.message}`
    );
  }
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
// Gate order: Brand before RTFM
// -------------------------------------------------------------------------

// @convention conventions/forge.md [section MCP tools — Brand before RTFM]
await testAsync('unbranded + undescribed → Brand error', async () => {
  const { typeRegistry, rootRegistry } = await makeCtx();
  try {
    await typeRegistry.read(SAMPLE_REF, rootRegistry);
    assert.fail('Expected Brand error');
  } catch (e) {
    assert.strictEqual(e.message, BRAND_MSG, `got: ${e.message}`);
  }
});

// @convention conventions/forge.md [section MCP tools — Brand before RTFM]
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

// -------------------------------------------------------------------------
// shebang — readBlock strips / writeBlock restores / createArtifact prepends
// Physical extension for js-managed is .js (entry.extension = "js" in forge-types.json)
// -------------------------------------------------------------------------

await testAsync('readBlock on js-managed strips shebang line', async () => {
  const { typeRegistry, rootRegistry } = await makeCtx();
  // sample-managed.js is a .js file with shebang — discovered as js-managed
  const ref = artifactRef('sample-managed', 'js-managed');
  const fal = toFAL(ref);
  brand(fal);
  typeRegistry.describe(ref);
  const content = await typeRegistry.read(ref, rootRegistry);
  assert.ok(!content.startsWith('// @forge-type:'), 'shebang should be stripped');
  assert.ok(content.includes('imports') || content.includes('helpers'), 'body should be present');
});

await testAsync('writeBlock on js-managed restores shebang', async () => {
  const { typeRegistry, rootRegistry } = await makeCtx();
  // Physical file: sandbox/sandbox-managed.js
  const ref = artifactRef('sandbox-managed', 'js-managed', 'sandbox');
  const fal = toFAL(ref);
  sandboxCreate('sandbox-managed.js', '// @forge-type: js-managed\noriginal');
  brand(fal);
  typeRegistry.describe(ref);
  await typeRegistry.write(ref, rootRegistry, '', 'replaced body');
  const raw = sandboxRead('sandbox-managed.js');
  assert.ok(raw.startsWith('// @forge-type: js-managed\n'), 'shebang must be first line');
  assert.ok(raw.includes('replaced body'), 'body must be present');
  sandboxClean('sandbox-managed.js');
});

await testAsync('createArtifact on js-managed writes shebang as first line', async () => {
  const { typeRegistry, rootRegistry } = await makeCtx();
  // Physical file: sandbox/new-managed.js
  const ref = artifactRef('new-managed', 'js-managed', 'sandbox');
  sandboxClean('new-managed.js');
  await typeRegistry.createArtifact(ref, rootRegistry);
  const raw = sandboxRead('new-managed.js');
  assert.ok(raw.startsWith('// @forge-type: js-managed\n'), `expected shebang, got: ${raw}`);
  sandboxClean('new-managed.js');
});

console.log(`\n${failed === 0 ? 'All tests passed' : `${failed} test(s) failed`}`);
process.exit(failed > 0 ? 1 : 0);
