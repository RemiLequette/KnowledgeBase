#!/usr/bin/env node
/**
 * forge.js
 *
 * Forge MCP server v3.0 — entry point.
 * Loads config, initialises registries, starts the MCP server.
 *
 * All logic lives in src/:
 *   src/logger.js         — log()
 *   src/type-registry.js  — TypeRegistry
 *   src/root-registry.js  — RootRegistry
 *   src/mcp-tools.js      — TOOL_DEFINITIONS, dispatch()
 *
 * Entry-point guard:
 *   The MCP server starts only when this file is run directly (not imported).
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
import { createSession } from './src/forge-api.js';
import { TOOL_DEFINITIONS, dispatch } from './src/mcp-tools.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

export { TypeRegistry } from './src/type-registry.js';
export { RootRegistry } from './src/root-registry.js';

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

  const session = await createSession(config);

  const server = new Server(
    { name: 'forge', version: '3.0.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOL_DEFINITIONS
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return dispatch(name, args, session);
  });

  log('INFO', 'Forge MCP server starting — v3.0.0');
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log('INFO', 'Forge MCP server running on stdio');
  console.error('Forge MCP server running on stdio');
}
