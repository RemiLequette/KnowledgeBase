/**
 * startup.test.js — smoke test for MCP server startup
 *
 * Reproduces the startup path of startMcpServer() without the MCP SDK transport.
 * Loads real config files and real handlers — no mocks.
 *
 * This test catches crashes that only manifest when the real forge-tools.json,
 * forge.config.json, and all tool handlers are wired together. It is the
 * programmatic equivalent of running `node forge.js` and checking it stays alive.
 *
 * References:
 *   - src/mcp-server.js [startMcpServer()]
 *   - forge-tools.json
 *   - forge.config.json
 */

import { describe, it, expect } from 'vitest';
import fs   from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { McpServer }      from '../src/mcp-server.js';
import { RootRegistry }   from '../src/root-registry.js';
import { FormatRegistry } from '../src/format-registry.js';

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const FORGE_ROOT  = path.resolve(__dirname, '..');
const TOOLS_PATH  = path.join(FORGE_ROOT, 'forge-tools.json');
const CONFIG_PATH = path.join(FORGE_ROOT, 'forge.config.json');

/**
 * Build a real context (rootRegistry + formatRegistry) from the production
 * config files — mirrors the first half of startMcpServer().
 */
async function buildRealContext() {
  const forgeConfig    = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  const rootRegistry   = new RootRegistry();
  const formatRegistry = new FormatRegistry();

  await rootRegistry.load(forgeConfig.roots);

  const formatsPath = path.join(FORGE_ROOT, 'forge-formats.json');
  if (fs.existsSync(formatsPath)) await formatRegistry.load(formatsPath);

  return { rootRegistry, formatRegistry };
}

// ---------------------------------------------------------------------------
// Startup smoke test
// ---------------------------------------------------------------------------

describe('MCP server startup', () => {
  it('loads all real tool handlers without error', async () => {
    const context = await buildRealContext();
    const server  = new McpServer();
    await expect(server.loadTools(TOOLS_PATH, context)).resolves.not.toThrow();
  });

  it('registers all 9 tools declared in forge-tools.json', async () => {
    const context = await buildRealContext();
    const server  = new McpServer();
    await server.loadTools(TOOLS_PATH, context);

    const expected = [
      'forge_ls', 'forge_mkdir', 'forge_rmdir', 'forge_move', 'forge_rename',
      'forge_read', 'forge_write', 'forge_create', 'forge_delete',
    ];
    expect(server.toolNames()).toHaveLength(expected.length);
    for (const name of expected) {
      expect(server.toolNames()).toContain(name);
    }
  });

  it('forge_ls with no path returns the configured roots', async () => {
    const context = await buildRealContext();
    const server  = new McpServer();
    await server.loadTools(TOOLS_PATH, context);

    const result = await server.dispatch('forge_ls', {});
    expect(result).toHaveProperty('roots');
    expect(Array.isArray(result.roots)).toBe(true);
    expect(result.roots.length).toBeGreaterThan(0);
  });
});
