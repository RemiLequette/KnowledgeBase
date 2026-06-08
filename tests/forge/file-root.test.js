/**
 * file-root.test.js
 *
 * Unit tests for handlers/file-root.js — IRootRegistry interface.
 *
 * References:
 *   - conventions/forge.md v7.0 [section Root registry]
 *   - conventions/forge.md v7.0 [section IRootRegistry]
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import * as rootHandler from '../../public/tools/forge/handlers/file-root.js';
import { urlRef, urlRefPath, sandboxCreate, sandboxClean, sandboxRead, SANDBOX_DIR, FIXTURES_DIR } from './helpers.js';

rootHandler.registerRoot('test', 'file:///' + FIXTURES_DIR.replace(/\\/g, '/').replace(/^\//, '') + '/');

const SAMPLE_REF       = urlRef('sample', '.md');
const SANDBOX_REF      = urlRef('fr-test', '.md', 'sandbox');
const MISSING_REF      = urlRef('does-not-exist', '.md');
const FIXTURES_DIR_REF = { root: 'test', path: '', name: '', extension: '', _url: 'file:///' + FIXTURES_DIR.replace(/\\/g, '/').replace(/^\//, '') + '/' };

// -------------------------------------------------------------------------
// create
// -------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section IRootRegistry]
describe('create', () => {
  it('makes a new empty file', async () => {
    sandboxClean('fr-test.md');
    await rootHandler.create(SANDBOX_REF);
    expect(fs.existsSync(urlRefPath(SANDBOX_REF))).toBe(true);
    expect(fs.readFileSync(urlRefPath(SANDBOX_REF), 'utf8')).toBe('');
    sandboxClean('fr-test.md');
  });

  it('throws if file already exists', async () => {
    sandboxCreate('fr-test.md', 'existing');
    await expect(rootHandler.create(SANDBOX_REF)).rejects.toThrow();
    sandboxClean('fr-test.md');
  });
});

// -------------------------------------------------------------------------
// read
// -------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section IRootRegistry]
describe('read', () => {
  it('returns file content as string', async () => {
    const content = await rootHandler.read(SAMPLE_REF);
    expect(typeof content).toBe('string');
    expect(content.length).toBeGreaterThan(0);
    expect(content).toContain('# Sample');
  });

  it('throws for missing file', async () => {
    await expect(rootHandler.read(MISSING_REF)).rejects.toThrow();
  });
});

// -------------------------------------------------------------------------
// write
// -------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section IRootRegistry]
describe('write', () => {
  it('replaces file content', async () => {
    sandboxCreate('fr-test.md', 'old');
    await rootHandler.write(SANDBOX_REF, 'new content');
    expect(sandboxRead('fr-test.md')).toBe('new content');
    sandboxClean('fr-test.md');
  });

  it('throws if file does not exist', async () => {
    sandboxClean('fr-test.md');
    await expect(rootHandler.write(SANDBOX_REF, 'content'))
      .rejects.toThrow(/does not exist|forge_create/);
  });
});

// -------------------------------------------------------------------------
// delete
// -------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section IRootRegistry]
describe('delete', () => {
  it('removes the file', async () => {
    sandboxCreate('fr-test.md', 'x');
    await rootHandler.delete(SANDBOX_REF);
    expect(fs.existsSync(urlRefPath(SANDBOX_REF))).toBe(false);
  });

  it('throws for missing file', async () => {
    sandboxClean('fr-test.md');
    await expect(rootHandler.delete(SANDBOX_REF)).rejects.toThrow();
  });
});

// -------------------------------------------------------------------------
// list
// -------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section Root registry]
describe('list', () => {
  it('returns { folders, artifacts } as UrlRef arrays', async () => {
    const result = await rootHandler.list(FIXTURES_DIR_REF);
    expect(Array.isArray(result.folders)).toBe(true);
    expect(Array.isArray(result.artifacts)).toBe(true);
  });

  it('artifact UrlRefs have extension starting with dot', async () => {
    const result = await rootHandler.list(FIXTURES_DIR_REF);
    expect(result.artifacts.length).toBeGreaterThan(0);
    for (const a of result.artifacts) {
      expect(a.extension).toMatch(/^\./);
    }
  });

  it('finds sample.md', async () => {
    const result = await rootHandler.list(FIXTURES_DIR_REF);
    expect(result.artifacts.find(r => r.name === 'sample' && r.extension === '.md')).toBeTruthy();
  });

  it('finds sandbox/ folder', async () => {
    const result = await rootHandler.list(FIXTURES_DIR_REF);
    expect(result.folders.find(r => r.path.endsWith('sandbox/'))).toBeTruthy();
  });
});

// -------------------------------------------------------------------------
// mkdir / rmdir
// -------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section Root registry]
describe('mkdir / rmdir', () => {
  it('mkdir creates a folder', async () => {
    const dirRef  = urlRef('tmpdir', '', 'sandbox'); dirRef.extension = '';
    const dirPath = path.join(SANDBOX_DIR, 'tmpdir');
    if (fs.existsSync(dirPath)) fs.rmdirSync(dirPath);
    await rootHandler.mkdir(dirRef);
    expect(fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()).toBe(true);
    fs.rmdirSync(dirPath);
  });

  it('rmdir removes an empty folder', async () => {
    const dirRef  = urlRef('tmpdir', '', 'sandbox'); dirRef.extension = '';
    const dirPath = path.join(SANDBOX_DIR, 'tmpdir');
    fs.mkdirSync(dirPath, { recursive: true });
    await rootHandler.rmdir(dirRef);
    expect(fs.existsSync(dirPath)).toBe(false);
  });

  it('rmdir throws if folder not empty', async () => {
    const dirRef  = urlRef('tmpdir', '', 'sandbox'); dirRef.extension = '';
    const dirPath = path.join(SANDBOX_DIR, 'tmpdir');
    fs.mkdirSync(dirPath, { recursive: true });
    fs.writeFileSync(path.join(dirPath, 'x.txt'), 'x');
    await expect(rootHandler.rmdir(dirRef)).rejects.toThrow();
    fs.rmSync(dirPath, { recursive: true });
  });
});

// -------------------------------------------------------------------------
// rename / move
// -------------------------------------------------------------------------

// @convention conventions/forge.md v7.0 [section Root registry]
describe('rename / move', () => {
  it('rename renames a folder in place', async () => {
    const srcRef  = urlRef('ren-src', '', 'sandbox'); srcRef.extension = '';
    const srcPath = path.join(SANDBOX_DIR, 'ren-src');
    const dstPath = path.join(SANDBOX_DIR, 'ren-dst');
    fs.mkdirSync(srcPath, { recursive: true });
    if (fs.existsSync(dstPath)) fs.rmdirSync(dstPath);
    await rootHandler.rename(srcRef, 'ren-dst');
    expect(fs.existsSync(srcPath)).toBe(false);
    expect(fs.existsSync(dstPath)).toBe(true);
    fs.rmdirSync(dstPath);
  });

  it('move moves a folder', async () => {
    const srcRef  = urlRef('mv-src', '', 'sandbox'); srcRef.extension = '';
    const dstRef  = urlRef('mv-dst', '', 'sandbox'); dstRef.extension = '';
    const srcPath = path.join(SANDBOX_DIR, 'mv-src');
    const dstPath = path.join(SANDBOX_DIR, 'mv-dst');
    fs.mkdirSync(srcPath, { recursive: true });
    if (fs.existsSync(dstPath)) fs.rmdirSync(dstPath);
    await rootHandler.move(srcRef, dstRef);
    expect(fs.existsSync(srcPath)).toBe(false);
    expect(fs.existsSync(dstPath)).toBe(true);
    fs.rmdirSync(dstPath);
  });
});
