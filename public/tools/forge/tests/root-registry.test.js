import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RootRegistry } from '../src/root-registry.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a mock root handler — all methods are vi.fn() returning undefined.
 */
function makeHandler(overrides = {}) {
  return {
    registerRoot: vi.fn(),
    list:         vi.fn(),
    mkdir:        vi.fn(),
    rmdir:        vi.fn(),
    move:         vi.fn(),
    rename:       vi.fn(),
    create:       vi.fn(),
    read:         vi.fn(),
    write:        vi.fn(),
    delete:       vi.fn(),
    ...overrides,
  };
}

/**
 * Build a RootRegistry pre-loaded with one or more named roots.
 * Bypasses import() — injects handlers directly into registry.handlers.
 *
 * roots: [{ name, url, handler? }]  (handler defaults to makeHandler())
 */
function makeRegistry(roots) {
  const registry = new RootRegistry();
  registry.roots = roots.map(r => ({ name: r.name, url: r.url, handler: r.handlerUrl || 'mock' }));
  for (const r of roots) {
    const handler = r.handler ?? makeHandler();
    registry.handlers.set(r.name, { handler, root: { name: r.name, url: r.url } });
  }
  return registry;
}

const ROOT_A = { name: 'a', url: 'file:///tmp/a' };
const ROOT_B = { name: 'b', url: 'file:///tmp/b' };

// ---------------------------------------------------------------------------
// rootRefs()
// ---------------------------------------------------------------------------

describe('rootRefs()', () => {
  it('returns an empty array when no roots are loaded', () => {
    const registry = new RootRegistry();
    expect(registry.rootRefs()).toEqual([]);
  });

  it('returns one ref per loaded root', () => {
    const registry = makeRegistry([ROOT_A, ROOT_B]);
    const refs = registry.rootRefs();
    expect(refs).toHaveLength(2);
    expect(refs.map(r => r.root)).toEqual(['a', 'b']);
  });

  it('each ref has empty path, name, and type', () => {
    const registry = makeRegistry([ROOT_A]);
    const [ref] = registry.rootRefs();
    expect(ref).toMatchObject({ root: 'a', path: '', name: '', type: '' });
  });
});

// ---------------------------------------------------------------------------
// IRootRegistry — read / write / create / delete
// ---------------------------------------------------------------------------

describe('IRootRegistry', () => {
  let handler;
  let registry;
  const urlRef = { root: 'a', path: 'docs/', name: 'readme', extension: '.md', _url: 'file:///tmp/a/docs/readme.md' };

  beforeEach(() => {
    handler  = makeHandler();
    registry = makeRegistry([{ ...ROOT_A, handler }]);
  });

  it('read() delegates to the root handler', async () => {
    handler.read.mockResolvedValue('content');
    const result = await registry.read(urlRef);
    expect(handler.read).toHaveBeenCalledWith(urlRef);
    expect(result).toBe('content');
  });

  it('write() delegates to the root handler', async () => {
    await registry.write(urlRef, 'new content');
    expect(handler.write).toHaveBeenCalledWith(urlRef, 'new content');
  });

  it('create() delegates to the root handler', async () => {
    await registry.create(urlRef);
    expect(handler.create).toHaveBeenCalledWith(urlRef);
  });

  it('delete() delegates to the root handler', async () => {
    await registry.delete(urlRef);
    expect(handler.delete).toHaveBeenCalledWith(urlRef);
  });

  it('read() throws for unknown root', async () => {
    await expect(registry.read({ ...urlRef, root: 'unknown' }))
      .rejects.toThrow('unknown');
  });

  it('write() throws for unknown root', async () => {
    await expect(registry.write({ ...urlRef, root: 'unknown' }, 'x'))
      .rejects.toThrow('unknown');
  });

  it('create() throws for unknown root', async () => {
    await expect(registry.create({ ...urlRef, root: 'unknown' }))
      .rejects.toThrow('unknown');
  });

  it('delete() throws for unknown root', async () => {
    await expect(registry.delete({ ...urlRef, root: 'unknown' }))
      .rejects.toThrow('unknown');
  });
});

// ---------------------------------------------------------------------------
// Folder operations
// ---------------------------------------------------------------------------

describe('folder operations', () => {
  let handler;
  let registry;
  const folderRef = { root: 'a', path: 'docs/', name: '', type: '' };

  beforeEach(() => {
    handler  = makeRegistry([{ ...ROOT_A, handler: makeHandler() }]);
    handler  = makeHandler();
    registry = makeRegistry([{ ...ROOT_A, handler }]);
  });

  it('list() delegates to the root handler', async () => {
    handler.list.mockResolvedValue({ folders: [], artifacts: [] });
    const result = await registry.list(folderRef);
    expect(handler.list).toHaveBeenCalled();
    expect(result).toEqual({ folders: [], artifacts: [] });
  });

  it('mkdir() delegates to the root handler', async () => {
    await registry.mkdir(folderRef);
    expect(handler.mkdir).toHaveBeenCalled();
  });

  it('rmdir() delegates to the root handler', async () => {
    await registry.rmdir(folderRef);
    expect(handler.rmdir).toHaveBeenCalled();
  });

  it('rndir() delegates to the root handler', async () => {
    await registry.rndir(folderRef, 'new-name');
    expect(handler.rename).toHaveBeenCalled();
  });

  it('list() throws for unknown root', async () => {
    await expect(registry.list({ ...folderRef, root: 'unknown' }))
      .rejects.toThrow('unknown');
  });

  it('mkdir() throws for unknown root', async () => {
    await expect(registry.mkdir({ ...folderRef, root: 'unknown' }))
      .rejects.toThrow('unknown');
  });
});

// ---------------------------------------------------------------------------
// mvdir() — cross-root guard
// ---------------------------------------------------------------------------

describe('mvdir()', () => {
  let handlerA;
  let registry;

  beforeEach(() => {
    handlerA = makeHandler();
    registry = makeRegistry([
      { ...ROOT_A, handler: handlerA },
      { ...ROOT_B, handler: makeHandler() },
    ]);
  });

  it('delegates to the root handler when same root', async () => {
    const src = { root: 'a', path: 'src/', name: '', type: '' };
    const dst = { root: 'a', path: 'dst/', name: '', type: '' };
    await registry.mvdir(src, dst);
    expect(handlerA.move).toHaveBeenCalled();
  });

  it('throws when moving across roots', async () => {
    const src = { root: 'a', path: 'src/', name: '', type: '' };
    const dst = { root: 'b', path: 'dst/', name: '', type: '' };
    await expect(registry.mvdir(src, dst))
      .rejects.toThrow('Cannot move folder across roots');
  });
});
