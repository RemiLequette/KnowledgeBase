/**
 * mcp-server.js
 *
 * Generic, configurable MCP server.
 *
 * Reads forge-tools.json at startup, loads tool handlers dynamically via
 * ESM import(), registers tools, and dispatches calls to handler modules.
 * No hardcoded tool names — adding a tool requires only a config entry + restart.
 *
 * Two responsibilities kept separate:
 *   - McpServer (this module) — tool registry + dispatch logic (testable in isolation)
 *   - startMcpServer() — wires McpServer to the MCP SDK transport (not tested at unit level)
 *
 * References:
 *   - conventions/forge.md [MCP Specs]
 *   - ROADMAP.md [Milestone 2]
 */

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

// ---------------------------------------------------------------------------
// McpServer
// ---------------------------------------------------------------------------

export class McpServer {
  constructor() {
    /**
     * toolName → { toolJson, handler }
     * @type {Map<string, { toolJson: object, handler: object }>}
     */
    this.tools = new Map();
  }

  // -------------------------------------------------------------------------
  // loadTools() — build time
  // -------------------------------------------------------------------------

  async loadTools(configPath, context = {}) {
    if (!fs.existsSync(configPath)) {
      throw new Error(`forge-tools.json not found: ${configPath}`);
    }

    const raw    = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(raw);
    const dir    = path.dirname(configPath);

    for (const toolJson of config.tools ?? []) {
      const { name, handler: handlerPath } = toolJson;

      if (!name)        throw new Error(`Tool entry is missing required field "name"`);
      if (!handlerPath) throw new Error(`Tool "${name}" is missing required field "handler"`);

      const handlerUrl = pathToFileURL(path.resolve(dir, handlerPath)).href;

      let mod;
      try {
        mod = await import(handlerUrl);
      } catch (err) {
        throw new Error(`Failed to load handler for tool "${name}": ${err.message}`);
      }

      if (typeof mod.initTool !== 'function') {
        throw new Error(`Handler for tool "${name}" does not export initTool()`);
      }

      const handler = await mod.initTool(toolJson, context);
      this.tools.set(name, { toolJson, handler });
    }
  }

  // -------------------------------------------------------------------------
  // toolNames() — test helper + MCP registration
  // -------------------------------------------------------------------------

  toolNames() {
    return [...this.tools.keys()];
  }

  // -------------------------------------------------------------------------
  // dispatch() — run time
  // -------------------------------------------------------------------------

  async dispatch(toolName, input) {
    const entry = this.tools.get(toolName);
    if (!entry) throw new Error(`Unknown tool: "${toolName}"`);
    return entry.handler.execute(input);
  }
}

// ---------------------------------------------------------------------------
// startMcpServer() — MCP SDK wiring (not called during unit tests)
// ---------------------------------------------------------------------------

export async function startMcpServer(toolsConfigPath) {
  const { McpServer: SdkMcpServer } = await import('@modelcontextprotocol/sdk/server/mcp.js');
  const { StdioServerTransport }    = await import('@modelcontextprotocol/sdk/server/stdio.js');
  const { z }                       = await import('zod');

  // Load root registry from forge.config.json
  const configDir    = path.dirname(toolsConfigPath);
  const forgeConfig  = JSON.parse(fs.readFileSync(path.join(configDir, 'forge.config.json'), 'utf8'));
  const { RootRegistry }    = await import('./root-registry.js');
  const { FormatRegistry }  = await import('./format-registry.js');
  const rootRegistry   = new RootRegistry();
  const formatRegistry = new FormatRegistry();
  await rootRegistry.load(forgeConfig.roots);
  const formatsPath = path.join(configDir, 'forge-formats.json');
  if (fs.existsSync(formatsPath)) await formatRegistry.load(formatsPath);

  const context = { rootRegistry, formatRegistry };

  const forge  = new McpServer();
  await forge.loadTools(toolsConfigPath, context);

  const sdkServer = new SdkMcpServer({ name: 'forge', version: '2.0.0' });

  for (const [name, { toolJson }] of forge.tools) {
    // Register each tool with the SDK using its declared inputSchema.
    // Input validation is delegated to the SDK via zod passthrough —
    // handler-level validation is the handler's responsibility.
    sdkServer.tool(name, toolJson.description ?? '', z.object({}).passthrough(), async (input) => {
      const result = await forge.dispatch(name, input);
      return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    });
  }

  const transport = new StdioServerTransport();
  await sdkServer.connect(transport);
}
