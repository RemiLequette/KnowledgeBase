/**
 * file-root.js
 *
 * Root handler for local filesystem roots.
 * Manages folder navigation under a root whose base URL is a file:// URL.
 *
 * Implements the root handler interface:
 *   list(url)              → [{ url, isFolder }]
 *   mkdir(url)             → void
 *   rename(url, name)      → void
 *   move(url, targetUrl)   → void
 *   rmdir(url)             → void  (error if not empty)
 *
 * References:
 *   - conventions/forge.md [section Root handler]
 *   - conventions/forge.md [section Roots and configuration]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const version = '1.1';

/**
 * Convert a file:// URL to an absolute filesystem path.
 * @param {string} url
 * @returns {string}
 */
function urlToPath(url) {
  return fileURLToPath(url);
}

/**
 * Convert an absolute filesystem path to a file:// URL.
 * @param {string} filePath
 * @returns {string}
 */
function pathToUrl(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  return 'file:///' + normalized.replace(/^\//, '');
}

/**
 * List one level of a folder.
 * Returns an ordered array of { url, isFolder } entries.
 * Folders first, then files, each group alphabetically.
 *
 * @param {string} url - file:// URL of the folder to list
 * @returns {Array<{ url: string, isFolder: boolean }>}
 */
export function list(url) {
  const folderPath = urlToPath(url);

  if (!fs.existsSync(folderPath)) {
    throw new Error(`Folder not found: ${folderPath}`);
  }

  const stat = fs.statSync(folderPath);
  if (!stat.isDirectory()) {
    throw new Error(`Not a directory: ${folderPath}`);
  }

  const entries = fs.readdirSync(folderPath, { withFileTypes: true });

  const folders = [];
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(folderPath, entry.name);
    const entryUrl = pathToUrl(entryPath);
    if (entry.isDirectory()) {
      folders.push({ url: entryUrl + '/', isFolder: true });
    } else if (entry.isFile()) {
      files.push({ url: entryUrl, isFolder: false });
    }
    // symlinks and other types are ignored
  }

  folders.sort((a, b) => a.url.localeCompare(b.url));
  files.sort((a, b) => a.url.localeCompare(b.url));

  return [...folders, ...files];
}

/**
 * Create a folder.
 * Error if the folder already exists.
 *
 * @param {string} url - file:// URL of the folder to create
 */
export function mkdir(url) {
  const folderPath = urlToPath(url);
  if (fs.existsSync(folderPath)) {
    throw new Error(`Folder already exists: ${folderPath}`);
  }
  fs.mkdirSync(folderPath, { recursive: false });
}

/**
 * Rename a folder (in place — parent does not change).
 * Error if the target name already exists in the same parent.
 *
 * @param {string} url  - file:// URL of the folder to rename (with trailing slash)
 * @param {string} name - new folder name (no slashes)
 */
export function rename(url, name) {
  if (!name || name.includes('/') || name.includes('\\')) {
    throw new Error(`Invalid folder name: "${name}"`);
  }
  const folderPath = urlToPath(url.endsWith('/') ? url.slice(0, -1) : url);
  const parentPath = path.dirname(folderPath);
  const targetPath = path.join(parentPath, name);
  if (fs.existsSync(targetPath)) {
    throw new Error(`Target already exists: ${targetPath}`);
  }
  fs.renameSync(folderPath, targetPath);
}

/**
 * Move a folder to a new parent within the same root.
 * Error if the target URL already exists.
 *
 * @param {string} url       - file:// URL of the folder to move (with trailing slash)
 * @param {string} targetUrl - file:// URL of the destination (with trailing slash)
 */
export function move(url, targetUrl) {
  const srcPath = urlToPath(url.endsWith('/') ? url.slice(0, -1) : url);
  const dstPath = urlToPath(targetUrl.endsWith('/') ? targetUrl.slice(0, -1) : targetUrl);
  if (fs.existsSync(dstPath)) {
    throw new Error(`Target already exists: ${dstPath}`);
  }
  fs.renameSync(srcPath, dstPath);
}

/**
 * Delete a folder.
 * Error if the folder is not empty (contains any files or subdirectories).
 *
 * @param {string} url - file:// URL of the folder to delete (with trailing slash)
 */
export function rmdir(url) {
  const folderPath = urlToPath(url.endsWith('/') ? url.slice(0, -1) : url);
  if (!fs.existsSync(folderPath)) {
    throw new Error(`Folder not found: ${folderPath}`);
  }
  const entries = fs.readdirSync(folderPath);
  if (entries.length > 0) {
    throw new Error(`Folder is not empty: ${folderPath}`);
  }
  fs.rmdirSync(folderPath);
}
