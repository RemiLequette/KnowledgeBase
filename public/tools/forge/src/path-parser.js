/**
 * path-parser.js
 *
 * Parses MCP tool input paths into RootRegistry refs.
 *
 * MCP paths use the format:  <rootName>/<path>/<name>.<ext>
 *                        or:  <rootName>/<path>/         (folder — trailing slash)
 *                        or:  <rootName>/                (root folder)
 *
 * Examples:
 *   "development/docs/"              → folder ref  { root: 'development', path: 'docs/', name: '', extension: '' }
 *   "development/docs/readme.md"     → file ref    { root: 'development', path: 'docs/', name: 'readme', extension: '.md' }
 *   "development/"                   → root folder { root: 'development', path: '',      name: '', extension: '' }
 */

import path from 'path';

/**
 * Parse a MCP path string into a RootRegistry ref.
 *
 * @param {string} mcpPath   - e.g. "development/docs/readme.md"
 * @param {'file'|'folder'|'auto'} [hint='auto'] - 'folder' forces folder ref regardless of trailing slash
 * @returns {{ root: string, path: string, name: string, extension: string }}
 */
export function parsePath(mcpPath, hint = 'auto') {
  if (!mcpPath) throw new Error('Path is required');

  // Normalize backslashes
  const normalized = mcpPath.replace(/\\/g, '/');

  // Split root name from the rest
  const slashIdx = normalized.indexOf('/');
  if (slashIdx === -1) {
    // Just a root name — treat as root folder
    return { root: normalized, path: '', name: '', extension: '' };
  }

  const root = normalized.slice(0, slashIdx);
  const rest = normalized.slice(slashIdx + 1); // everything after first slash

  const isFolder = hint === 'folder' || rest.endsWith('/') || rest === '';

  if (isFolder) {
    // Folder ref — path is the full rest (with trailing slash normalised)
    const folderPath = rest.replace(/\/?$/, '/').replace(/^\//, '');
    const cleanPath  = folderPath === '/' ? '' : folderPath;
    return { root, path: cleanPath, name: '', extension: '' };
  }

  // File ref — split path and filename
  const lastSlash = rest.lastIndexOf('/');
  const dirPart   = lastSlash >= 0 ? rest.slice(0, lastSlash + 1) : '';
  const filePart  = lastSlash >= 0 ? rest.slice(lastSlash + 1)    : rest;

  const ext  = path.extname(filePart);
  const name = path.basename(filePart, ext);

  return { root, path: dirPart, name, extension: ext };
}

/**
 * Serialize a ref back to a MCP path string (for display in responses).
 *
 * @param {{ root: string, path: string, name: string, extension: string }} ref
 * @returns {string}
 */
export function serializePath(ref) {
  if (!ref.name) {
    // Folder
    return ref.root + '/' + ref.path;
  }
  return ref.root + '/' + ref.path + ref.name + (ref.extension || '');
}
