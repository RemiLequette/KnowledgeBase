/**
 * forge-create.js — content tool handler
 *
 * forge_create({ path, format, payload? })
 * Looks up format by name in formatRegistry, calls handler.create().
 * Error if format unknown or file already exists.
 */
import { parsePath } from '../src/path-parser.js';

export async function initTool(_toolJson, { rootRegistry, formatRegistry } = {}) {
  return {
    async execute({ path: mcpPath, format: formatName, payload } = {}) {
      if (!rootRegistry || !formatRegistry) return { ok: 'not implemented' };
      if (!mcpPath)     throw new Error('forge_create: "path" is required');
      if (!formatName)  throw new Error('forge_create: "format" is required');

      const handler = formatRegistry.getByName(formatName);
      if (!handler) throw new Error(`forge_create: unknown format "${formatName}" — consult forge_read("forge://registry")`);

      const ref = parsePath(mcpPath);
      await handler.create(ref, rootRegistry, payload);
      return { ok: `Created: ${mcpPath}`, path: mcpPath };
    }
  };
}
