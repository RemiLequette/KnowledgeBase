/**
 * forge.js — MCP server entry point
 *
 * Loads the three config files, wires the registries, and starts the MCP server.
 *
 * Config files:
 *   - forge.config.json     — root registry (where artifacts live)
 *   - forge-formats.json    — format registry (how artifacts are structured)
 *   - forge-tools.json      — MCP tool registry (which tools are exposed)
 *
 * References:
 *   - ROADMAP.md [Milestone 2]
 *   - conventions/forge.md [How — Architecture]
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { startMcpServer } from './src/mcp-server.js';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const toolsConfig = path.join(__dirname, 'forge-tools.json');

await startMcpServer(toolsConfig).catch(err => {
  process.stderr.write(`[forge] Fatal error: ${err.stack ?? err.message}\n`);
  process.exit(1);
});
