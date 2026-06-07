/**
 * mcp-tools.js
 *
 * MCP tool definitions (ListTools) and dispatcher (CallTool) for the Forge server.
 * Receives pre-built typeRegistry, rootRegistry, and config from forge.js.
 * Returns MCP response objects — never throws, wraps all errors in isError responses.
 *
 * References:
 *   - conventions/forge.md v7.0 [section MCP tools]
 *   - conventions/tools.md [section Module Design Rules]
 *
 * Not yet in references: none
 */

import { log } from './logger.js';
import { parseFAL, toFAL } from './fal.js';
import { brand, checkBrand, checkRTFM } from './brand.js';

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

export const TOOL_DEFINITIONS = [
  {
    name: 'forge_ping',
    description: 'Connectivity check — returns pong and server version.',
    inputSchema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'forge_ls',
    description: 'List roots or folder contents. No argument: returns configured roots. Folder FAL (ending with /): returns entries with their FAL and type. Always free — no Brand or RTFM required. Issues branded FALs.',
    inputSchema: {
      type: 'object',
      properties: { fal: { type: 'string', description: 'Folder FAL. Omit to list all roots.' } },
      required: []
    }
  },
  {
    name: 'forge_describe',
    description: 'Describe the type of an artifact — returns { recognition, capabilities, usage }. Sets described=true for the type in the session. Required before forge_read or forge_write.',
    inputSchema: {
      type: 'object',
      properties: { fal: { type: 'string', description: 'Artifact FAL.' } },
      required: ['fal']
    }
  },
  {
    name: 'forge_read',
    description: 'Read an artifact by FAL. Returns the full content of the artifact (block = root block). Requires Brand + RTFM (call forge_ls then forge_describe first).',
    inputSchema: {
      type: 'object',
      properties: { fal: { type: 'string', description: 'Artifact FAL.' } },
      required: ['fal']
    }
  },
  {
    name: 'forge_create',
    description: 'Create a new empty artifact. Error if the artifact already exists. Required before any forge_write on a new file.',
    inputSchema: {
      type: 'object',
      properties: { fal: { type: 'string', description: 'Artifact FAL.' } },
      required: ['fal']
    }
  },
  {
    name: 'forge_write',
    description: 'Write content to an existing artifact. Error if the artifact does not exist — use forge_create first. Requires Brand + RTFM.',
    inputSchema: {
      type: 'object',
      properties: {
        fal:     { type: 'string', description: 'Artifact FAL.' },
        block:   { type: 'string', description: 'Block path. Empty or omit for full file.' },
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
      properties: { fal: { type: 'string', description: 'Folder FAL (must end with /).' } },
      required: ['fal']
    }
  },
  {
    name: 'forge_rmdir',
    description: 'Delete a folder. Error if not empty.',
    inputSchema: {
      type: 'object',
      properties: { fal: { type: 'string', description: 'Folder FAL (must end with /).' } },
      required: ['fal']
    }
  },
  {
    name: 'forge_mvdir',
    description: 'Move a folder within the same root.',
    inputSchema: {
      type: 'object',
      properties: {
        fal:    { type: 'string', description: 'Source folder FAL.' },
        target: { type: 'string', description: 'Destination folder FAL.' }
      },
      required: ['fal', 'target']
    }
  },
  {
    name: 'forge_rndir',
    description: 'Rename a folder in place.',
    inputSchema: {
      type: 'object',
      properties: {
        fal:  { type: 'string', description: 'Folder FAL to rename.' },
        name: { type: 'string', description: 'New folder name.' }
      },
      required: ['fal', 'name']
    }
  }
];

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

/**
 * Dispatch a CallTool request.
 * @param {string} name - tool name
 * @param {object} args - tool arguments
 * @param {object} ctx  - { typeRegistry, rootRegistry, config }
 * @returns {Promise<{ content: [{type:'text', text:string}], isError?: boolean }>}
 */
export async function dispatch(name, args, ctx) {
  const { typeRegistry, rootRegistry, config } = ctx;

  try {
    if (name === 'forge_ping') {
      log('INFO', 'forge_ping');
      return { content: [{ type: 'text', text: 'pong — forge v3.0.0' }] };
    }

    if (name === 'forge_ls') {
      const fal = args?.fal;
      log('INFO', `forge_ls — fal: ${fal || '(none)'}`);
      if (!fal) {
        const roots = config.roots.map(r => ({ name: r.name, url: r.url }));
        return { content: [{ type: 'text', text: JSON.stringify({ roots }, null, 2) }] };
      }
      if (!fal.endsWith('/')) throw new Error(`forge_ls requires a folder FAL (ending with /). Got: ${fal}`);
      const raw = await rootRegistry.list(fal, typeRegistry);
      const entries = raw.map(e => {
        const entryFal = e.artifactRef ? toFAL(e.artifactRef) : e.fal;
        brand(entryFal);
        return { fal: entryFal, type: e.type };
      });
      return { content: [{ type: 'text', text: JSON.stringify({ fal, count: entries.length, entries }, null, 2) }] };
    }

    if (name === 'forge_describe') {
      const { fal } = args;
      log('INFO', `forge_describe — fal: ${fal}`);
      const ref    = parseFAL(fal);
      const result = typeRegistry.describe(ref);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }

    if (name === 'forge_read') {
      const { fal } = args;
      log('INFO', `forge_read — fal: ${fal}`);
      if (!fal || fal.endsWith('/')) throw new Error(`forge_read requires an artifact FAL. Got: ${fal}`);
      const ref = parseFAL(fal);
      checkBrand(toFAL(ref));
      checkRTFM(ref.type, typeRegistry);
      const { handler } = typeRegistry._entry(ref.type);
      const urlRef  = typeRegistry.artifactRefToUrlRef(ref);
      const content = await handler.readBlock(urlRef, ref.block || '', rootRegistry);
      log('INFO', `forge_read — ${content.length} chars`);
      return { content: [{ type: 'text', text: content }] };
    }

    if (name === 'forge_create') {
      const { fal } = args;
      log('INFO', `forge_create — fal: ${fal}`);
      if (!fal || fal.endsWith('/')) throw new Error(`forge_create requires an artifact FAL. Got: ${fal}`);
      const ref = parseFAL(fal);
      const { handler } = typeRegistry._entry(ref.type);
      const urlRef = typeRegistry.artifactRefToUrlRef(ref);
      await handler.createArtifact(urlRef, rootRegistry);
      log('INFO', `forge_create — done`);
      return { content: [{ type: 'text', text: JSON.stringify({ ok: true, fal }) }] };
    }

    if (name === 'forge_write') {
      const { fal, block = '', content } = args;
      log('INFO', `forge_write — fal: ${fal}, block: "${block}", ${content?.length ?? 0} chars`);
      if (!fal || fal.endsWith('/')) throw new Error(`forge_write requires an artifact FAL. Got: ${fal}`);
      if (content === undefined || content === null) throw new Error('forge_write requires content.');
      const ref = parseFAL(fal);
      checkBrand(toFAL(ref));
      checkRTFM(ref.type, typeRegistry);
      const { handler } = typeRegistry._entry(ref.type);
      const urlRef = typeRegistry.artifactRefToUrlRef(ref);
      await handler.writeBlock(urlRef, block, content, rootRegistry);
      log('INFO', `forge_write — done`);
      return { content: [{ type: 'text', text: JSON.stringify({ ok: true, fal, block, written: content.length }) }] };
    }

    if (name === 'forge_mkdir') {
      const { fal } = args;
      log('INFO', `forge_mkdir — fal: ${fal}`);
      if (!fal || !fal.endsWith('/')) throw new Error(`forge_mkdir requires a folder FAL (ending with /). Got: ${fal}`);
      await rootRegistry.mkdir(fal);
      brand(fal);
      log('INFO', `forge_mkdir — done`);
      return { content: [{ type: 'text', text: JSON.stringify({ ok: true, fal }) }] };
    }

    if (name === 'forge_rmdir') {
      const { fal } = args;
      log('INFO', `forge_rmdir — fal: ${fal}`);
      if (!fal || !fal.endsWith('/')) throw new Error(`forge_rmdir requires a folder FAL (ending with /). Got: ${fal}`);
      await rootRegistry.rmdir(fal);
      log('INFO', `forge_rmdir — done`);
      return { content: [{ type: 'text', text: JSON.stringify({ ok: true, fal }) }] };
    }

    if (name === 'forge_mvdir') {
      const { fal, target } = args;
      log('INFO', `forge_mvdir — fal: ${fal}, target: ${target}`);
      if (!fal || !fal.endsWith('/')) throw new Error(`forge_mvdir source must end with /. Got: ${fal}`);
      if (!target || !target.endsWith('/')) throw new Error(`forge_mvdir target must end with /. Got: ${target}`);
      await rootRegistry.mvdir(fal, target);
      log('INFO', `forge_mvdir — done`);
      return { content: [{ type: 'text', text: JSON.stringify({ ok: true, fal, target }) }] };
    }

    if (name === 'forge_rndir') {
      const { fal, name: newName } = args;
      log('INFO', `forge_rndir — fal: ${fal}, name: ${newName}`);
      if (!fal || !fal.endsWith('/')) throw new Error(`forge_rndir requires a folder FAL. Got: ${fal}`);
      if (!newName) throw new Error('forge_rndir requires a name.');
      await rootRegistry.rndir(fal, newName);
      log('INFO', `forge_rndir — done`);
      return { content: [{ type: 'text', text: JSON.stringify({ ok: true, fal, name: newName }) }] };
    }

    throw new Error(`Unknown tool: ${name}`);

  } catch (err) {
    log('ERROR', `${name} error: ${err.message}`);
    return { content: [{ type: 'text', text: JSON.stringify({ error: err.message }) }], isError: true };
  }
}
