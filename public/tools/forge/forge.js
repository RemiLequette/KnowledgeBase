#!/usr/bin/env node
/**
 * forge.js
 *
 * Forge MCP server — structured, typed access layer for all projects.
 * Replaces direct filesystem access with FAL-addressed typed artifacts.
 *
 * References:
 *   - conventions/forge.md
 *   - conventions/tools.md
 *
 * Not yet in references:
 *   - Option A: no block addressing (#), no hierarchy in type discovery
 *   - Type discovery: first claiming handler wins (no hierarchy order)
 *   - forge_ls without FAL argument lists roots (not a FAL operation)
 *
 * FAL format (Option A):
 *   forge://<root-name>/[<folder>/]*[<artifact-name>]
 *
 * Tools exposed:
 *   forge_ping   — connectivity check
 *   forge_ls     — list roots (no arg) or folder contents (folder FAL)
 *   forge_read   — read an artifact by FAL
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Logger ---

const logPath = path.join(__dirname, 'forge.log');

function log(level, message) {
  const line = `${new Date().toISOString()} [${level}] ${message}\n`;
  fs.appendFileSync(logPath, line);
  if (level === 'ERROR') console.error(line.trim());
}

// --- Config ---

function loadConfig() {
  const configPath = path.join(__dirname, 'forge.config.json');
  if (!fs.existsSync(configPath)) throw new Error(`forge.config.json not found at ${configPath}`);
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

let config;
try {
  config = loadConfig();
  log('INFO', `Config loaded — ${config.roots.length} root(s)`);
} catch (err) {
  log('ERROR', `Failed to load config: ${err.message}`);
  process.exit(1);
}

// --- Type registry ---

/**
 * Load the type registry JSON and dynamically import all handlers.
 * Returns a Map: typeName → handler module
 */
async function loadTypeHandlers(typesUrl) {
  const typesPath = fileURLToPath(typesUrl);
  if (!fs.existsSync(typesPath)) throw new Error(`forge-types.json not found at ${typesPath}`);
  const registry = JSON.parse(fs.readFileSync(typesPath, 'utf8'));

  const handlers = new Map();
  for (const [typeName, entry] of Object.entries(registry.types)) {
    try {
      const mod = await import(entry.handler);
      handlers.set(typeName, mod);
      log('INFO', `Type handler loaded: ${typeName} v${entry.version}`);
    } catch (err) {
      log('ERROR', `Failed to load handler for type '${typeName}': ${err.message}`);
    }
  }
  return handlers;
}

// --- Root handler cache ---

const rootHandlerCache = new Map();

async function getRootHandler(handlerUrl) {
  if (rootHandlerCache.has(handlerUrl)) return rootHandlerCache.get(handlerUrl);
  const mod = await import(handlerUrl);
  rootHandlerCache.set(handlerUrl, mod);
  return mod;
}

// --- FAL parsing ---

/**
 * Parse a FAL string into { rootName, resourcePath, isFolder }
 * FAL format: forge://<root>/<path>
 * Folder FAL ends with /
 *
 * @param {string} fal
 * @returns {{ rootName: string, resourcePath: string, isFolder: boolean }}
 */
function parseFAL(fal) {
  if (!fal.startsWith('forge://')) throw new Error(`Invalid FAL — must start with forge://: ${fal}`);
  const rest = fal.slice('forge://'.length);
  const slashIdx = rest.indexOf('/');
  if (slashIdx === -1) {
    // forge://rootname — root itself
    return { rootName: rest, resourcePath: '', isFolder: true };
  }
  const rootName = rest.slice(0, slashIdx);
  const resourcePath = rest.slice(slashIdx + 1); // may be empty (root folder) or end with /
  const isFolder = resourcePath === '' || resourcePath.endsWith('/');
  return { rootName, resourcePath, isFolder };
}

/**
 * Resolve a FAL to a file:// URL using the root configuration.
 * @param {string} fal
 * @param {Array} roots
 * @returns {{ rootEntry, fileUrl: string, isFolder: boolean }}
 */
function resolveFAL(fal, roots) {
  const { rootName, resourcePath, isFolder } = parseFAL(fal);
  const rootEntry = roots.find(r => r.name === rootName);
  if (!rootEntry) throw new Error(`Unknown root: '${rootName}'. Known roots: ${roots.map(r => r.name).join(', ')}`);

  const baseUrl = rootEntry.url.endsWith('/') ? rootEntry.url : rootEntry.url + '/';
  const fileUrl = baseUrl + resourcePath;
  return { rootEntry, fileUrl, isFolder };
}

// --- Type discovery ---

/**
 * Find the first handler that claims the given URL.
 * Option A: no hierarchy — first claiming handler wins.
 * @param {string} fileUrl
 * @param {Map} typeHandlers
 * @returns {object|null} handler module or null
 */
function discoverType(fileUrl, typeHandlers) {
  // Try named types first (txt, md, ...), then fall back to unknown
  for (const [typeName, handler] of typeHandlers) {
    if (typeName === 'unknown') continue;
    if (handler.claim && handler.claim(fileUrl)) {
      return handler;
    }
  }
  // Fallback: unknown handler
  const unknown = typeHandlers.get('unknown');
  return unknown || null;
}

// --- Boot ---

