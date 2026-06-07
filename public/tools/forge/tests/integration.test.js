/**
 * integration.test.js
 *
 * End-to-end tests — forge_ls → discover → describe → read/write cycle.
 * All tests MUST FAIL on the current implementation (v2.4) which uses the v6.x interface.
 *
 * Tests the full workflow from a caller's perspective:
 *   1. forge_ls → returns ArtifactRefs with branded FALs
 *   2. forge_describe → unlocks type
 *   3. forge_read → returns content
 *   4. forge_write → modifies content
 *   5. forge_read → verifies modification
 *
 * Also tests cross-cutting concerns:
 *   - forge_ls brands folder FALs
 *   - forge_ls brands artifact FALs
 *   - read without prior ls → Brand gate fires
 *   - forge_create before forge_write
 *
 * Imports TypeRegistry and RootRegistry from forge.js once they are exported.
 *
 * References:
 *   - conventions/forge.md v7.0 [section MCP tools]
 *   - conventions/forge.md v7.0 [section Registry / Sequence diagrams]
 */

import assert from 'assert';
import { testAsync, summary, artifactRef, toFAL, sandboxCreate, sandboxClean, sandboxRead } from './forge-testable.js';
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

const FIXTURES_FOLDER_FAL = 'forge://test/';
const SAMPLE_FAL          = 'forge://test/sample.md';
const SANDBOX_FAL         = 'forge://test/sandbox/int-test.md';
const SANDBOX_REF         = artifactRef('int-test', 'md', 'sandbox');
const BRAND_MSG           = 'This FAL was not issued by Forge — call forge_ls to obtain a valid FAL.';
const RTFM_MSG            = 'Call forge_describe(fal) first — RTFM: no read or write before the type is understood.';

// ---------------------------------------------------------------------------
// forge_ls
// ---------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section Registry / Sequence diagrams — forge_ls]
await testAsync('forge_ls returns folder FALs ending with /', async () => {
  const { tr, rr } = await makeRegistries();
  const entries = await rr.list(FIXTURES_FOLDER_FAL, tr);
  const folders = entries.filter(e => e.fal.endsWith('/'));
  assert.ok(folders.length > 0, 'no folder FALs returned');
});

// @convention conventions/forge.md v7.0 [section Registry / Sequence diagrams — forge_ls]
await testAsync('forge_ls returns artifact FALs with type extension', async () => {
  const { tr, rr } = await makeRegistries();
  const entries = await rr.list(FIXTURES_FOLDER_FAL, tr);
  const artifacts = entries.filter(e => !e.fal.endsWith('/'));
  assert.ok(artifacts.length > 0, 'no artifact FALs returned');
  for (const a of artifacts) {
    assert.ok(a.fal.includes('.'), `artifact FAL has no type extension: ${a.fal}`);
  }
});

// @convention conventions/forge.md v7.0 [section Brand principle]
await testAsync('forge_ls brands all returned FALs', async () => {
  const { tr, rr } = await makeRegistries();
  const entries = await rr.list(FIXTURES_FOLDER_FAL, tr);
  for (const e of entries) {
    assert.ok(tr.brandRegistry.has(e.fal),
      `FAL not in brandRegistry after forge_ls: ${e.fal}`);
  }
});

// @convention conventions/forge.md v7.0 [section Brand principle]
await testAsync('forge_ls includes sample.md with correct FAL', async () => {
  const { tr, rr } = await makeRegistries();
  const entries = await rr.list(FIXTURES_FOLDER_FAL, tr);
  const sample = entries.find(e => e.fal === SAMPLE_FAL);
  assert.ok(sample, `${SAMPLE_FAL} not found in forge_ls results`);
});

// ---------------------------------------------------------------------------
// Brand gate — read without prior forge_ls
// ---------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section Brand principle]
await testAsync('forge_read without prior forge_ls throws Brand message', async () => {
  const { tr } = await makeRegistries();
  // Describe so only Brand is tested
  const ref = artifactRef('sample', 'md');
  tr.describe(ref);
  try {
    await tr.read(ref);
    assert.fail('Expected Brand error');
  } catch (e) {
    assert.strictEqual(e.message, BRAND_MSG, `got: ${e.message}`);
  }
});

// ---------------------------------------------------------------------------
// Full read cycle: forge_ls → describe → read
// ---------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section Registry / Sequence diagrams — forge_read]
await testAsync('forge_ls → describe → read returns sample.md content', async () => {
  const { tr, rr } = await makeRegistries();
  // Step 1 — forge_ls
  await rr.list(FIXTURES_FOLDER_FAL, tr);
  // Step 2 — describe
  const ref = artifactRef('sample', 'md');
  tr.describe(ref);
  // Step 3 — read
  const content = await tr.read(ref, rr);
  assert.ok(typeof content === 'string' && content.length > 0);
  assert.ok(content.includes('# Sample'));
});

// ---------------------------------------------------------------------------
// Full write cycle: forge_create → forge_ls → describe → write → read
// ---------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section MCP tools]
await testAsync('forge_create → forge_ls → describe → write → read round-trip', async () => {
  const { tr, rr } = await makeRegistries();
  sandboxClean('int-test.md');

  // Step 1 — create
  await tr.createArtifact(SANDBOX_REF, rr);

  // Step 2 — forge_ls to brand the FAL
  await rr.list('forge://test/sandbox/', tr);

  // Step 3 — describe
  tr.describe(SANDBOX_REF);

  // Step 4 — write
  await tr.write(SANDBOX_REF, rr, '', '# Integration Test');

  // Step 5 — read back
  const content = await tr.read(SANDBOX_REF, rr);
  assert.strictEqual(content, '# Integration Test');

  sandboxClean('int-test.md');
});

// ---------------------------------------------------------------------------
// forge_write without forge_create — must fail with existence guard
// ---------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section Type handlers — writeBlock contract]
await testAsync('forge_write on non-existent file throws existence guard error', async () => {
  const { tr, rr } = await makeRegistries();
  sandboxClean('int-test.md');

  // Brand + describe to pass the gates
  tr.brandRegistry.add(SANDBOX_FAL);
  tr.describe(SANDBOX_REF);

  try {
    await tr.write(SANDBOX_REF, rr, '', 'content');
    assert.fail('Expected existence guard error');
  } catch (e) {
    assert.ok(
      e.message.includes('forge_create') || e.message.includes('does not exist'),
      `unexpected: ${e.message}`
    );
  }
});

// ---------------------------------------------------------------------------
// describe unlocks type for all subsequent FALs
// ---------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section RTFM principle — once per type]
await testAsync('describe once unlocks read for all md FALs in session', async () => {
  const { tr, rr } = await makeRegistries();
  // forge_ls to brand all FALs
  await rr.list(FIXTURES_FOLDER_FAL, tr);
  // Describe once for type md
  tr.describe(artifactRef('sample', 'md'));
  // Read sample.md — should succeed
  const content = await tr.read(artifactRef('sample', 'md'), rr);
  assert.ok(content.includes('# Sample'), 'read failed after single describe');
  // Any other md FAL that gets branded should also be readable without another describe
  // (tested via brand gate only — no second describe needed)
});

summary();
