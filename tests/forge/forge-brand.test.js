/**
 * forge-brand.test.js
 *
 * Black-box tests for the Brand gate — ForgeSession API only.
 *
 * Brand principle: a FAL is only valid if it was issued by Forge.
 * FALs are branded by session.ls() (existing artifacts) and session.create() (new artifacts).
 * A manually constructed FAL throws:
 *   "This FAL was not issued by Forge — call forge_ls to discover existing artifacts,
 *    or forge_create to create a new one."
 *
 * Gate order: Brand gate is checked BEFORE RTFM gate.
 * An unbranded + undescribed FAL triggers the Brand error, not RTFM.
 *
 * References:
 *   - conventions/forge.md [section Brand principle]
 *   - conventions/forge.md [section Registry / Type registry — Brand gate]
 *   - guides/working-with-forge.md [section The Brand principle]
 */

import { describe, it, expect } from 'vitest';
import { createSession, testConfig } from './test-config.js';
import { sandboxClean } from './helpers.js';

const FOLDER_FAL = 'forge://test/';
const BRAND_MSG  = 'This FAL was not issued by Forge — call forge_ls to discover existing artifacts, or forge_create to create a new one.';
const RTFM_MSG   = 'Call forge_describe(fal) first — RTFM: no read or write before the type is understood.';

// Each test gets a fresh session — isolated Brand registry, no shared state.
async function makeSession() {
  return createSession(testConfig);
}

// @convention conventions/forge.md [section Brand principle]
describe('Brand gate', () => {

  // @convention conventions/forge.md [section Brand principle — Brand gate before RTFM gate]
  it('manually constructed FAL → Brand error (not RTFM)', async () => {
    const session = await makeSession();
    // Discover the real FAL via ls, then construct a wrong one manually
    const { entries } = await session.ls(FOLDER_FAL);
    const realFAL  = entries.find(e => e.type).fal;
    // Build a FAL with a different (wrong) type to simulate manual construction
    const manualFAL = realFAL.replace(/\.[^.]+$/, '.txt');
    await expect(session.read(manualFAL)).rejects.toThrow(BRAND_MSG);
  });

  // @convention conventions/forge.md [section Brand principle]
  it('manually constructed FAL + describe → still Brand error on read', async () => {
    const session = await makeSession();
    const { entries } = await session.ls(FOLDER_FAL);
    const realFAL   = entries.find(e => e.type).fal;
    const manualFAL = realFAL.replace(/\.[^.]+$/, '.txt');
    // describe doesn't brand — Brand must come from ls or create
    try { session.describe(manualFAL); } catch (_) {}
    await expect(session.read(manualFAL)).rejects.toThrow(BRAND_MSG);
  });

  // @convention conventions/forge.md [section Brand principle]
  it('manually constructed FAL + describe → still Brand error on write', async () => {
    const session = await makeSession();
    const { entries } = await session.ls(FOLDER_FAL);
    const realFAL   = entries.find(e => e.type).fal;
    const manualFAL = realFAL.replace(/\.[^.]+$/, '.txt');
    try { session.describe(manualFAL); } catch (_) {}
    await expect(session.write(manualFAL, '', 'x')).rejects.toThrow(BRAND_MSG);
  });

  // @convention conventions/forge.md [section Brand principle — forge_ls brands FALs]
  it('ls brands FALs — read without describe → RTFM error, not Brand', async () => {
    const session = await makeSession();
    const { entries } = await session.ls(FOLDER_FAL);
    const brandedFAL  = entries.find(e => e.type).fal;
    // Brand gate passes (ls branded it), RTFM gate fires (no describe yet)
    await expect(session.read(brandedFAL)).rejects.toThrow(RTFM_MSG);
  });

  // @convention conventions/forge.md [section Brand principle — forge_ls brands FALs]
  it('ls → describe → read succeeds', async () => {
    const session = await makeSession();
    const { entries } = await session.ls(FOLDER_FAL);
    const brandedFAL  = entries.find(e => e.type).fal;
    session.describe(brandedFAL);
    const content = await session.read(brandedFAL);
    expect(typeof content).toBe('string');
    expect(content.length).toBeGreaterThan(0);
  });

  // @convention conventions/forge.md [section Brand principle — forge_create brands FALs]
  it('create brands the FAL — describe + write succeed without ls', async () => {
    const session = await makeSession();
    sandboxClean('brand-test-new.md'); // guard: remove leftover from a previous failed run
    const newFAL = 'forge://test/sandbox/brand-test-new.md';
    await session.create(newFAL);
    session.describe(newFAL);
    await expect(session.write(newFAL, '', '# New\n')).resolves.toBeUndefined();
    sandboxClean('brand-test-new.md');
  });

  // @convention conventions/forge.md [section Brand principle — forge_mkdir does not brand artifact FALs]
  it('mkdir does not brand artifact FALs — ls still required', async () => {
    const session = await makeSession();
    const tmpFAL  = 'forge://test/sandbox/brand-mkdir-tmp/';
    await session.mkdir(tmpFAL);
    const artifactFAL = 'forge://test/sandbox/brand-mkdir-tmp/file.md';
    await expect(session.read(artifactFAL)).rejects.toThrow(BRAND_MSG);
    await session.rmdir(tmpFAL);
  });

});
