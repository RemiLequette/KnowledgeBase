/**
 * plain-text.js
 *
 * Generic plain-text type handler.
 * Claims any file whose extension matches the registered type name.
 * No block structure — full file content only.
 *
 * Registered under multiple type names in forge-types.json:
 *   "txt", "md", "html", "json", "js", "css", ...
 *
 * FAL mapping: extension is preserved as-is.
 *   urlToFAL("file:///path/PROJECT.md")       -> "PROJECT.md"
 *   falToURL("PROJECT.md", "file:///path/")   -> "file:///path/PROJECT.md"
 *
 * claim(url, typeName) checks the URL ends with "." + typeName.
 * The typeName is passed by the TypeRegistry — required because the same
 * module may be registered under several type names.
 *
 * Implements the type handler interface (forge.md v6.1):
 *   claim(url, typeName)    -> true if url ends with "." + typeName
 *   urlToFAL(url)           -> filename (original name unchanged)
 *   falToURL(falName, base) -> physical URL (base + falName)
 *   readBlock(url, block)   -> full file content (block must be "")
 *   writeBlock(url, block, content) -> write full file content (block must be "")
 *   listBlocks, insertBlock, appendBlock, deleteBlock -> not implemented
 *
 * References:
 *   - conventions/forge.md [section Type handlers]
 *   - conventions/forge.md [section Type discovery]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const type = 'plain-text';
export const version = '1.2';

// --- Type discovery ---

/**
 * Claim a URL if its extension matches the registered type name.
 * @param {string} url - file:// URL
 * @param {string} typeName - type name as registered in forge-types.json
 * @returns {boolean}
 */
export function claim(url, typeName) {
  try {
    const filePath = fileURLToPath(url);
    return path.extname(filePath).toLowerCase() === '.' + typeName.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Produce the FAL name for a given URL.
 * Preserves the original filename and extension unchanged.
 * @param {string} url - file:// URL
 * @returns {string} FAL name, e.g. 'PROJECT.md'
 */
export function urlToFAL(url) {
  const filePath = fileURLToPath(url);
  return path.basename(filePath);
}

/**
 * Recover the physical URL from a FAL name and base URL.
 * FAL name IS the filename — no transformation needed.
 * @param {string} falName - e.g. 'PROJECT.md'
 * @param {string} baseUrl - base URL of the folder (with trailing slash)
 * @returns {string} file:// URL
 */
export function falToURL(falName, baseUrl) {
  const base = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  return base + falName;
}

// --- Block operations ---

/**
 * Read the full file content.
 * Block argument must be "" — plain-text has no block structure.
 * @param {string} url - file:// URL
 * @param {string} block - must be ""
 * @returns {Promise<string>} file content
 */
export async function readBlock(url, block = '') {
  if (block !== '') throw new Error(`plain-text type has no block structure — block must be "" (got "${block}")`);
  const filePath = fileURLToPath(url);
  return fs.readFileSync(filePath, 'utf8');
}

/**
 * Write the full file content.
 * Block argument must be "" — plain-text has no block structure.
 * @param {string} url - file:// URL
 * @param {string} block - must be ""
 * @param {string} content - new file content
 */
export async function writeBlock(url, block, content) {
  if (block !== '') throw new Error(`plain-text type has no block structure — block must be "" (got "${block}")`);
  const filePath = fileURLToPath(url);
  fs.writeFileSync(filePath, content, 'utf8');
}

export async function listBlocks(_url, _block = '') {
  throw new Error('plain-text type has no block structure — use forge_read for full content');
}

export async function insertBlock(_url, _name, _after, _firstChild = false) {
  throw new Error('plain-text type: insertBlock not implemented');
}

export async function appendBlock(_url, _block, _content) {
  throw new Error('plain-text type: appendBlock not implemented');
}

export async function deleteBlock(_url, _block) {
  throw new Error('plain-text type: deleteBlock not implemented');
}

// --- Artifact CRUD ---

export async function createArtifact(_url) {
  throw new Error('plain-text type: createArtifact not implemented');
}

export async function deleteArtifact(_url) {
  throw new Error('plain-text type: deleteArtifact not implemented');
}

export async function moveArtifact(_url, _targetUrl) {
  throw new Error('plain-text type: moveArtifact not implemented');
}

export async function renameArtifact(_url, _name) {
  throw new Error('plain-text type: renameArtifact not implemented');
}
