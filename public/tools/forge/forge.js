#!/usr/bin/env node
/**
 * forge.js
 *
 * Forge MCP server v2.4 — structured, typed access layer for all projects.
 * Replaces direct filesystem access with FAL-addressed typed artifacts.
 *
 * Architecture:
 *   - TypeRegistry   — discovers artifact types, dispatches all artifact ops
 *   - RootRegistry   — manages folder navigation per root
 *   Forge never calls handlers directly. All access goes through the registries.
 *
 * Error handling:
 *   Single top-level try/catch wraps the entire tool dispatcher.
 *   Tools and handlers must always throw — never return error objects.
 *   A tool may add its own try/catch only to enrich the error message before re-throwing.
 *
 * References:
 *   - conventions/forge.md v6.1
 *   - conventions/tools.md
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Logger
// ---------------------------------------------------------------------------

const logPath = path.join(__dirname, 'forge.log');

function log(level, message) {
  const line = `${new Date().toISOString()} [${level}] ${message}\n`;
  fs.appendFileSync(logPath, line);
  if (level === 'ERROR') console.error(line.trim());
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// TypeRegistry
// ---------------------------------------------------------------------------

/**
 * Manages all artifact operations.
 * Loaded at startup from the types JSON file.
 * Exposes a FAL-only API — types are hidden inside the registry.
 *
 * Dispatch mechanism:
 *   1. Extract type from FAL extension (after last '.')
 *   2. Look up handler in hashmap — O(1)
 *   3. Call handler.falToURL(falName, baseUrl) to recover the physical URL
 *   4. Delegate to handler
 *
 * Discovery (discover):
 *   1. Call claim(url, typeName) on handlers, most specific first (longer type names first)
 *   2. Stop at first claim
 *   3. Call handler.urlToFAL(url) to produce the FAL name
 *   4. Return the complete FAL
 *   If no handler claims: return a FAL with '.unknown' suffix (built-in type)
 */
class TypeRegistry {
  constructor() {
    /** @type {Map<string, object>} typeName -> handler module */
    this.handlers = new Map();
    /** @type {string[]} type names sorted by specificity (descending length) */
    this.discoveryOrder = [];
  }

  /**
   * Load handlers from the types JSON file.
   * @param {string} typesUrl - file:// URL of the types JSON
   */
  async load(typesUrl) {
    const typesPath = fileURLToPath(typesUrl);
    if (!fs.existsSync(typesPath)) throw new Error(`types file not found: ${typesPath}`);
    const registry = JSON.parse(fs.readFileSync(typesPath, 'utf8'));

    for (const [typeName, entry] of Object.entries(registry.types)) {
      try {
        const mod = await import(entry.handler);
        this.handlers.set(typeName, mod);
        log('INFO', `Type handler loaded: ${typeName} v${entry.version}`);
      } catch (err) {
        log('ERROR', `Failed to load handler for type '${typeName}': ${err.message}`);
      }
    }

    // Build discovery order: most specific first (more segments in name = more specific)
    this.discoveryOrder = [...this.handlers.keys()].sort((a, b) => {
      const segA = a.split('-').length;
      const segB = b.split('-').length;
      if (segB !== segA) return segB - segA; // more segments first
      return a.localeCompare(b); // stable tie-break
    });

    log('INFO', `Discovery order: ${this.discoveryOrder.join(', ')}`);
  }

  /**
   * Resolve a root's base URL from a FAL, given the configured roots.
   * @param {string} rootName
   * @returns {string} base URL with trailing slash
   */
  _baseUrl(rootName) {
    const root = config.roots.find(r => r.name === rootName);
    if (!root) throw new Error(`Unknown root: '${rootName}'`);
    return root.url.endsWith('/') ? root.url : root.url + '/';
  }

  /**
   * Parse a FAL into { rootName, folderPath, falName, typeName, blockPath }
   * FAL format: forge://<root>/[<folder>/]*<artifact-name>.<type>[#<block>]*
   * @param {string} fal
   */
  _parseFAL(fal) {
    if (!fal.startsWith('forge://')) throw new Error(`Invalid FAL: ${fal}`);
    const rest = fal.slice('forge://'.length);
    const slashIdx = rest.indexOf('/');
    if (slashIdx === -1) throw new Error(`FAL has no path: ${fal}`);
    const rootName = rest.slice(0, slashIdx);
    const afterRoot = rest.slice(slashIdx + 1);

    // Split off block path (# separator)
    const hashIdx = afterRoot.indexOf('#');
    const pathPart = hashIdx === -1 ? afterRoot : afterRoot.slice(0, hashIdx);
    const blockPath = hashIdx === -1 ? '' : afterRoot.slice(hashIdx + 1);

    // Split folder path and artifact name
    const lastSlash = pathPart.lastIndexOf('/');
    const folderPath = lastSlash === -1 ? '' : pathPart.slice(0, lastSlash + 1);
    const falName = lastSlash === -1 ? pathPart : pathPart.slice(lastSlash + 1);

    // Extract type from FAL name (after last '.')
    const dotIdx = falName.lastIndexOf('.');
    if (dotIdx === -1) throw new Error(`FAL name has no type extension: ${falName}`);
    const typeName = falName.slice(dotIdx + 1);

    return { rootName, folderPath, falName, typeName, blockPath };
  }

