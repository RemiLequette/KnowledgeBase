#!/usr/bin/env node
/**
 * forge.js
 *
 * Forge MCP server v3.0 — entry point.
 * Loads config, initialises registries, starts the MCP server.
 *
 * Responsibilities:
 *   - Load forge.config.json
 *   - Instantiate TypeRegistry and RootRegistry
 *   - Register MCP tools and dispatcher
 *   - Export TypeRegistry, RootRegistry, testConfig for unit tests
 *
 * All logic lives in src/:
 *   src/logger.js         — log()
 *   src/type-registry.js  — TypeRegistry
 *   src/root-registry.js  — RootRegistry
 *   src/mcp-tools.js      — TOOL_DEFINITIONS, dispatch()
 *
 * Entry-point guard:
 *   The MCP server starts only when this file is run directly (not imported).
 *   This allows test files to import TypeRegistry/RootRegistry without starting the server.
 *
 * References:
 *   - conventions/forge.md v7.0
 *   - conventions/tools.md
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

import { log }          from './src/logger.js';
import { TypeRegistry } from './src/type-registry.js';
import { RootRegistry } from './src/root-registry.js';
import { TOOL_DEFINITIONS, dispatch } from './src/mcp-tools.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// testConfig — exported for unit tests
// ---------------------------------------------------------------------------

export const testConfig = {
  roots: [
    {
      name: 'test',
      url: pathToFileURL(path.join(__dirname, 'tests', 'fixtures')).href + '/',
      handler: pathToFileURL(path.join(__dirname, 'handlers', 'file-root.js')).href
    }
  ],
  types: pathToFileURL(path.join(__dirname, 'forge-types.json')).href
};

// ---------------------------------------------------------------------------
// Re-exports for unit tests
// ---------------------------------------------------------------------------

export { TypeRegistry, RootRegistry };

// ---------------------------------------------------------------------------
// MCP Server — only started when this file is the entry point
// ---------------------------------------------------------------------------

const IS_ENTRY_POINT = import.meta.url === pathToFileURL(process.argv[1]).href;

if (IS_ENTRY_POINT) {
  await startServer();
}

async function startServer() {
  let config;
  try {
    const configPath = path.join(__dirname, 'forge.config.json');
    if (!fs.existsSync(configPath)) throw new Error(`forge.config.json not found at ${configPath}`);
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    log('INFO', `Config loaded`);
  } catch (err) {
    log('ERROR', `Failed to load config: ${err.message}`);
    process.exit(1);
  }

  const typeRegistry = new TypeRegistry();
  const rootRegistry = new RootRegistry();

  try {
    await typeRegistry.load(config.types);
    await rootRegistry.load(config.roots);
    log('INFO', 'Registries loaded');
  } catch (err) {
    log('ERROR', `Failed to load registries: ${err.message}`);
    process.exit(1);
  }

  const ctx = { typeRegistry, rootRegistry, config };

  const server = new Server(
    { name: 'forge', version: '3.0.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOL_DEFINITIONS
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return dispatch(name, args, ctx);
  });

  log('INFO', 'Forge MCP server starting — v3.0.0');
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log('INFO', 'Forge MCP server running on stdio');
  console.error('Forge MCP server running on stdio');
}
