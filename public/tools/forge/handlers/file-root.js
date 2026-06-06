/**
 * file-root.js
 *
 * Root handler for local filesystem roots.
 * Manages folder navigation under a root whose base URL is a file:// URL.
 *
 * Implements the root handler interface (Option A — list only):
 *   list(url) → [{ url, isFolder }]
 *
 * References:
 *   - conventions/forge.md [section Root handler]
 *   - conventions/forge.md [section Roots and configuration]
 *
 * Not yet in references: none
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const version = '1.0';

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
  // Normalize separators and encode
  const normalized = filePath.replace(/\\/g, '/');
  return 'file:///' + normalized.replace(/^\//, '');
}

/**
 * List one level of a folder.
 * Returns an ordered array of { url, isFolder } entries.
 * Files and folders are sorted: folders first, then files, each group alphabetically.
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
