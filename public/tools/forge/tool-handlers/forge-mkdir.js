/**
 * forge-mkdir.js — navigation tool handler
 *
 * forge_mkdir({ path }) — creates a folder. Error if already exists.
 * Path must end with /.
 */
import { parsePath } from '../src/path-parser.js';

export async function initTool(_toolJson, { rootRegistry } = {}) {
  return {
    async execute({ path: mcpPath }) {
      if (!rootRegistry) return { ok: 'not implemented' };
      if (!mcpPath) throw new Error('forge_mkdir: "path" is required');
      const ref = parsePath(mcpPath, 'folder');
      await rootRegistry.mkdir(ref);
      return { ok: `Created folder: ${mcpPath}` };
    }
  };
}
