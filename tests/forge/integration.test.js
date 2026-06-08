/**
 * integration.test.js
 *
 * End-to-end tests — ls → describe → read/write cycle via ForgeSession API.
 *
 * References:
 *   - conventions/forge.md [section MCP tools]
 *   - conventions/forge.md [section Registry / Sequence diagrams]
 */

import { describe, it, expect } from 'vitest';
import { createSession, testConfig } from './test-config.js';
import { sandboxClean } from './helpers.js';

const FOLDER_FAL  = 'forge://test/';
const SANDBOX_FAL = 'forge://test/sandbox/int-test.md';
const BRAND_MSG   = 'This FAL was not issued by Forge — call forge_ls to discover existing artifacts, or forge_create to create a new one.';
const RTFM_MSG    = 'Call forge_describe(fal) first — RTFM: no read or write before the type is understood.';

async function makeSession() {
  return createSession(testConfig);
}

// -------------------------------------------------------------------------
// ls
// -------------------------------------------------------------------------

describe('ls', () => {
  it('root entries have folder:true and no type', async () => {
    const session = await makeSession();
    const result  = await session.ls();
    for (const r of result.roots) {
      expect(r.folder).toBe(true);
      expect(r.type).toBeUndefined();
    }
  });

  it('subfolder entries have folder:true and no type', async () => {
    const session = await makeSession();
    const result  = await session.ls(FOLDER_FAL);
    const folders = result.entries.filter(e => e.folder === true);
    expect(folders.length).toBeGreaterThan(0);
    for (const f of folders) {
      expect(f.folder).toBe(true);
      expect(f.type).toBeUndefined();
    }
  });

  it('artifact entries have type and no folder', async () => {
    const session = await makeSession();
    const result  = await session.ls(FOLDER_FAL);
    const artifacts = result.entries.filter(e => e.type);
    expect(artifacts.length).toBeGreaterThan(0);
    for (const a of artifacts) {
      expect(typeof a.type).toBe('string');
      expect(a.folder).toBeUndefined();
    }
  });

  it('returns entries with fal and type or folder', async () => {
    const session = await makeSession();
    const result  = await session.ls(FOLDER_FAL);
    expect(Array.isArray(result.entries) && result.entries.length > 0).toBe(true);
    expect(result.entries.every(e => e.fal && (e.type || e.folder))).toBe(true);
  });

  it('finds sample.md with type doc.md', async () => {
    const session = await makeSession();
    const result  = await session.ls(FOLDER_FAL);
    const sample  = result.entries.find(e => e.fal.includes('sample') && !e.fal.includes('managed') && !e.fal.includes('plain') && !e.fal.includes('todo') && !e.fal.includes('structured'));
    expect(sample).toBeTruthy();
  });

  it('finds sandbox/ folder', async () => {
    const session = await makeSession();
    const result  = await session.ls(FOLDER_FAL);
    expect(result.entries.find(e => e.folder === true)).toBeTruthy();
  });

  it('folder entry FAL is valid and navigable', async () => {
    const session = await makeSession();
    const result  = await session.ls(FOLDER_FAL);
    const folder  = result.entries.find(e => e.folder === true);
    expect(folder.fal).toMatch(/^forge:\/\/.+\/$/);
    const children = await session.ls(folder.fal);
    expect(children).toBeTruthy();
  });

  it('no arg → returns roots', async () => {
    const session = await makeSession();
    const result  = await session.ls();
    expect(Array.isArray(result.roots)).toBe(true);
    expect(result.roots[0].fal).toBe('forge://test/');
  });
});

// -------------------------------------------------------------------------
// Gate errors
// -------------------------------------------------------------------------

describe('Gate errors', () => {
  it('read without ls → Brand error', async () => {
    const session = await makeSession();
    await expect(session.read('forge://test/sample.md'))
      .rejects.toThrow(BRAND_MSG);
  });

  it('read after ls but without describe → RTFM error', async () => {
    const session    = await makeSession();
    const { entries } = await session.ls(FOLDER_FAL);
    const fal        = entries.find(e => e.type).fal;
    await expect(session.read(fal)).rejects.toThrow(RTFM_MSG);
  });
});

// -------------------------------------------------------------------------
// Full read cycle
// -------------------------------------------------------------------------

describe('Full read cycle', () => {
  it('ls → describe → read succeeds', async () => {
    const session    = await makeSession();
    const { entries } = await session.ls(FOLDER_FAL);
    const fal        = entries.find(e => e.type).fal;
    session.describe(fal);
    const content = await session.read(fal);
    expect(typeof content).toBe('string');
    expect(content.length).toBeGreaterThan(0);
  });

  it('describe once unlocks all FALs of the same type', async () => {
    const session    = await makeSession();
    const { entries } = await session.ls(FOLDER_FAL);
    const mdFALs     = entries.filter(e => e.type === 'doc.md' || e.type === 'md');
    expect(mdFALs.length).toBeGreaterThanOrEqual(2);
    session.describe(mdFALs[0].fal);
    const content = await session.read(mdFALs[1].fal);
    expect(typeof content).toBe('string');
  });
});

// -------------------------------------------------------------------------
// Full write cycle
// -------------------------------------------------------------------------

describe('Full write cycle', () => {
  it('create → describe → write → read', async () => {
    const session = await makeSession();
    sandboxClean('int-test.md');

    await session.create(SANDBOX_FAL);
    session.describe(SANDBOX_FAL);
    await session.write(SANDBOX_FAL, '', '# Integration');
    const content = await session.read(SANDBOX_FAL);
    expect(content).toContain('# Integration');

    sandboxClean('int-test.md');
  });

  it('write without create → existence guard error', async () => {
    const session = await makeSession();
    sandboxClean('int-test.md');

    // create brands and describe unlocks — but file doesn't exist on disk
    await session.create(SANDBOX_FAL);
    sandboxClean('int-test.md'); // remove the file after create
    session.describe(SANDBOX_FAL);

    await expect(session.write(SANDBOX_FAL, '', 'x'))
      .rejects.toThrow(/forge_create|does not exist/);
  });
});

// -------------------------------------------------------------------------
// ls on artifact node
// -------------------------------------------------------------------------

describe('ls on artifact node', () => {
  it('ls with #node fragment lists node children', async () => {
    const session    = await makeSession();
    const { entries } = await session.ls(FOLDER_FAL);
    const managedFAL = entries.find(e => e.type === 'managed.js').fal;
    session.describe(managedFAL);
    const result = await session.ls(managedFAL + '#');
    expect(Array.isArray(result.entries)).toBe(true);
    expect(result.entries.length).toBeGreaterThan(0);
    expect(result.entries.every(e => e.type === 'node' || e.type === 'block')).toBe(true);
  });
});