  /**
   * Get the handler for a type. Throws if unknown type.
   * @param {string} typeName
   */
  _handler(typeName) {
    if (typeName === 'unknown') {
      throw new Error('Operation not supported on unknown artifact type');
    }
    const handler = this.handlers.get(typeName);
    if (!handler) throw new Error(`No handler registered for type: ${typeName}`);
    return handler;
  }

  /**
   * Discover the type of a physical URL and return its FAL.
   * Called during forge_ls for each non-folder entry.
   * @param {string} url - file:// URL
   * @param {string} rootName
   * @param {string} folderPath - relative folder path within root (with trailing slash)
   * @returns {string} FAL
   */
  discover(url, rootName, folderPath) {
    for (const typeName of this.discoveryOrder) {
      const handler = this.handlers.get(typeName);
      if (handler.claim && handler.claim(url, typeName)) {
        const falName = handler.urlToFAL(url);
        return `forge://${rootName}/${folderPath}${falName}`;
      }
    }
    // No handler claimed — built-in unknown type
    const filename = path.basename(fileURLToPath(url));
    return `forge://${rootName}/${folderPath}${filename}.unknown`;
  }

  async read(fal, block = '') {
    const { rootName, folderPath, falName, typeName } = this._parseFAL(fal);
    const handler = this._handler(typeName);
    const baseUrl = this._baseUrl(rootName);
    const url = handler.falToURL(falName, baseUrl + folderPath);
    return handler.readBlock(url, block);
  }

  async write(fal, block, content) {
    const { rootName, folderPath, falName, typeName } = this._parseFAL(fal);
    const handler = this._handler(typeName);
    const baseUrl = this._baseUrl(rootName);
    const url = handler.falToURL(falName, baseUrl + folderPath);
    return handler.writeBlock(url, block, content);
  }

  async listBlocks(fal, block = '') {
    const { rootName, folderPath, falName, typeName } = this._parseFAL(fal);
    const handler = this._handler(typeName);
    const baseUrl = this._baseUrl(rootName);
    const url = handler.falToURL(falName, baseUrl + folderPath);
    return handler.listBlocks(url, block);
  }

  async insertBlock(fal, name, after, firstChild = false) {
    const { rootName, folderPath, falName, typeName } = this._parseFAL(fal);
    const handler = this._handler(typeName);
    const baseUrl = this._baseUrl(rootName);
    const url = handler.falToURL(falName, baseUrl + folderPath);
    return handler.insertBlock(url, name, after, firstChild);
  }

  async appendBlock(fal, block, content) {
    const { rootName, folderPath, falName, typeName } = this._parseFAL(fal);
    const handler = this._handler(typeName);
    const baseUrl = this._baseUrl(rootName);
    const url = handler.falToURL(falName, baseUrl + folderPath);
    return handler.appendBlock(url, block, content);
  }

  async deleteBlock(fal, block) {
    const { rootName, folderPath, falName, typeName } = this._parseFAL(fal);
    const handler = this._handler(typeName);
    const baseUrl = this._baseUrl(rootName);
    const url = handler.falToURL(falName, baseUrl + folderPath);
    return handler.deleteBlock(url, block);
  }

  async createArtifact(fal) {
    const { rootName, folderPath, falName, typeName } = this._parseFAL(fal);
    const handler = this._handler(typeName);
    const baseUrl = this._baseUrl(rootName);
    const url = handler.falToURL(falName, baseUrl + folderPath);
    return handler.createArtifact(url);
  }

  async deleteArtifact(fal) {
    const { rootName, folderPath, falName, typeName } = this._parseFAL(fal);
    if (typeName === 'unknown') throw new Error('Cannot delete unknown artifact');
    const handler = this._handler(typeName);
    const baseUrl = this._baseUrl(rootName);
    const url = handler.falToURL(falName, baseUrl + folderPath);
    return handler.deleteArtifact(url);
  }

