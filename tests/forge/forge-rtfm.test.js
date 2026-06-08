/**
 * forge-rtfm.test.js
 *
 * Black-box tests for the RTFM gate — ForgeSession API only.
 *
 * RTFM principle: session.read() and session.write() require a prior
 * session.describe() call for the artifact's type in the current session.
 *
 * Gate order: Brand gate is checked BEFORE RTFM gate.
 * These tests always call session.ls() first to brand FALs,
 * then test RTFM behaviour in isolation.
 *
 * References:
 *   - conventions/forge.md [section RTFM principle]
 *   - conventions/forge.md [section Registry / Type registry]
 *   - guides/working-with-forge.md [section The RTFM workflow]
 */

import { describe, it, expect } from 'vitest';
import { createSession, testConfig } from './test-config.js';

const FOLDER_FAL = 'forge://test/';
const RTFM_MSG   = 'Call forge_describe(fal) first — RTFM: no read or write before the type is understood.';

async function makeSession() {
  return createSession(testConfig);
}

// Helper: ls and return the FAL of the first artifact matching a predicate
async function brandedFAL(session, pred) {
  const { entries } = await session.ls(FOLDER_FAL);
  return entries.find(pred).fal;
}

describe('RTFM gate', () => {

  // @convention conventions/forge.md [section MCP tools — forge_describe]
  it('describe on folder FAL returns generic folder description', async () => {
    const session = await makeSession();
    const result  = session.describe(FOLDER_FAL);
    expect(typeof result.recognition).toBe('string');
    expect(result.capabilities.read).toBe(false);
    expect(result.capabilities.write).toBe(false);
    expect(result.capabilities.blocks).toBe(false);
  });

  // @convention conventions/forge.md [section RTFM principle]
  it('read without describe → RTFM error (Brand gate already passed via ls)', async () => {
    const session = await makeSession();
    const fal     = await brandedFAL(session, e => e.fal.endsWith('.md') && e.type !== 'folder');
    await expect(session.read(fal)).rejects.toThrow(RTFM_MSG);
  });

  // @convention conventions/forge.md [section RTFM principle]
  it('write without describe → RTFM error', async () => {
    const session = await makeSession();
    const fal     = await brandedFAL(session, e => e.fal.endsWith('.md') && e.type !== 'folder');
    await expect(session.write(fal, '', 'x')).rejects.toThrow(RTFM_MSG);
  });

  // @convention conventions/forge.md [section RTFM principle]
  it('describe returns { recognition, capabilities, usage }', async () => {
    const session = await makeSession();
    const fal     = await brandedFAL(session, e => e.fal.endsWith('.md') && e.type !== 'folder');
    const result  = session.describe(fal);
    expect(typeof result.recognition).toBe('string');
    expect(result.recognition).toMatch(/^A FAL ending with \./);
    expect(typeof result.capabilities.read).toBe('boolean');
    expect(typeof result.capabilities.write).toBe('boolean');
    expect(typeof result.capabilities.blocks).toBe('boolean');
    expect(typeof result.usage).toBe('string');
  });

  // @convention conventions/forge.md [section RTFM principle]
  it('ls → describe → read succeeds', async () => {
    const session = await makeSession();
    const fal     = await brandedFAL(session, e => e.fal.endsWith('.md') && e.type !== 'folder');
    session.describe(fal);
    const content = await session.read(fal);
    expect(typeof content).toBe('string');
    expect(content.length).toBeGreaterThan(0);
  });

  // @convention conventions/forge.md [section RTFM principle — once per type per session]
  it('describe once unlocks all FALs of the same type', async () => {
    const session  = await makeSession();
    const { entries } = await session.ls(FOLDER_FAL);
    const mdFALs   = entries.filter(e => e.fal.endsWith('.md') && e.type !== 'folder');
    expect(mdFALs.length).toBeGreaterThanOrEqual(2);
    // describe on the first md unlocks all md artifacts
    session.describe(mdFALs[0].fal);
    const content = await session.read(mdFALs[1].fal);
    expect(typeof content).toBe('string');
  });

});
