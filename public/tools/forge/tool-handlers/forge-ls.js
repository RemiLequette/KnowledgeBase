/**
 * forge-ls.js — navigation tool handler
 *
 * forge_ls({ path? })
 *   - No path → list roots
 *   - Folder path (ending with /) → list subfolders and artifacts
 *   - File path → list top-level sections (deferred to format layer — returns stub)
 */
import { parsePath, serializePath } from '../src/path-parser.js';

export async function initTool(_toolJson, { rootRegistry } = {}) {
  return {
    async execute({ path: mcpPath } = {}) {
      if (!rootRegistry) return { ok: 'not implemented' };

      // No path — list roots
      if (!mcpPath) {
        const roots = rootRegistry.rootRefs().map(ref => ref.root);
        return { roots };
      }

      const isFolder = mcpPath.endsWith('/') || !mcpPath.includes('.');
      const ref = parsePath(mcpPath, isFolder ? 'folder' : 'auto');

      if (!ref.name) {
        // Folder listing
        const { folders, artifacts } = await rootRegistry.list(ref);
        return {
          entries: [
            ...folders.map(r   => ({ name: r.path.split('/').filter(Boolean).pop() + '/', type: 'folder', path: serializePath(r) })),
            ...artifacts.map(r => ({ name: r.name + r.extension,                          type: 'file',   path: serializePath(r) })),
          ]
        };
      }

      // File — sections listing deferred to format layer (M3)
      return { sections: [], note: 'Section listing available after M3 handler implementation' };
    }
  };
}
