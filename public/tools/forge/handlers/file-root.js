/**
 * file-root.js
 *
 * Root handler for local filesystem roots — v7.0 interface.
 * Implements IRootRegistry: artifact CRUD and folder navigation on UrlRef objects.
 *
 * A UrlRef carries: { root, path, name, extension, _url? }
 * _url is the absolute file:// URL of the resource.
 * When _url is present it is used directly.
 * When _url is absent the path is reconstructed from rootBases (populated by RootRegistry).
 *
 * IRootRegistry (artifact CRUD):
 *   create(ref)              → void; error if already exists
 *   read(ref)                → string content
 *   write(ref, content)      → void; error if does not exist
 *   delete(ref)              → void; error if does not exist
 *
 * Folder navigation:
 *   list(ref)                → { folders: UrlRef[], artifacts: UrlRef[] }
 *   mkdir(ref)               → void; error if already exists
 *   rmdir(ref)               → void; error if not empty
 *   rename(ref, name)        → void; error if target name exists
 *   move(ref, targetRef)     → void; error if target exists
 *
 * References:
 *   - conventions/forge.md v7.0 [section Root registry]
 *   - conventions/forge.md v7.0 [section IRootRegistry]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

export const version = '2.0';

// ---------------------------------------------------------------------------
// Root bases registry
// Populated by RootRegistry.load() so refs without _url can be resolved.
// ---------------------------------------------------------------------------

/** @type {Map<string, string>} rootName → base filesystem path (no trailing slash) */
export const rootBases = new Map();

/**
 * Register a root base path for a given root name.
 * Called by RootRegistry at load time.
 * @param {string} rootName
 * @param {string} baseUrl - file:// URL (with or without trailing slash)
 */
export function registerRoot(rootName, baseUrl) {
  const stripped = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  rootBases.set(rootName, fileURLToPath(stripped));
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the absolute filesystem path from a UrlRef.
 * Uses _url if present; otherwise reconstructs from rootBases.
 * @param {{ root: string, path?: string, name?: string, extension?: string, _url?: string }} ref
 * @returns {string}
 */
function refToPath(ref) {
  if (ref._url) {
    const url = ref._url.endsWith('/') ? ref._url.slice(0, -1) : ref._url;
    return fileURLToPath(url);
  }
  const base = rootBases.get(ref.root);
  if (!base) throw new Error(`Unknown root '${ref.root}' — call registerRoot first`);
  return path.join(base, ref.path || '', (ref.name || '') + (ref.extension || ''));
}

/**
 * Build a UrlRef for a child entry under a parent folder ref.
 * @param {{ root: string, path?: string, _url?: string }} parentRef
 * @param {string} entryName - filename (with extension) or dirname
 * @param {boolean} isFolder
 * @returns {{ root: string, path: string, name: string, extension: string, _url: string }}
 */
function childRef(parentRef, entryName, isFolder) {
  const parentPath    = refToPath(parentRef);
  const entryPath     = path.join(parentPath, entryName);
  const entryUrl      = pathToFileURL(entryPath).href + (isFolder ? '/' : '');
  const parentRelPath = (parentRef.path || '').replace(/\/?$/, '/').replace(/^\//, '');

  if (isFolder) {
    return { root: parentRef.root, path: parentRelPath, name: entryName, extension: '', _url: entryUrl };
  } else {
    const ext  = path.extname(entryName);
    const stem = path.basename(entryName, ext);
    return { root: parentRef.root, path: parentRelPath, name: stem, extension: ext, _url: entryUrl };
  }
}

// ---------------------------------------------------------------------------
// IRootRegistry — artifact CRUD
// ---------------------------------------------------------------------------

/**
 * Create a new empty file.
 * Error if the file already exists.
 */
export async function create(ref) {
  const filePath = refToPath(ref);
  if (fs.existsSync(filePath)) throw new Error(`File already exists: ${filePath}`);
  fs.writeFileSync(filePath, '', 'utf8');
}

/**
 * Read file content.
 * @returns {Promise<string>}
 */
export async function read(ref) {
  const filePath = refToPath(ref);
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

/**
 * Write (replace) file content.
 * Error if the file does not exist — use create first.
 */
export async function write(ref, content) {
  const filePath = refToPath(ref);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File does not exist: ${filePath} — call forge_create first`);
  }
  fs.writeFileSync(filePath, content, 'utf8');
}

// 'delete' is a reserved keyword — exported via alias
async function _delete(ref) {
  const filePath = refToPath(ref);
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
  fs.unlinkSync(filePath);
}
export { _delete as delete };

// ---------------------------------------------------------------------------
// Folder navigation
// ---------------------------------------------------------------------------

/**
 * List one level of a folder.
 * @returns {Promise<{ folders: UrlRef[], artifacts: UrlRef[] }>}
 */
export async function list(ref) {
  const folderPath = refToPath(ref);
  if (!fs.existsSync(folderPath)) throw new Error(`Folder not found: ${folderPath}`);
  if (!fs.statSync(folderPath).isDirectory()) throw new Error(`Not a directory: ${folderPath}`);

  const entries   = fs.readdirSync(folderPath, { withFileTypes: true });
  const folders   = [];
  const artifacts = [];

  for (const entry of entries) {
    if (entry.isDirectory())  folders.push(childRef(ref, entry.name, true));
    else if (entry.isFile())  artifacts.push(childRef(ref, entry.name, false));
  }

  folders.sort((a, b)   => a.name.localeCompare(b.name));
  artifacts.sort((a, b) => a.name.localeCompare(b.name));

  return { folders, artifacts };
}

/**
 * Create a folder. Error if already exists.
 */
export async function mkdir(ref) {
  const folderPath = refToPath(ref);
  if (fs.existsSync(folderPath)) throw new Error(`Folder already exists: ${folderPath}`);
  fs.mkdirSync(folderPath, { recursive: false });
}

/**
 * Delete an empty folder. Error if not empty.
 */
export async function rmdir(ref) {
  const folderPath = refToPath(ref);
  if (!fs.existsSync(folderPath)) throw new Error(`Folder not found: ${folderPath}`);
  if (fs.readdirSync(folderPath).length > 0) throw new Error(`Folder is not empty: ${folderPath}`);
  fs.rmdirSync(folderPath);
}

/**
 * Rename a folder in place. Error if target name exists in same parent.
 */
export async function rename(ref, name) {
  if (!name || name.includes('/') || name.includes('\\')) {
    throw new Error(`Invalid folder name: "${name}"`);
  }
  const folderPath = refToPath(ref);
  const targetPath = path.join(path.dirname(folderPath), name);
  if (fs.existsSync(targetPath)) throw new Error(`Target already exists: ${targetPath}`);
  fs.renameSync(folderPath, targetPath);
}

/**
 * Move a folder. Error if target exists.
 */
export async function move(srcRef, dstRef) {
  const srcPath = refToPath(srcRef);
  const dstPath = refToPath(dstRef);
  if (fs.existsSync(dstPath)) throw new Error(`Target already exists: ${dstPath}`);
  fs.renameSync(srcPath, dstPath);
}
