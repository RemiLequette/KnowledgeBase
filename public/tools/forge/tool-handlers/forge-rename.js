/**
 * forge-rename.js — navigation tool handler
 *
 * forge_rename({ path, name }) — renames a file or folder in place.
 * name is the new name only (not a full path).
 */
import { parsePath } from '../src/path-parser.js';

export async function initTool(_toolJson, { rootRegistry } = {}) {
  return {
    async execute({ path: mcpPath, name }) {
      if (!rootRegistry) return { ok: 'not implemented' };
      if (!mcpPath) throw new Error('forge_rename: "path" is required');
      if (!name)    throw new Error('forge_rename: "name" is required');

      const isFolder = mcpPath.endsWith('/');
      const ref = parsePath(mcpPath, isFolder ? 'folder' : 'auto');
      await rootRegistry.rndir(ref, name);
      return { ok: `Renamed: ${mcpPath} → ${name}` };
    }
  };
}
