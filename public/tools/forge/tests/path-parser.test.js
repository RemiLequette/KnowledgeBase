import { describe, it, expect } from 'vitest';
import { parsePath, serializePath } from '../src/path-parser.js';

// ---------------------------------------------------------------------------
// parsePath()
// ---------------------------------------------------------------------------

describe('parsePath() — file refs', () => {
  it('parses root + path + name + extension', () => {
    const ref = parsePath('development/docs/readme.md');
    expect(ref).toEqual({ root: 'development', path: 'docs/', name: 'readme', extension: '.md' });
  });

  it('parses file at root level (no subdirectory)', () => {
    const ref = parsePath('development/readme.md');
    expect(ref).toEqual({ root: 'development', path: '', name: 'readme', extension: '.md' });
  });

  it('parses deeply nested file', () => {
    const ref = parsePath('development/a/b/c/file.js');
    expect(ref).toEqual({ root: 'development', path: 'a/b/c/', name: 'file', extension: '.js' });
  });

  it('parses file with no extension', () => {
    const ref = parsePath('development/docs/Makefile');
    expect(ref).toEqual({ root: 'development', path: 'docs/', name: 'Makefile', extension: '' });
  });
});

describe('parsePath() — folder refs', () => {
  it('parses folder path with trailing slash', () => {
    const ref = parsePath('development/docs/');
    expect(ref).toEqual({ root: 'development', path: 'docs/', name: '', extension: '' });
  });

  it('parses root folder (just rootName/)', () => {
    const ref = parsePath('development/');
    expect(ref).toEqual({ root: 'development', path: '', name: '', extension: '' });
  });

  it('parses path with no slash — treated as root name only', () => {
    const ref = parsePath('development');
    expect(ref).toEqual({ root: 'development', path: '', name: '', extension: '' });
  });

  it('hint folder forces folder ref even without trailing slash', () => {
    const ref = parsePath('development/docs', 'folder');
    expect(ref.name).toBe('');
    expect(ref.path).toBe('docs/');
  });

  it('parses nested folder with trailing slash', () => {
    const ref = parsePath('development/a/b/c/');
    expect(ref).toEqual({ root: 'development', path: 'a/b/c/', name: '', extension: '' });
  });
});

describe('parsePath() — edge cases', () => {
  it('throws when path is empty string', () => {
    expect(() => parsePath('')).toThrow();
  });

  it('normalizes backslashes to forward slashes', () => {
    const ref = parsePath('development\\docs\\readme.md');
    expect(ref.root).toBe('development');
    expect(ref.name).toBe('readme');
  });
});

// ---------------------------------------------------------------------------
// serializePath()
// ---------------------------------------------------------------------------

describe('serializePath()', () => {
  it('serializes a file ref', () => {
    const ref = { root: 'development', path: 'docs/', name: 'readme', extension: '.md' };
    expect(serializePath(ref)).toBe('development/docs/readme.md');
  });

  it('serializes a file ref with no extension', () => {
    const ref = { root: 'development', path: '', name: 'Makefile', extension: '' };
    expect(serializePath(ref)).toBe('development/Makefile');
  });

  it('serializes a folder ref', () => {
    const ref = { root: 'development', path: 'docs/', name: '', extension: '' };
    expect(serializePath(ref)).toBe('development/docs/');
  });

  it('serializes a root folder ref', () => {
    const ref = { root: 'development', path: '', name: '', extension: '' };
    expect(serializePath(ref)).toBe('development/');
  });

  it('round-trips parsePath → serializePath for file', () => {
    const original = 'development/docs/readme.md';
    expect(serializePath(parsePath(original))).toBe(original);
  });

  it('round-trips parsePath → serializePath for folder', () => {
    const original = 'development/docs/';
    expect(serializePath(parsePath(original))).toBe(original);
  });
});
