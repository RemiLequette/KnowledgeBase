/**
 * forge-write.js — content tool handler
 *
 * forge_write({ path, payload })
 * Reads the file, runs the claim loop, delegates to format handler.
 * Native fallback: payload must contain { content: string }, written directly.
 */
import { parsePath } from '../src/path-parser.js';

export async function initTool(_toolJson, { rootRegistry, formatRegistry } = {}) {
  return {
    async execute({ path: mcpPath, payload } = {}) {
      if (!rootRegistry || !formatRegistry) return { ok: 'not implemented' };
      if (!mcpPath)  throw new Error('forge_write: "path" is required');
      if (!payload)  throw new Error('forge_write: "payload" is required');

      const ref        = parsePath(mcpPath);
      const rawContent = await rootRegistry.read(ref);
      const ext        = ref.extension ? ref.extension.slice(1) : '';

      const handler = await formatRegistry.dispatch(ext, rawContent);

      if (!handler) {
        // Native fallback — payload.content replaces file verbatim
        await rootRegistry.write(ref, payload.content ?? '');
        return { ok: `Written: ${mcpPath}` };
      }

      await handler.write(ref, rootRegistry, payload);
      return { ok: `Written: ${mcpPath}` };
    }
  };
}