  async moveArtifact(fal, targetFal) {
    const { rootName, folderPath, falName, typeName } = this._parseFAL(fal);
    const target = this._parseFAL(targetFal);
    if (rootName !== target.rootName) throw new Error('Cannot move artifact across roots');
    const handler = this._handler(typeName);
    const baseUrl = this._baseUrl(rootName);
    const url = handler.falToURL(falName, baseUrl + folderPath);
    const targetUrl = handler.falToURL(target.falName, baseUrl + target.folderPath);
    return handler.moveArtifact(url, targetUrl);
  }

  async renameArtifact(fal, name) {
    const { rootName, folderPath, falName, typeName } = this._parseFAL(fal);
    const handler = this._handler(typeName);
    const baseUrl = this._baseUrl(rootName);
    const url = handler.falToURL(falName, baseUrl + folderPath);
    return handler.renameArtifact(url, name);
  }
}

// ---------------------------------------------------------------------------
// RootRegistry
// ---------------------------------------------------------------------------

/**
 * Manages folder navigation.
 * One handler per root — no dispatch needed.
 * Translates between folder FALs and URLs before calling the root handler.
 */
class RootRegistry {
  constructor() {
    /** @type {Map<string, object>} rootName -> handler module */
    this.handlers = new Map();
  }

  async load(roots) {
    const cache = new Map();
    for (const root of roots) {
      if (!cache.has(root.handler)) {
        try {
          const mod = await import(root.handler);
          cache.set(root.handler, mod);
          log('INFO', `Root handler loaded: ${root.name} (${root.handler})`);
        } catch (err) {
          log('ERROR', `Failed to load root handler for '${root.name}': ${err.message}`);
        }
      }
      this.handlers.set(root.name, cache.get(root.handler));
    }
  }

  _baseUrl(rootName) {
    const root = config.roots.find(r => r.name === rootName);
    if (!root) throw new Error(`Unknown root: '${rootName}'`);
    return root.url.endsWith('/') ? root.url : root.url + '/';
  }

  _falToUrl(fal) {
    if (!fal.startsWith('forge://')) throw new Error(`Invalid FAL: ${fal}`);
    const rest = fal.slice('forge://'.length);
    const slashIdx = rest.indexOf('/');
    if (slashIdx === -1) throw new Error(`FAL has no path: ${fal}`);
    const rootName = rest.slice(0, slashIdx);
    const relPath = rest.slice(slashIdx + 1);
    const baseUrl = this._baseUrl(rootName);
    return { rootName, url: baseUrl + relPath };
  }

  _urlToFal(url, rootName) {
    const baseUrl = this._baseUrl(rootName);
    if (!url.startsWith(baseUrl)) throw new Error(`URL not under root '${rootName}': ${url}`);
    const relPath = url.slice(baseUrl.length);
    return `forge://${rootName}/${relPath}`;
  }

  async list(fal, typeRegistry) {
    const { rootName, url } = this._falToUrl(fal);
    const handler = this.handlers.get(rootName);
    if (!handler) throw new Error(`No root handler for: ${rootName}`);
    const entries = handler.list(url);
    const baseUrl = this._baseUrl(rootName);
    const folderRelPath = url.slice(baseUrl.length);
    return entries.map(entry => {
      if (entry.isFolder) {
        return { fal: this._urlToFal(entry.url, rootName), type: 'folder' };
      }
      const artifactFal = typeRegistry.discover(entry.url, rootName, folderRelPath);
      const typeName = artifactFal.split('.').pop();
      return { fal: artifactFal, type: typeName };
    });
  }

  async mkdir(fal) {
    const { rootName, url } = this._falToUrl(fal);
    const handler = this.handlers.get(rootName);
    if (!handler) throw new Error(`No root handler for: ${rootName}`);
    return handler.mkdir(url);
  }

  async rmdir(fal) {
    const { rootName, url } = this._falToUrl(fal);
    const handler = this.handlers.get(rootName);
    if (!handler) throw new Error(`No root handler for: ${rootName}`);
    return handler.rmdir(url);
  }

  async mvdir(fal, targetFal) {
    const { rootName, url } = this._falToUrl(fal);
    const { rootName: targetRoot, url: targetUrl } = this._falToUrl(targetFal);
    if (rootName !== targetRoot) throw new Error('Cannot move folder across roots');
    const handler = this.handlers.get(rootName);
    if (!handler) throw new Error(`No root handler for: ${rootName}`);
    return handler.move(url, targetUrl);
  }

