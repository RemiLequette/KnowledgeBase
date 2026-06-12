import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initTool as initLs }     from '../tool-handlers/forge-ls.js';
import { initTool as initMkdir }  from '../tool-handlers/forge-mkdir.js';
import { initTool as initRmdir }  from '../tool-handlers/forge-rmdir.js';
import { initTool as initMove }   from '../tool-handlers/forge-move.js';
import { initTool as initRename } from '../tool-handlers/forge-rename.js';

// ---------------------------------------------------------------------------
// Mock rootRegistry
// ---------------------------------------------------------------------------

function makeRegistry(overrides = {}) {
  return {
    rootRefs: vi.fn().mockReturnValue([{ root: 'dev' }, { root: 'drop' }]),
    list:     vi.fn().mockResolvedValue({ folders: [], artifacts: [] }),
    mkdir:    vi.fn().mockResolvedValue(undefined),
    rmdir:    vi.fn().mockResolvedValue(undefined),
    mvdir:    vi.fn().mockResolvedValue(undefined),
    rndir:    vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// forge_ls
// ---------------------------------------------------------------------------

describe('forge_ls', () => {
  let rootRegistry;
  let tool;

  beforeEach(async () => {
    rootRegistry = makeRegistry();
    tool = await initLs({}, { rootRegistry });
  });

  it('no path — returns list of root names', async () => {
    const result = await tool.execute({});
    expect(result.roots).toEqual(['dev', 'drop']);
    expect(rootRegistry.rootRefs).toHaveBeenCalled();
  });

  it('folder path — calls list() and returns entries', async () => {
    rootRegistry.list.mockResolvedValue({
      folders:   [{ root: 'dev', path: 'sub/', name: '', extension: '' }],
      artifacts: [{ root: 'dev', path: '',    name: 'readme', extension: '.md' }],
    });
    const result = await tool.execute({ path: 'dev/docs/' });
    expect(rootRegistry.list).toHaveBeenCalled();
    expect(result.entries).toHaveLength(2);
    expect(result.entries[0].type).toBe('folder');
    expect(result.entries[1].type).toBe('file');
  });

  it('no rootRegistry — returns not-implemented stub', async () => {
    const stub = await initLs({});
    const result = await stub.execute({});
    expect(result.ok).toBe('not implemented');
  });
});

// ---------------------------------------------------------------------------
// forge_mkdir
// ---------------------------------------------------------------------------

describe('forge_mkdir', () => {
  let rootRegistry;
  let tool;

  beforeEach(async () => {
    rootRegistry = makeRegistry();
    tool = await initMkdir({}, { rootRegistry });
  });

  it('calls rootRegistry.mkdir with a folder ref', async () => {
    const result = await tool.execute({ path: 'dev/docs/' });
    expect(rootRegistry.mkdir).toHaveBeenCalled();
    const ref = rootRegistry.mkdir.mock.calls[0][0];
    expect(ref.root).toBe('dev');
    expect(ref.name).toBe('');
    expect(result.ok).toMatch(/dev\/docs\//);
  });

  it('throws when path is missing', async () => {
    await expect(tool.execute({})).rejects.toThrow('path');
  });

  it('no rootRegistry — returns not-implemented stub', async () => {
    const stub = await initMkdir({});
    const result = await stub.execute({ path: 'dev/docs/' });
    expect(result.ok).toBe('not implemented');
  });
});

// ---------------------------------------------------------------------------
// forge_rmdir
// ---------------------------------------------------------------------------

describe('forge_rmdir', () => {
  let rootRegistry;
  let tool;

  beforeEach(async () => {
    rootRegistry = makeRegistry();
    tool = await initRmdir({}, { rootRegistry });
  });

  it('calls rootRegistry.rmdir with a folder ref', async () => {
    const result = await tool.execute({ path: 'dev/docs/' });
    expect(rootRegistry.rmdir).toHaveBeenCalled();
    const ref = rootRegistry.rmdir.mock.calls[0][0];
    expect(ref.root).toBe('dev');
    expect(result.ok).toMatch(/dev\/docs\//);
  });

  it('throws when path is missing', async () => {
    await expect(tool.execute({})).rejects.toThrow('path');
  });
});

// ---------------------------------------------------------------------------
// forge_move
// ---------------------------------------------------------------------------

describe('forge_move', () => {
  let rootRegistry;
  let tool;

  beforeEach(async () => {
    rootRegistry = makeRegistry();
    tool = await initMove({}, { rootRegistry });
  });

  it('calls rootRegistry.mvdir for same-root folder move', async () => {
    const result = await tool.execute({ path: 'dev/src/', target: 'dev/dst/' });
    expect(rootRegistry.mvdir).toHaveBeenCalled();
    expect(result.ok).toMatch(/dev\/src/);
  });

  it('throws when source and target are on different roots', async () => {
    await expect(tool.execute({ path: 'dev/src/', target: 'drop/dst/' }))
      .rejects.toThrow('roots');
  });

  it('throws when path is missing', async () => {
    await expect(tool.execute({ target: 'dev/dst/' })).rejects.toThrow('path');
  });

  it('throws when target is missing', async () => {
    await expect(tool.execute({ path: 'dev/src/' })).rejects.toThrow('target');
  });
});

// ---------------------------------------------------------------------------
// forge_rename
// ---------------------------------------------------------------------------

describe('forge_rename', () => {
  let rootRegistry;
  let tool;

  beforeEach(async () => {
    rootRegistry = makeRegistry();
    tool = await initRename({}, { rootRegistry });
  });

  it('calls rootRegistry.rndir with ref and new name', async () => {
    const result = await tool.execute({ path: 'dev/docs/', name: 'documentation' });
    expect(rootRegistry.rndir).toHaveBeenCalled();
    const [ref, name] = rootRegistry.rndir.mock.calls[0];
    expect(ref.root).toBe('dev');
    expect(name).toBe('documentation');
    expect(result.ok).toMatch(/documentation/);
  });

  it('throws when path is missing', async () => {
    await expect(tool.execute({ name: 'new-name' })).rejects.toThrow('path');
  });

  it('throws when name is missing', async () => {
    await expect(tool.execute({ path: 'dev/docs/' })).rejects.toThrow('name');
  });
});
