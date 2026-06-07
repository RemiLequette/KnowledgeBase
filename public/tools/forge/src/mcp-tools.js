// @forge-type: js-managed

// ====[ imports ]====

import { log } from './logger.js';
import { parseFAL, toFAL } from './fal.js';
import { brand } from './brand.js';

// ====[ tool-definitions ]====

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
    description: 'Read an artifact or block by FAL. Response includes the FAL and block for context. Requires Brand + RTFM (call forge_ls then forge_describe first).',
    inputSchema: {
      type: 'object',
      properties: { fal: { type: 'string', description: 'Artifact FAL, optionally with #block.' } },
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

// ====[ dispatch ]====

/**
 * Dispatch a CallTool request.
 * FAL strings are parsed into refs at this boundary — no FAL strings below.
 * Gates (Brand + RTFM) are enforced by TypeRegistry.read/write.
 */
export async function dispatch(name, args, ctx) {
  const { typeRegistry, rootRegistry, config } = ctx;
  try {
    if (name === 'forge_ping')     return _ping();
    if (name === 'forge_ls')       return await _ls(args, config, rootRegistry, typeRegistry);
    if (name === 'forge_describe') return _describe(args, typeRegistry);
    if (name === 'forge_read')     return await _read(args, typeRegistry, rootRegistry);
    if (name === 'forge_create')   return await _create(args, typeRegistry, rootRegistry);
    if (name === 'forge_write')    return await _write(args, typeRegistry, rootRegistry);
    if (name === 'forge_mkdir')    return await _mkdir(args, rootRegistry);
    if (name === 'forge_rmdir')    return await _rmdir(args, rootRegistry);
    if (name === 'forge_mvdir')    return await _mvdir(args, rootRegistry);
    if (name === 'forge_rndir')    return await _rndir(args, rootRegistry);
    throw new Error(`Unknown tool: ${name}`);
  } catch (err) {
    log('ERROR', `${name} error: ${err.message}`);
    return { content: [{ type: 'text', text: JSON.stringify({ error: err.message }) }], isError: true };
  }
}

// ====[ tool-ping ]====

function _ping() {
  log('INFO', 'forge_ping');
  return { content: [{ type: 'text', text: 'pong — forge v3.0.0' }] };
}

// ====[ tool-ls ]====

async function _ls(args, config, rootRegistry, typeRegistry) {
  const { fal } = args;
  log('INFO', `forge_ls — fal: ${fal || '(none)'}`);

  if (!fal) {
    const roots = config.roots.map(r => ({ name: r.name, url: r.url }));
    return { content: [{ type: 'text', text: JSON.stringify({ roots }, null, 2) }] };
  }

  const ref = parseFAL(fal);
  if (ref.name) throw new Error(`forge_ls requires a folder FAL (ending with /). Got: ${fal}`);

  const raw     = await rootRegistry.list(ref, typeRegistry);
  const entries = raw.map(e => {
    const entryFal = e.artifactRef ? toFAL(e.artifactRef) : e.fal;
    brand(entryFal);
    return { fal: entryFal, type: e.type };
  });

  return { content: [{ type: 'text', text: JSON.stringify({ fal, count: entries.length, entries }, null, 2) }] };
}

// ====[ tool-describe ]====

function _describe(args, typeRegistry) {
  const { fal } = args;
  log('INFO', `forge_describe — fal: ${fal}`);
  const ref = parseFAL(fal);
  if (!ref.name) throw new Error(`forge_describe requires an artifact FAL. Got: ${fal}`);
  const result = typeRegistry.describe(ref);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
}

// ====[ tool-read ]====

async function _read(args, typeRegistry, rootRegistry) {
  const { fal } = args;
  log('INFO', `forge_read — fal: ${fal}`);
  const ref     = parseFAL(fal);
  if (!ref.name) throw new Error(`forge_read requires an artifact FAL. Got: ${fal}`);
  const block   = ref.block || '';
  const content = await typeRegistry.read(ref, rootRegistry, block);
  log('INFO', `forge_read — ${content.length} chars`);
  // O8: prepend FAL + block header so the AI keeps context across multiple reads
  const header = `[fal: ${fal}${block ? `  block: ${block}` : ''}]\n`;
  return { content: [{ type: 'text', text: header + content }] };
}

// ====[ tool-create ]====

async function _create(args, typeRegistry, rootRegistry) {
  const { fal } = args;
  log('INFO', `forge_create — fal: ${fal}`);
  const ref = parseFAL(fal);
  if (!ref.name) throw new Error(`forge_create requires an artifact FAL. Got: ${fal}`);
  await typeRegistry.createArtifact(ref, rootRegistry);
  log('INFO', `forge_create — done`);
  return { content: [{ type: 'text', text: JSON.stringify({ ok: true, fal }) }] };
}

// ====[ tool-write ]====

async function _write(args, typeRegistry, rootRegistry) {
  const { fal, block = '', content } = args;
  log('INFO', `forge_write — fal: ${fal}, block: "${block}", ${content?.length ?? 0} chars`);
  if (content === undefined || content === null) throw new Error('forge_write requires content.');
  const ref = parseFAL(fal);
  if (!ref.name) throw new Error(`forge_write requires an artifact FAL. Got: ${fal}`);
  await typeRegistry.write(ref, rootRegistry, block, content);
  log('INFO', `forge_write — done`);
  return { content: [{ type: 'text', text: JSON.stringify({ ok: true, fal, block, written: content.length }) }] };
}

// ====[ tool-mkdir ]====

async function _mkdir(args, rootRegistry) {
  const { fal } = args;
  log('INFO', `forge_mkdir — fal: ${fal}`);
  const ref = parseFAL(fal);
  if (ref.name) throw new Error(`forge_mkdir requires a folder FAL (ending with /). Got: ${fal}`);
  await rootRegistry.mkdir(ref);
  brand(fal);
  log('INFO', `forge_mkdir — done`);
  return { content: [{ type: 'text', text: JSON.stringify({ ok: true, fal }) }] };
}

// ====[ tool-rmdir ]====

async function _rmdir(args, rootRegistry) {
  const { fal } = args;
  log('INFO', `forge_rmdir — fal: ${fal}`);
  const ref = parseFAL(fal);
  if (ref.name) throw new Error(`forge_rmdir requires a folder FAL (ending with /). Got: ${fal}`);
  await rootRegistry.rmdir(ref);
  log('INFO', `forge_rmdir — done`);
  return { content: [{ type: 'text', text: JSON.stringify({ ok: true, fal }) }] };
}

// ====[ tool-mvdir ]====

async function _mvdir(args, rootRegistry) {
  const { fal, target } = args;
  log('INFO', `forge_mvdir — fal: ${fal}, target: ${target}`);
  const ref       = parseFAL(fal);
  const targetRef = parseFAL(target);
  if (ref.name)       throw new Error(`forge_mvdir source must be a folder FAL. Got: ${fal}`);
  if (targetRef.name) throw new Error(`forge_mvdir target must be a folder FAL. Got: ${target}`);
  await rootRegistry.mvdir(ref, targetRef);
  log('INFO', `forge_mvdir — done`);
  return { content: [{ type: 'text', text: JSON.stringify({ ok: true, fal, target }) }] };
}

// ====[ tool-rndir ]====

async function _rndir(args, rootRegistry) {
  const { fal, name } = args;
  log('INFO', `forge_rndir — fal: ${fal}, name: ${name}`);
  if (!name) throw new Error('forge_rndir requires a name.');
  const ref = parseFAL(fal);
  if (ref.name) throw new Error(`forge_rndir requires a folder FAL. Got: ${fal}`);
  await rootRegistry.rndir(ref, name);
  log('INFO', `forge_rndir — done`);
  return { content: [{ type: 'text', text: JSON.stringify({ ok: true, fal, name }) }] };
}
