/**
 * forge-fal.test.js
 *
 * Unit tests for parseFAL and toFAL (src/fal.js).
 * fal.js is the MCP boundary layer — imported only by mcp-tools.js.
 *
 * References:
 *   - conventions/forge.md v7.0 [section Forge Artifact Locator FAL]
 */

import { describe, it, expect } from 'vitest';
import { parseFAL, toFAL } from '../../public/tools/forge/src/fal.js';

// -------------------------------------------------------------------------
// parseFAL — artifact FALs
// -------------------------------------------------------------------------

describe('parseFAL — artifact FALs', () => {
  it('simple', () => {
    const r = parseFAL('forge://test/sample.md');
    expect(r.root).toBe('test');
    expect(r.path).toBe('');
    expect(r.name).toBe('sample');
    expect(r.type).toBe('md');
    expect(r.block).toBe('');
  });

  it('with folder path', () => {
    const r = parseFAL('forge://development/with-claude/knowledgebase/public/INDEX.md');
    expect(r.root).toBe('development');
    expect(r.path).toBe('with-claude/knowledgebase/public/');
    expect(r.name).toBe('INDEX');
    expect(r.type).toBe('md');
    expect(r.block).toBe('');
  });

  it('with block', () => {
    const r = parseFAL('forge://kb/public/TODO.doc-todolist#section:High-priority');
    expect(r.name).toBe('TODO');
    expect(r.type).toBe('doc-todolist');
    expect(r.block).toBe('section:High-priority');
  });

  it('dash in type name', () => {
    const r = parseFAL('forge://dev/notes.md-doc');
    expect(r.type).toBe('md-doc');
    expect(r.name).toBe('notes');
  });

  it('namespaced type', () => {
    const r = parseFAL('forge://commwise:production/bloc.commwise:layout');
    expect(r.root).toBe('commwise:production');
    expect(r.name).toBe('bloc');
    expect(r.type).toBe('commwise:layout');
  });
});

// -------------------------------------------------------------------------
// parseFAL — folder FALs
// -------------------------------------------------------------------------

describe('parseFAL — folder FALs', () => {
  it('root level', () => {
    const r = parseFAL('forge://test/');
    expect(r.root).toBe('test');
    expect(r.path).toBe('');
    expect(r.name).toBe('');
    expect(r.type).toBe('');
  });

  it('with path', () => {
    const r = parseFAL('forge://development/with-claude/knowledgebase/');
    expect(r.root).toBe('development');
    expect(r.path).toBe('with-claude/knowledgebase/');
    expect(r.name).toBe('');
  });

  it('name is empty string', () => {
    const r = parseFAL('forge://test/subdir/');
    expect(r.name).toBe('');
  });
});

// -------------------------------------------------------------------------
// parseFAL — errors
// -------------------------------------------------------------------------

describe('parseFAL — errors', () => {
  it('throws on missing forge:// prefix', () => {
    expect(() => parseFAL('test/sample.md')).toThrow(/must start with forge:\/\//);
  });

  it('throws on missing path separator', () => {
    expect(() => parseFAL('forge://test')).toThrow(/missing path separator/);
  });

  it('throws on empty root', () => {
    expect(() => parseFAL('forge:///sample.md')).toThrow(/empty root/);
  });

  it('throws on artifact name without extension', () => {
    expect(() => parseFAL('forge://test/noextension')).toThrow(/no type extension/);
  });

  it('throws on empty name before extension', () => {
    expect(() => parseFAL('forge://test/.md')).toThrow(/empty before extension/);
  });

  it('throws on empty type extension', () => {
    expect(() => parseFAL('forge://test/name.')).toThrow(/empty type extension/);
  });
});

// -------------------------------------------------------------------------
// toFAL — round-trip
// -------------------------------------------------------------------------

describe('toFAL — round-trip', () => {
  it('artifact ref round-trip', () => {
    const fal = 'forge://test/sample.md';
    expect(toFAL(parseFAL(fal))).toBe(fal);
  });

  it('artifact with path round-trip', () => {
    const fal = 'forge://development/with-claude/knowledgebase/public/INDEX.md';
    expect(toFAL(parseFAL(fal))).toBe(fal);
  });

  it('folder ref round-trip', () => {
    const fal = 'forge://test/';
    expect(toFAL(parseFAL(fal))).toBe(fal);
  });

  it('folder with path round-trip', () => {
    const fal = 'forge://development/with-claude/knowledgebase/';
    expect(toFAL(parseFAL(fal))).toBe(fal);
  });

  it('folder ref (name empty) produces trailing slash', () => {
    const ref = { root: 'test', path: 'subdir/', name: '', type: '' };
    expect(toFAL(ref)).toMatch(/\/$/);
  });
});

// -------------------------------------------------------------------------
// isFolder helper
// -------------------------------------------------------------------------

describe('isFolder helper — name === "" discriminates folder vs artifact', () => {
  it('folder FAL has name === ""', () => {
    expect(parseFAL('forge://test/').name).toBe('');
  });

  it('artifact FAL has name !== ""', () => {
    expect(parseFAL('forge://test/sample.md').name).not.toBe('');
  });
});
