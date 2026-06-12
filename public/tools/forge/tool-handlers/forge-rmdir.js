/**
 * forge-rmdir.js — navigation tool handler
 *
 * forge_rmdir({ path }) — deletes a folder. Error if not empty.
 * Path must end with /.
 */
import { parsePath } from '../src/path-parser.js';

export async function initTool(_toolJson, { rootRegistry } = {}) {
  return {
    async execute({ path: mcpPath }) {
      if (!rootRegistry) return { ok: 'not implemented' };
      if (!mcpPath) throw new Error('forge_rmdir: "path" is required');
      const ref = parsePath(mcpPath, 'folder');
      await rootRegistry.rmdir(ref);
      return { ok: `Deleted folder: ${mcpPath}` };
    }
  };
}
