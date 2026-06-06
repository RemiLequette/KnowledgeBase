/**
 * unknown.js
 *
 * Handler for the built-in 'unknown' artifact type.
 * Used for any file in a root that has no registered type.
 *
 * Read: returns raw file content — equivalent to filesystem.read_file.
 * Write: not supported — write access requires a registered type.
 *
 * This makes 'unknown' a full read-only replacement for filesystem MCP
 * on untyped files (notes, docs, config files, etc.).
 *
 * References:
 *   - conventions/forge.md [section Type registry]
 *   - conventions/forge.md [section Design decisions — filesystem disabled]
 *
 * Not yet in references: none
 */

import fs from 'fs';
import { fileURLToPath } from 'url';

export const type = 'unknown';
export const version = '0.2.0';
export const supports = ['*'];

/**
 * Read raw file content. path is resolved from the handle by the Forge core.
 * @param {string} filePath - Absolute path to the file
 * @returns {{ ok: boolean, content?: string, error?: string }}
 */
export function read(url) {
  try {
    const filePath = fileURLToPath(url);
    const content = fs.readFileSync(filePath, 'utf8');
    return { ok: true, content };
  } catch (err) {
    return { ok: false, error: `Could not read file: ${err.message}` };
  }
}

export function listBlocks(_filePath) {
  return { ok: false, error: 'unknown type has no block structure — use forge_read for raw content' };
}

export function write(_filePath, _block, _content) {
  return { ok: false, error: 'unknown type is read-only — write access requires a registered type' };
}

export function insert(_filePath, _block, _after) {
  return { ok: false, error: 'unknown type is read-only — write access requires a registered type' };
}

export function delete_(_filePath, _block) {
  return { ok: false, error: 'unknown type is read-only — write access requires a registered type' };
}

export function append(_filePath, _block, _content) {
  return { ok: false, error: 'unknown type is read-only — write access requires a registered type' };
}
