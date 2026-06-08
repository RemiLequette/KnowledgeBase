// @forge-type: js-managed

// ====[ imports ]====

import { log } from './logger.js';
import { ForgeSession } from './forge-api.js';

// ====[ tool-definitions ]====

export const TOOL_DEFINITIONS = [
  {
    name: 'forge_ping',
    description: 'Connectivity check — returns pong and server version.',
    inputSchema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'forge_ls',
    description: 'List one level — unified at all depths. No arg: list roots. Folder FAL (ending with /): list folders and artifacts. Artifact FAL with node fragment (artifact#node): list node children as { name, type } in order. Always free for folder/root listing. Artifact node listing requires Brand + RTFM.',
    inputSchema: {
      type: 'object',
      properties: { fal: { type: 'string', description: 'Folder FAL, or artifact FAL with optional #node fragment.' } },
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
    description: 'Create a new empty artifact. Error if the artifact already exists. Brands the FAL — forge_write can follow without forge_ls.',
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
    name: 'forge_is_block',
    description: 'Returns true if the target is a block (writable), false if it is a node. Requires Brand + RTFM.',
    inputSchema: {
      type: 'object',
      properties: { fal: { type: 'string', description: 'Artifact FAL with #block fragment.' } },
      required: ['fal']
    }
  },
  {
    name: 'forge_delete',
    description: 'Delete an artifact (FAL without fragment) or a node/block and its children (FAL with #name fragment). Requires Brand + RTFM for intra-artifact targets.',
    inputSchema: {
      type: 'object',
      properties: { fal: { type: 'string', description: 'Artifact FAL, or artifact FAL with #name fragment.' } },
      required: ['fal']
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

// ====[ helpers ]====

function ok(data) {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

function err(name, e) {
  log('ERROR', `${name} error: ${e.message}`);
  return { content: [{ type: 'text', text: JSON.stringify({ error: e.message }) }], isError: true };
}

// ====[ dispatch ]====

/**
 * Dispatch a MCP CallTool request to ForgeSession.
 * Pure protocol wrapper — no Forge logic here.
 * @param {string}       name
 * @param {object}       args
 * @param {ForgeSession} session
 */
export async function dispatch(name, args, session) {
  try {
    switch (name) {
      case 'forge_ping': {
        return ok(session.ping());
      }
      case 'forge_ls': {
        const result = await session.ls(args.fal);
        return ok(result);
      }
      case 'forge_describe': {
        return ok(session.describe(args.fal));
      }
      case 'forge_read': {
        const content = await session.read(args.fal);
        // O8: prepend FAL header so the AI keeps context across multiple reads
        const header = `[fal: ${args.fal}]\n`;
        return { content: [{ type: 'text', text: header + content }] };
      }
      case 'forge_create': {
        await session.create(args.fal);
        return ok({ ok: true, fal: args.fal });
      }
      case 'forge_write': {
        await session.write(args.fal, args.block || '', args.content);
        return ok({ ok: true, fal: args.fal, block: args.block || '', written: args.content.length });
      }
      case 'forge_is_block': {
        const isBlock = await session.isBlock(args.fal);
        return ok({ fal: args.fal, isBlock });
      }
      case 'forge_delete': {
        await session.delete(args.fal);
        return ok({ ok: true, fal: args.fal });
      }
      case 'forge_mkdir': {
        await session.mkdir(args.fal);
        return ok({ ok: true, fal: args.fal });
      }
      case 'forge_rmdir': {
        await session.rmdir(args.fal);
        return ok({ ok: true, fal: args.fal });
      }
      case 'forge_mvdir': {
        await session.mvdir(args.fal, args.target);
        return ok({ ok: true, fal: args.fal, target: args.target });
      }
      case 'forge_rndir': {
        await session.rndir(args.fal, args.name);
        return ok({ ok: true, fal: args.fal, name: args.name });
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (e) {
    return err(name, e);
  }
}