let typeHandlers;
try {
  typeHandlers = await loadTypeHandlers(config.types);
  log('INFO', `Type handlers loaded: ${[...typeHandlers.keys()].join(', ')}`);
} catch (err) {
  log('ERROR', `Failed to load type handlers: ${err.message}`);
  process.exit(1);
}

// --- MCP Server ---

const server = new Server(
  { name: 'forge', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'forge_ping',
      description: 'Connectivity check — returns pong and server version.',
      inputSchema: { type: 'object', properties: {}, required: [] }
    },
    {
      name: 'forge_ls',
      description: [
        'List roots or folder contents.',
        'No argument: returns the list of configured roots with their names and base URLs.',
        'Folder FAL (forge://<root>/ or forge://<root>/<folder>/): returns the entries in that folder with their type.',
        'FAL format: forge://<root-name>/<path>. Folder FALs end with /.'
      ].join(' '),
      inputSchema: {
        type: 'object',
        properties: {
          fal: {
            type: 'string',
            description: 'Folder FAL (forge://<root>/<folder>/). Omit to list all roots.'
          }
        },
        required: []
      }
    },
    {
      name: 'forge_read',
      description: [
        'Read an artifact by FAL.',
        'Returns the full content of the artifact.',
        'FAL format: forge://<root-name>/<path-to-file>.',
        'The type is discovered automatically — no registration needed.'
      ].join(' '),
      inputSchema: {
        type: 'object',
        properties: {
          fal: {
            type: 'string',
            description: 'Artifact FAL (forge://<root>/<path/to/file>).'
          }
        },
        required: ['fal']
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // --- forge_ping ---
  if (name === 'forge_ping') {
    log('INFO', 'forge_ping');
    return { content: [{ type: 'text', text: 'pong — forge v1.0.0' }] };
  }

  // --- forge_ls ---
  if (name === 'forge_ls') {
    const fal = args?.fal;
    log('INFO', `forge_ls — fal: ${fal || '(none)'}`);

    if (!fal) {
      // List roots
      const roots = config.roots.map(r => ({ name: r.name, url: r.url }));
      return { content: [{ type: 'text', text: JSON.stringify({ roots }, null, 2) }] };
    }

    try {
      const { rootEntry, fileUrl, isFolder } = resolveFAL(fal, config.roots);
      if (!isFolder) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: `forge_ls requires a folder FAL (ending with /). Got: ${fal}` }) }],
          isError: true
        };
      }

      const rootHandler = await getRootHandler(rootEntry.handler);
      const entries = rootHandler.list(fileUrl);

      // Annotate each entry with its discovered type
      const annotated = entries.map(entry => {
        if (entry.isFolder) {
          return { fal: fileUrlToFAL(entry.url, config.roots), type: 'folder' };
        }
        const handler = discoverType(entry.url, typeHandlers);
        const typeName = handler?.type || 'unknown';
        return { fal: fileUrlToFAL(entry.url, config.roots), type: typeName };
      });

      return { content: [{ type: 'text', text: JSON.stringify({ fal, count: annotated.length, entries: annotated }, null, 2) }] };

    } catch (err) {
      log('ERROR', `forge_ls error: ${err.message}`);
      return { content: [{ type: 'text', text: JSON.stringify({ error: err.message }) }], isError: true };
    }
  }

  // --- forge_read ---
  if (name === 'forge_read') {
    const { fal } = args;
    log('INFO', `forge_read — fal: ${fal}`);

    try {
      const { fileUrl, isFolder } = resolveFAL(fal, config.roots);

      if (isFolder) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: `forge_read requires an artifact FAL, not a folder FAL. Got: ${fal}` }) }],
          isError: true
        };
      }

      const handler = discoverType(fileUrl, typeHandlers);
      if (!handler) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: `No handler found for: ${fal}` }) }],
          isError: true
        };
      }

      const result = handler.read(fileUrl);
      if (!result.ok) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: result.error }) }],
          isError: true
        };
      }

      log('INFO', `forge_read — type: ${handler.type}, ${result.content.length} chars`);
      return { content: [{ type: 'text', text: result.content }] };

    } catch (err) {
      log('ERROR', `forge_read error: ${err.message}`);
      return { content: [{ type: 'text', text: JSON.stringify({ error: err.message }) }], isError: true };
    }
  }

  return {
    content: [{ type: 'text', text: JSON.stringify({ error: `Unknown tool: ${name}` }) }],
    isError: true
  };
});

// --- Helpers ---

/**
 * Convert a file:// URL back to a FAL, given the configured roots.
 * @param {string} fileUrl
 * @param {Array} roots
 * @returns {string} FAL
 */
function fileUrlToFAL(fileUrl, roots) {
  for (const root of roots) {
    const baseUrl = root.url.endsWith('/') ? root.url : root.url + '/';
    if (fileUrl.startsWith(baseUrl)) {
      const relPath = fileUrl.slice(baseUrl.length);
      return `forge://${root.name}/${relPath}`;
    }
  }
  return fileUrl; // fallback: return raw URL if no root matches
}

// --- Start ---

async function main() {
  log('INFO', 'Forge MCP server starting — v1.0.0');
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log('INFO', 'Forge MCP server running on stdio');
  console.error('Forge MCP server running on stdio');
}

main().catch(err => {
  log('ERROR', `Fatal: ${err.message}\n${err.stack}`);
  process.exit(1);
});
