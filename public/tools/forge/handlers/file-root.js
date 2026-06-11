/**
 * file-root.js
 *
 * Root handler for local filesystem roots.
 * Implements IRootRegistry: artifact CRUD and folder navigation on UrlRef objects.
 *
 * A UrlRef carries: { root, path, name, extension, _url? }
 * _url is the absolute file:// URL of the resource.
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
 *   move(srcRef, dstRef)     → void; error if target exists
 *
 * References:
 *   - conventions/forge.md v0.5
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

export const version = '1.0';

// ---------------------------------------------------------------------------
// Root bases registry
// ---------------------------------------------------------------------------

/** @type {Map<string, string>} rootName → base filesystem path (no trailing slash) */
export const rootBases = new Map();

export function registerRoot(rootName, baseUrl) {
  const stripped = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  rootBases.set(rootName, fileURLToPath(stripped));
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function refToPath(ref) {
  if (ref._url) {
    const url = ref._url.endsWith('/') ? ref._url.slice(0, -1) : ref._url;
    return fileURLToPath(url);
  }
  const base = rootBases.get(ref.root);
  if (!base) throw new Error(`Unknown root '${ref.root}' — call registerRoot first`);
  return path.join(base, ref.path || '', (ref.name || '') + (ref.extension || ''));
}

function childRef(parentRef, entryName, isFolder) {
  const parentPath    = refToPath(parentRef);
  const entryPath     = path.join(parentPath, entryName);
  const entryUrl      = pathToFileURL(entryPath).href + (isFolder ? '/' : '');
  const parentRelPath = (parentRef.path || '').replace(/\/?$/, '/').replace(/^\//, '');

  if (isFolder) {
    return { root: parentRef.root, path: parentRelPath + entryName + '/', name: '', extension: '', _url: entryUrl };
  } else {
    const ext  = path.extname(entryName);
    const stem = path.basename(entryName, ext);
    return { root: parentRef.root, path: parentRelPath, name: stem, extension: ext, _url: entryUrl };
  }
}

// ---------------------------------------------------------------------------
// IRootRegistry — artifact CRUD
// ---------------------------------------------------------------------------

export async function create(ref) {
  const filePath = refToPath(ref);
  if (fs.existsSync(filePath)) throw new Error(`File already exists: ${filePath}`);
  fs.writeFileSync(filePath, '', 'utf8');
}

export async function read(ref) {
  const filePath = refToPath(ref);
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

export async function write(ref, content) {
  const filePath = refToPath(ref);
  if (!fs.existsSync(filePath)) throw new Error(`File does not exist: ${filePath} — call forge_create first`);
  fs.writeFileSync(filePath, content, 'utf8');
}

async function _delete(ref) {
  const filePath = refToPath(ref);
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
  fs.unlinkSync(filePath);
}
export { _delete as delete };

// ---------------------------------------------------------------------------
// Folder navigation
// ---------------------------------------------------------------------------

export async function list(ref) {
  const folderPath = refToPath(ref);
  if (!fs.existsSync(folderPath)) throw new Error(`Folder not found: ${folderPath}`);
  if (!fs.statSync(folderPath).isDirectory()) throw new Error(`Not a directory: ${folderPath}`);

  const entries   = fs.readdirSync(folderPath, { withFileTypes: true });
  const folders   = [];
  const artifacts = [];

  for (const entry of entries) {
    if (entry.isDirectory()) folders.push(childRef(ref, entry.name, true));
    else if (entry.isFile()) artifacts.push(childRef(ref, entry.name, false));
  }

  folders.sort((a, b)   => a.path.localeCompare(b.path));
  artifacts.sort((a, b) => a.name.localeCompare(b.name));

  return { folders, artifacts };
}

export async function mkdir(ref) {
  const folderPath = refToPath(ref);
  if (fs.existsSync(folderPath)) throw new Error(`Folder already exists: ${folderPath}`);
  fs.mkdirSync(folderPath, { recursive: false });
}

export async function rmdir(ref) {
  const folderPath = refToPath(ref);
  if (!fs.existsSync(folderPath)) throw new Error(`Folder not found: ${folderPath}`);
  if (fs.readdirSync(folderPath).length > 0) throw new Error(`Folder is not empty: ${folderPath}`);
  fs.rmdirSync(folderPath);
}

export async function rename(ref, name) {
  if (!name || name.includes('/') || name.includes('\\')) {
    throw new Error(`Invalid folder name: "${name}"`);
  }
  const folderPath = refToPath(ref);
  const targetPath = path.join(path.dirname(folderPath), name);
  if (fs.existsSync(targetPath)) throw new Error(`Target already exists: ${targetPath}`);
  fs.renameSync(folderPath, targetPath);
}

export async function move(srcRef, dstRef) {
  const srcPath = refToPath(srcRef);
  const dstPath = refToPath(dstRef);
  if (fs.existsSync(dstPath)) throw new Error(`Target already exists: ${dstPath}`);
  fs.renameSync(srcPath, dstPath);
}
