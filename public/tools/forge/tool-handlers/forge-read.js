/**
 * forge-read.js — content tool handler
 *
 * forge_read({ path, query? })
 * Reads the file, runs the claim loop, delegates to format handler.
 * Native fallback when no handler claims the file.
 */
import { parsePath } from '../src/path-parser.js';

export async function initTool(_toolJson, { rootRegistry, formatRegistry } = {}) {
  // Internal helper — read a single file, return { path, format, content } or { path, error }
  async function readOne(mcpPath, query) {
    const ref        = parsePath(mcpPath);
    const rawContent = await rootRegistry.read(ref);
    const ext        = ref.extension ? ref.extension.slice(1) : '';
    const handler    = await formatRegistry.dispatch(ext, rawContent);
    if (!handler) return { path: mcpPath, format: ext || 'unknown', content: rawContent };
    const result = await handler.read(ref, rootRegistry, query);
    return { path: mcpPath, ...result };
  }

  return {
    async execute({ path: mcpPath, paths, query } = {}) {
      if (!rootRegistry || !formatRegistry) return { ok: 'not implemented' };

      // paths[] — multi-file batch
      if (paths !== undefined) {
        if (mcpPath !== undefined) throw new Error('forge_read: "path" and "paths" are mutually exclusive');
        if (!Array.isArray(paths)) throw new Error('forge_read: "paths" must be an array');
        const results = await Promise.all(
          paths.map(async (p) => {
            try {
              return await readOne(p, query);
            } catch (err) {
              return { path: p, error: err.message ?? String(err) };
            }
          })
        );
        return { results };
      }

      // single path
      if (!mcpPath) throw new Error('forge_read: "path" is required');
      const ref        = parsePath(mcpPath);
      const rawContent = await rootRegistry.read(ref);
      const ext        = ref.extension ? ref.extension.slice(1) : '';
      const handler    = await formatRegistry.dispatch(ext, rawContent);
      if (!handler) return { format: ext || 'unknown', content: rawContent };
      return handler.read(ref, rootRegistry, query);
    }
  };
}
