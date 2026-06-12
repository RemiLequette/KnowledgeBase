/**
 * forge-move.js — navigation tool handler
 *
 * forge_move({ path, target }) — moves a file or folder to a new path.
 * Error if destination exists. Moving across roots is not supported.
 */
import { parsePath } from '../src/path-parser.js';

export async function initTool(_toolJson, { rootRegistry } = {}) {
  return {
    async execute({ path: mcpPath, target: mcpTarget }) {
      if (!rootRegistry) return { ok: 'not implemented' };
      if (!mcpPath)   throw new Error('forge_move: "path" is required');
      if (!mcpTarget) throw new Error('forge_move: "target" is required');

      const srcIsFolder = mcpPath.endsWith('/');
      const dstIsFolder = mcpTarget.endsWith('/');

      const srcRef = parsePath(mcpPath,   srcIsFolder ? 'folder' : 'auto');
      const dstRef = parsePath(mcpTarget, dstIsFolder ? 'folder' : 'auto');

      if (srcRef.root !== dstRef.root) {
        throw new Error(`forge_move: cannot move across roots ("${srcRef.root}" → "${dstRef.root}")`);
      }

      if (!srcRef.name) {
        // Folder move
        await rootRegistry.mvdir(srcRef, dstRef);
      } else {
        // File move — rootRegistry.mvdir handles both; treat file as folder ref for move
        await rootRegistry.mvdir(srcRef, dstRef);
      }

      return { ok: `Moved: ${mcpPath} → ${mcpTarget}` };
    }
  };
}
