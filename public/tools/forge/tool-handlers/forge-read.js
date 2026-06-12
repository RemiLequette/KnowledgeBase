/**
 * forge-read.js — content tool handler
 *
 * forge_read({ path, query? })
 * Reads the file, runs the claim loop, delegates to format handler.
 * Native fallback when no handler claims the file.
 */
import { parsePath } from '../src/path-parser.js';

export async function initTool(_toolJson, { rootRegistry, formatRegistry } = {}) {
  return {
    async execute({ path: mcpPath, query } = {}) {
      if (!rootRegistry || !formatRegistry) return { ok: 'not implemented' };
      if (!mcpPath) throw new Error('forge_read: "path" is required');

      const ref        = parsePath(mcpPath);
      const rawContent = await rootRegistry.read(ref);
      const ext        = ref.extension ? ref.extension.slice(1) : '';

      const handler = await formatRegistry.dispatch(ext, rawContent);

      if (!handler) {
        // Native fallback — return raw content
        return { format: ext || 'unknown', content: rawContent };
      }

      return handler.read(ref, rootRegistry, query);
    }
  };
}
