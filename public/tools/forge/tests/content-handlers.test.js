import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initTool as initRead }   from '../tool-handlers/forge-read.js';
import { initTool as initWrite }  from '../tool-handlers/forge-write.js';
import { initTool as initCreate } from '../tool-handlers/forge-create.js';
import { initTool as initDelete } from '../tool-handlers/forge-delete.js';

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function makeFormatHandler(overrides = {}) {
  return {
    claim:    vi.fn().mockResolvedValue(true),
    read:     vi.fn().mockResolvedValue({ format: 'doc', why: 'content' }),
    write:    vi.fn().mockResolvedValue(undefined),
    create:   vi.fn().mockResolvedValue(undefined),
    describe: vi.fn().mockReturnValue({ description: 'mock', example: {} }),
    ...overrides,
  };
}

function makeFormatRegistry(overrides = {}) {
  const handler = makeFormatHandler();
  return {
    _handler: handler,
    dispatch:   vi.fn().mockResolvedValue(handler),
    getByName:  vi.fn().mockReturnValue(handler),
    ...overrides,
  };
}

function makeRootRegistry(overrides = {}) {
  return {
    read:   vi.fn().mockResolvedValue('raw file content'),
    write:  vi.fn().mockResolvedValue(undefined),
    create: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function ext(path) {
  const i = path.lastIndexOf('.');
  return i >= 0 ? path.slice(i + 1) : '';
}

// ---------------------------------------------------------------------------
// forge_read
// ---------------------------------------------------------------------------

describe('forge_read', () => {
  let rootRegistry, formatRegistry, tool;

  beforeEach(async () => {
    rootRegistry   = makeRootRegistry();
    formatRegistry = makeFormatRegistry();
    tool = await initRead({}, { rootRegistry, formatRegistry });
  });

  it('reads the file via rootRegistry', async () => {
    await tool.execute({ path: 'dev/readme.md' });
    expect(rootRegistry.read).toHaveBeenCalled();
  });

  it('dispatches claim loop and calls handler.read', async () => {
    const result = await tool.execute({ path: 'dev/readme.md' });
    expect(formatRegistry.dispatch).toHaveBeenCalled();
    expect(formatRegistry._handler.read).toHaveBeenCalled();
    expect(result.format).toBe('doc');
  });

  it('native fallback when no handler claims the file', async () => {
    formatRegistry.dispatch.mockResolvedValue(null);
    const result = await tool.execute({ path: 'dev/readme.md' });
    expect(result.format).toBe('md');
    expect(result.content).toBe('raw file content');
  });

  it('passes query to handler.read', async () => {
    await tool.execute({ path: 'dev/readme.md', query: 'why' });
    const [, , query] = formatRegistry._handler.read.mock.calls[0];
    expect(query).toBe('why');
  });

  it('throws when path is missing', async () => {
    await expect(tool.execute({})).rejects.toThrow('path');
  });
});

// ---------------------------------------------------------------------------
// forge_write
// ---------------------------------------------------------------------------

describe('forge_write', () => {
  let rootRegistry, formatRegistry, tool;

  beforeEach(async () => {
    rootRegistry   = makeRootRegistry();
    formatRegistry = makeFormatRegistry();
    tool = await initWrite({}, { rootRegistry, formatRegistry });
  });

  it('reads the file then calls handler.write', async () => {
    await tool.execute({ path: 'dev/readme.md', payload: { why: 'new' } });
    expect(rootRegistry.read).toHaveBeenCalled();
    expect(formatRegistry._handler.write).toHaveBeenCalled();
    const [, , payload] = formatRegistry._handler.write.mock.calls[0];
    expect(payload).toEqual({ why: 'new' });
  });

  it('native fallback — writes raw content string directly', async () => {
    formatRegistry.dispatch.mockResolvedValue(null);
    await tool.execute({ path: 'dev/readme.md', payload: { content: 'new text' } });
    expect(rootRegistry.write).toHaveBeenCalled();
    const [, written] = rootRegistry.write.mock.calls[0];
    expect(written).toBe('new text');
  });

  it('throws when path is missing', async () => {
    await expect(tool.execute({ payload: {} })).rejects.toThrow('path');
  });

  it('throws when payload is missing', async () => {
    await expect(tool.execute({ path: 'dev/readme.md' })).rejects.toThrow('payload');
  });
});

// ---------------------------------------------------------------------------
// forge_create
// ---------------------------------------------------------------------------

describe('forge_create', () => {
  let rootRegistry, formatRegistry, tool;

  beforeEach(async () => {
    rootRegistry   = makeRootRegistry();
    formatRegistry = makeFormatRegistry();
    tool = await initCreate({}, { rootRegistry, formatRegistry });
  });

  it('looks up format by name and calls handler.create', async () => {
    const result = await tool.execute({ path: 'dev/new.md', format: 'doc' });
    expect(formatRegistry.getByName).toHaveBeenCalledWith('doc');
    expect(formatRegistry._handler.create).toHaveBeenCalled();
    expect(result.ok).toBeDefined();
    expect(result.path).toBe('dev/new.md');
  });

  it('throws for unknown format name', async () => {
    formatRegistry.getByName.mockReturnValue(null);
    await expect(tool.execute({ path: 'dev/new.md', format: 'ghost' }))
      .rejects.toThrow('ghost');
  });

  it('throws when path is missing', async () => {
    await expect(tool.execute({ format: 'doc' })).rejects.toThrow('path');
  });

  it('throws when format is missing', async () => {
    await expect(tool.execute({ path: 'dev/new.md' })).rejects.toThrow('format');
  });
});

// ---------------------------------------------------------------------------
// forge_delete
// ---------------------------------------------------------------------------

describe('forge_delete', () => {
  let rootRegistry, tool;

  beforeEach(async () => {
    rootRegistry = makeRootRegistry();
    tool = await initDelete({}, { rootRegistry });
  });

  it('calls rootRegistry.delete with the file ref', async () => {
    const result = await tool.execute({ path: 'dev/readme.md' });
    expect(rootRegistry.delete).toHaveBeenCalled();
    expect(result.ok).toBeDefined();
  });

  it('throws when path is missing', async () => {
    await expect(tool.execute({})).rejects.toThrow('path');
  });
});
