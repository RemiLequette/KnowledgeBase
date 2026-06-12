import { describe, it, expect } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { McpServer } from '../src/mcp-server.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES  = path.join(__dirname, 'fixtures');

function fixturePath(name) {
  return path.join(FIXTURES, name);
}

async function loadServer(jsonFile) {
  const server = new McpServer();
  await server.loadTools(fixturePath(jsonFile));
  return server;
}

// ---------------------------------------------------------------------------
// loadTools() — startup
// ---------------------------------------------------------------------------

describe('loadTools()', () => {
  it('loads without error for a valid config', async () => {
    await expect(loadServer('forge-tools-test.json')).resolves.toBeDefined();
  });

  it('registers all tools declared in the config', async () => {
    const server = await loadServer('forge-tools-test.json');
    expect(server.toolNames()).toHaveLength(3);
    expect(server.toolNames()).toContain('forge_read');
    expect(server.toolNames()).toContain('forge_write');
    expect(server.toolNames()).toContain('forge_ls');
  });

  it('throws if config file does not exist', async () => {
    await expect(loadServer('missing.json')).rejects.toThrow();
  });

  it('throws if a tool handler path cannot be resolved', async () => {
    await expect(loadServer('forge-tools-bad-handler.json')).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// dispatch() — tool call routing
// ---------------------------------------------------------------------------

describe('dispatch()', () => {
  it('calls the correct handler for a known tool', async () => {
    const server = await loadServer('forge-tools-test.json');
    const result = await server.dispatch('forge_read', { path: 'foo.md' });
    expect(result).toBeDefined();
  });

  it('passes input to the handler', async () => {
    const server = await loadServer('forge-tools-test.json');
    const result = await server.dispatch('forge_read', { path: 'foo.md', query: 'why' });
    expect(result._input).toEqual({ path: 'foo.md', query: 'why' });
  });

  it('returns the handler result', async () => {
    const server = await loadServer('forge-tools-test.json');
    const result = await server.dispatch('forge_ls', {});
    expect(result).toMatchObject({ ok: 'mock' });
  });

  it('throws a clear error for an unknown tool name', async () => {
    const server = await loadServer('forge-tools-test.json');
    await expect(server.dispatch('forge_unknown', {}))
      .rejects.toThrow('forge_unknown');
  });

  it('propagates errors thrown by the handler', async () => {
    const server = await loadServer('forge-tools-throwing.json');
    await expect(server.dispatch('forge_read', { path: 'x.md' }))
      .rejects.toThrow('mock-tool-error');
  });
});
