/**
 * plain-text.js
 *
 * Generic plain-text type handler — v7.0 interface.
 * Claims any file whose extension matches a registered plain-text type name.
 * No block structure — full file content only.
 *
 * Registered under multiple type names in forge-types.json:
 *   "txt", "md", "js", "json", "css", "html", ...
 *
 * v7.0 interface changes from v1.3:
 *   - claim(urlRef, rootRegistry)    instead of claim(url, typeName)
 *   - readBlock(urlRef, block, rootRegistry)   delegates to rootRegistry.read(urlRef)
 *   - writeBlock(urlRef, block, content, rootRegistry) delegates to rootRegistry.write(urlRef, content)
 *   - createArtifact(urlRef, rootRegistry)     delegates to rootRegistry.create(urlRef)
 *   - urlToFAL / falToURL removed (root registry is now sole authority on URL↔ref conversion)
 *   - extension property added (used by TypeRegistry for ArtifactRef↔UrlRef conversion)
 *
 * claim(urlRef, rootRegistry):
 *   Returns true for any plain-text extension (.md, .txt, .js, .json, .css, .html, ...).
 *   Does not limit to a specific type name — the type registry controls which
 *   extensions are registered and calls claim in hierarchy order.
 *   A urlRef with no extension or an unrecognized binary extension returns false.
 *
 * References:
 *   - conventions/forge.md v7.0 [section Type handlers]
 *   - conventions/forge.md v7.0 [section Type discovery]
 *   - conventions/forge.md v7.0 [section IRootRegistry]
 */

import path from 'path';

export const type    = 'plain-text';
export const version = '2.0';

// Plain-text extensions this handler claims.
// This set covers all types registered in forge-types.json.
const PLAIN_TEXT_EXTENSIONS = new Set(['.txt', '.md', '.js', '.json', '.css', '.html', '.csv', '.ts', '.xml', '.yaml', '.yml', '.sh', '.env']);

// Extension property — used by TypeRegistry for ArtifactRef↔UrlRef conversion.
// For a multi-type handler the TypeRegistry stores the extension per registry entry;
// this field is the canonical extension for the 'plain-text' meta-type.
// Individual registrations use the type name directly (e.g. 'md' → '.md').
export const extension = '.txt';

// ---------------------------------------------------------------------------
// Type discovery
// ---------------------------------------------------------------------------

/**
 * Claim a UrlRef if its extension is a known plain-text extension.
 * @param {{ extension: string }} urlRef
 * @param {object} _rootRegistry - not used by plain-text (no content inspection needed)
 * @returns {boolean}
 */
export function claim(urlRef, _rootRegistry) {
  const ext = (urlRef.extension || '').toLowerCase();
  if (!ext || !ext.startsWith('.')) return false;
  return PLAIN_TEXT_EXTENSIONS.has(ext);
}

// ---------------------------------------------------------------------------
// Block operations
// ---------------------------------------------------------------------------

/**
 * Read the full file content.
 * Block must be "" — plain-text has no block structure.
 * Delegates to rootRegistry.read(urlRef).
 * @param {{ extension: string }} urlRef
 * @param {string} block - must be ""
 * @param {{ read(ref): Promise<string> }} rootRegistry
 * @returns {Promise<string>}
 */
export async function readBlock(urlRef, block, rootRegistry) {
  if (block !== '') {
    throw new Error(`plain-text type has no block structure — block must be "" (got "${block}")`);
  }
  return rootRegistry.read(urlRef);
}

/**
 * Write the full file content.
 * Block must be "" — plain-text has no block structure.
 * Requires the file to already exist — use createArtifact first.
 * Delegates to rootRegistry.write(urlRef, content).
 * @param {{ extension: string }} urlRef
 * @param {string} block - must be ""
 * @param {string} content
 * @param {{ write(ref, content): Promise<void> }} rootRegistry
 */
export async function writeBlock(urlRef, block, content, rootRegistry) {
  if (block !== '') {
    throw new Error(`plain-text type has no block structure — block must be "" (got "${block}")`);
  }
  return rootRegistry.write(urlRef, content);
}

export async function listBlocks(_urlRef, _block, _rootRegistry) {
  throw new Error('plain-text type has no block structure — use forge_read for full content');
}

export async function insertBlock(_urlRef, _name, _after, _rootRegistry, _firstChild = false) {
  throw new Error('plain-text type: insertBlock not implemented');
}

export async function appendBlock(_urlRef, _block, _content, _rootRegistry) {
  throw new Error('plain-text type: appendBlock not implemented');
}

export async function deleteBlock(_urlRef, _block, _rootRegistry) {
  throw new Error('plain-text type: deleteBlock not implemented');
}

// ---------------------------------------------------------------------------
// Artifact CRUD
// ---------------------------------------------------------------------------

/**
 * Create a new empty file.
 * Delegates to rootRegistry.create(urlRef).
 * Error if the file already exists.
 * @param {{ extension: string }} urlRef
 * @param {{ create(ref): Promise<void> }} rootRegistry
 */
export async function createArtifact(urlRef, rootRegistry) {
  return rootRegistry.create(urlRef);
}

export async function deleteArtifact(_urlRef, _rootRegistry) {
  throw new Error('plain-text type: deleteArtifact not implemented');
}

export async function moveArtifact(_urlRef, _targetUrlRef, _rootRegistry) {
  throw new Error('plain-text type: moveArtifact not implemented');
}

export async function renameArtifact(_urlRef, _name, _rootRegistry) {
  throw new Error('plain-text type: renameArtifact not implemented');
}
