/**
 * forge.js — MCP server entry point (stub)
 *
 * Minimal stub to keep the MCP server alive while Forge v2 is being built.
 * Declares no tools. Replace with full implementation once ready.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new McpServer({
  name: 'forge',
  version: '0.0.1-stub',
});

const transport = new StdioServerTransport();
await server.connect(transport);
