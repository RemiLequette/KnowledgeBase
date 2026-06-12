/**
 * forge-delete.js — content tool handler
 *
 * forge_delete({ path }) — deletes a file. Irreversible.
 * Format-agnostic — no claim loop, delegates straight to rootRegistry.
 */
import { parsePath } from '../src/path-parser.js';

export async function initTool(_toolJson, { rootRegistry } = {}) {
  return {
    async execute({ path: mcpPath }) {
      if (!rootRegistry) return { ok: 'not implemented' };
      if (!mcpPath) throw new Error('forge_delete: "path" is required');
      const ref = parsePath(mcpPath);
      await rootRegistry.delete(ref);
      return { ok: `Deleted: ${mcpPath}` };
    }
  };
}