  async rndir(fal, name) {
    const { rootName, url } = this._falToUrl(fal);
    const handler = this.handlers.get(rootName);
    if (!handler) throw new Error(`No root handler for: ${rootName}`);
    return handler.rename(url, name);
  }
}

// ---------------------------------------------------------------------------
// Boot — load registries
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------

const server = new Server(
  { name: 'forge', version: '2.4.0' },
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
      description: 'List roots or folder contents. No argument: returns configured roots. Folder FAL (ending with /): returns entries with their FAL and type.',
      inputSchema: {
        type: 'object',
        properties: {
          fal: { type: 'string', description: 'Folder FAL. Omit to list all roots.' }
        },
        required: []
      }
    },
    {
      name: 'forge_read',
      description: 'Read an artifact by FAL. Returns the full content of the artifact (block = root block). FAL format: forge://<root-name>/<path/to/file>.<type>. The type suffix in the FAL is required for dispatch (e.g. forge://kb/TODO.md).',
      inputSchema: {
        type: 'object',
        properties: {
          fal: { type: 'string', description: 'Artifact FAL (forge://<root>/<path/to/file>.<type>).' }
        },
        required: ['fal']
      }
    },
    {
      name: 'forge_create',
      description: 'Create a new empty artifact. Error if the artifact already exists. Use forge_write after creation to set the initial content.',
      inputSchema: {
        type: 'object',
        properties: {
          fal: { type: 'string', description: 'Artifact FAL (forge://<root>/<path/to/file>.<type>).' }
        },
        required: ['fal']
      }
    },
    {
      name: 'forge_write',
      description: 'Write content to an existing artifact by FAL. For plain-text types (md, js, json, html, css, txt), writes the full file content. For structured types, writes to the specified block. Error if the artifact does not exist — use forge_create first. FAL format: forge://<root-name>/<path/to/file>.<type>.',
      inputSchema: {
        type: 'object',
        properties: {
          fal:     { type: 'string', description: 'Artifact FAL (forge://<root>/<path/to/file>.<type>).' },
          block:   { type: 'string', description: 'Block path within the artifact. Empty string or omit for root block (full file for plain-text types).' },
          content: { type: 'string', description: 'Content to write.' }
        },
        required: ['fal', 'content']
      }
    },
    {
      name: 'forge_mkdir',
      description: 'Create a folder. Error if it already exists.',
      inputSchema: {
        type: 'object',
        properties: {
          fal: { type: 'string', description: 'Folder FAL to create (must end with /).' }
        },
        required: ['fal']
      }
    },
    {
      name: 'forge_rmdir',
      description: 'Delete a folder. Error if not empty.',
      inputSchema: {
        type: 'object',
        properties: {
          fal: { type: 'string', description: 'Folder FAL to delete (must end with /).' }
        },
        required: ['fal']
      }
    },
    {
      name: 'forge_mvdir',
      description: 'Move a folder within the same root. Error if the target already exists.',
      inputSchema: {
        type: 'object',
        properties: {
          fal:    { type: 'string', description: 'Source folder FAL (must end with /).' },
          target: { type: 'string', description: 'Destination folder FAL (must end with /).' }
        },
        required: ['fal', 'target']
      }
    },
    {
      name: 'forge_rndir',
      description: 'Rename a folder in place. Error if the target name already exists in the same parent.',
      inputSchema: {
        type: 'object',
        properties: {
          fal:  { type: 'string', description: 'Folder FAL to rename (must end with /).' },
          name: { type: 'string', description: 'New folder name (no slashes).' }
        },
        required: ['fal', 'name']
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // --- forge_ping ---
    if (name === 'forge_ping') {
      log('INFO', 'forge_ping');
      return { content: [{ type: 'text', text: 'pong — forge v2.4.0' }] };
    }

    // --- forge_ls ---
    if (name === 'forge_ls') {
      const fal = args?.fal;
      log('INFO', `forge_ls — fal: ${fal || '(none)'}`);

      if (!fal) {
        const roots = config.roots.map(r => ({ name: r.name, url: r.url }));
        return { content: [{ type: 'text', text: JSON.stringify({ roots }, null, 2) }] };
      }

      if (!fal.endsWith('/')) {
        throw new Error(`forge_ls requires a folder FAL (ending with /). Got: ${fal}`);
      }

      const entries = await rootRegistry.list(fal, typeRegistry);
      return { content: [{ type: 'text', text: JSON.stringify({ fal, count: entries.length, entries }, null, 2) }] };
    }

    // --- forge_read ---
    if (name === 'forge_read') {
      const { fal } = args;
      log('INFO', `forge_read — fal: ${fal}`);

      if (!fal || fal.endsWith('/')) {
        throw new Error(`forge_read requires an artifact FAL. Got: ${fal}`);
      }

      const content = await typeRegistry.read(fal);
      log('INFO', `forge_read — ${content.length} chars`);
      return { content: [{ type: 'text', text: content }] };
    }

    // --- forge_create ---
    if (name === 'forge_create') {
      const { fal } = args;
      log('INFO', `forge_create — fal: ${fal}`);

      if (!fal || fal.endsWith('/')) {
        throw new Error(`forge_create requires an artifact FAL. Got: ${fal}`);
      }

      await typeRegistry.createArtifact(fal);
      log('INFO', `forge_create — done`);
      return { content: [{ type: 'text', text: JSON.stringify({ ok: true, fal }) }] };
    }

    // --- forge_write ---
    if (name === 'forge_write') {
      const { fal, block = '', content } = args;
      log('INFO', `forge_write — fal: ${fal}, block: "${block}", ${content?.length ?? 0} chars`);

      if (!fal || fal.endsWith('/')) {
        throw new Error(`forge_write requires an artifact FAL. Got: ${fal}`);
      }

      if (content === undefined || content === null) {
        throw new Error('forge_write requires content.');
      }

      await typeRegistry.write(fal, block, content);
      log('INFO', `forge_write — done`);
      return { content: [{ type: 'text', text: JSON.stringify({ ok: true, fal, block, written: content.length }) }] };
    }

    // --- forge_mkdir ---
    if (name === 'forge_mkdir') {
      const { fal } = args;
      log('INFO', `forge_mkdir — fal: ${fal}`);

      if (!fal || !fal.endsWith('/')) {
        throw new Error(`forge_mkdir requires a folder FAL (ending with /). Got: ${fal}`);
      }

      await rootRegistry.mkdir(fal);
      log('INFO', `forge_mkdir — done`);
      return { content: [{ type: 'text', text: JSON.stringify({ ok: true, fal }) }] };
    }

    // --- forge_rmdir ---
    if (name === 'forge_rmdir') {
      const { fal } = args;
      log('INFO', `forge_rmdir — fal: ${fal}`);

      if (!fal || !fal.endsWith('/')) {
        throw new Error(`forge_rmdir requires a folder FAL (ending with /). Got: ${fal}`);
      }

      await rootRegistry.rmdir(fal);
      log('INFO', `forge_rmdir — done`);
      return { content: [{ type: 'text', text: JSON.stringify({ ok: true, fal }) }] };
    }

    // --- forge_mvdir ---
    if (name === 'forge_mvdir') {
      const { fal, target } = args;
      log('INFO', `forge_mvdir — fal: ${fal}, target: ${target}`);

      if (!fal || !fal.endsWith('/')) {
        throw new Error(`forge_mvdir requires a source folder FAL (ending with /). Got: ${fal}`);
      }
      if (!target || !target.endsWith('/')) {
        throw new Error(`forge_mvdir requires a target folder FAL (ending with /). Got: ${target}`);
      }

      await rootRegistry.mvdir(fal, target);
      log('INFO', `forge_mvdir — done`);
      return { content: [{ type: 'text', text: JSON.stringify({ ok: true, fal, target }) }] };
    }

    // --- forge_rndir ---
    if (name === 'forge_rndir') {
      const { fal, name: newName } = args;
      log('INFO', `forge_rndir — fal: ${fal}, name: ${newName}`);

      if (!fal || !fal.endsWith('/')) {
        throw new Error(`forge_rndir requires a folder FAL (ending with /). Got: ${fal}`);
      }
      if (!newName) {
        throw new Error('forge_rndir requires a name.');
      }

      await rootRegistry.rndir(fal, newName);
      log('INFO', `forge_rndir — done`);
      return { content: [{ type: 'text', text: JSON.stringify({ ok: true, fal, name: newName }) }] };
    }

    throw new Error(`Unknown tool: ${name}`);

  } catch (err) {
    log('ERROR', `${name} error: ${err.message}`);
    return { content: [{ type: 'text', text: JSON.stringify({ error: err.message }) }], isError: true };
  }
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main() {
  log('INFO', 'Forge MCP server starting — v2.4.0');
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log('INFO', 'Forge MCP server running on stdio');
  console.error('Forge MCP server running on stdio');
}

main().catch(err => {
  log('ERROR', `Fatal: ${err.message}\n${err.stack}`);
  process.exit(1);
});
