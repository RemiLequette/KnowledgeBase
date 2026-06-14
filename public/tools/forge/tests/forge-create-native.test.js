/**
 * forge-create-native.test.js — unit tests for forge_create native fallback
 *
 * Tests the case where no format handler is registered for the given format name.
 * MVP-1: .md and .js files have no structured handler — native fallback must apply.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initTool as initCreate } from '../tool-handlers/forge-create.js';

function makeRootRegistry(overrides = {}) {
  return {
    create: vi.fn().mockResolvedValue(undefined),
    write:  vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeFormatRegistry(overrides = {}) {
  return {
    getByName: vi.fn().mockReturnValue(null), // no handler — native fallback
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// forge_create — native fallback
// ---------------------------------------------------------------------------

describe('forge_create — native fallback', () => {
  let rootRegistry, formatRegistry, tool;

  beforeEach(async () => {
    rootRegistry   = makeRootRegistry();
    formatRegistry = makeFormatRegistry();
    tool = await initCreate({}, { rootRegistry, formatRegistry });
  });

  it('creates an empty file via rootRegistry when no handler is registered', async () => {
    const result = await tool.execute({ path: 'dev/dummy.md', format: 'md' });
    expect(rootRegistry.create).toHaveBeenCalled();
    expect(result.ok).toBeDefined();
    expect(result.path).toBe('dev/dummy.md');
  });

  it('works for .js files too', async () => {
    const result = await tool.execute({ path: 'dev/dummy.js', format: 'js' });
    expect(rootRegistry.create).toHaveBeenCalled();
    expect(result.ok).toBeDefined();
  });

  it('does not call rootRegistry.write on native create', async () => {
    await tool.execute({ path: 'dev/dummy.md', format: 'md' });
    expect(rootRegistry.write).not.toHaveBeenCalled();
  });

  it('throws when path is missing', async () => {
    await expect(tool.execute({ format: 'md' })).rejects.toThrow('path');
  });

  it('throws when format is missing', async () => {
    await expect(tool.execute({ path: 'dev/dummy.md' })).rejects.toThrow('format');
  });
});

// ---------------------------------------------------------------------------
// forge_create — structured handler (existing behaviour unchanged)
// ---------------------------------------------------------------------------

describe('forge_create — structured handler', () => {
  let rootRegistry, formatRegistry, tool;

  beforeEach(async () => {
    const handler = {
      create: vi.fn().mockResolvedValue(undefined),
    };
    rootRegistry   = makeRootRegistry();
    formatRegistry = {
      getByName: vi.fn().mockReturnValue(handler),
      _handler: handler,
    };
    tool = await initCreate({}, { rootRegistry, formatRegistry });
  });

  it('delegates to handler.create when a handler is registered', async () => {
    const result = await tool.execute({ path: 'dev/doc.md', format: 'doc' });
    expect(formatRegistry._handler.create).toHaveBeenCalled();
    expect(rootRegistry.create).not.toHaveBeenCalled();
    expect(result.ok).toBeDefined();
  });
});
