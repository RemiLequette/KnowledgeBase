/**
 * txt.js
 *
 * Type handler for plain text files (.txt).
 * Minimal read-only handler — no block structure.
 *
 * Implements the type handler interface (Option A):
 *   claim(url)  → true if the URL ends with .txt
 *   read(url)   → raw file content as a string
 *
 * References:
 *   - conventions/forge.md [section Type handlers]
 *   - conventions/forge.md [section Type discovery]
 *
 * Not yet in references: none
 */

import fs from 'fs';
import { fileURLToPath } from 'url';

export const type = 'txt';
export const version = '1.0';

/**
 * Claim this URL if it ends with .txt (case-insensitive).
 * @param {string} url - file:// URL
 * @returns {boolean}
 */
export function claim(url) {
  return url.toLowerCase().endsWith('.txt');
}

/**
 * Read the raw file content.
 * @param {string} url - file:// URL
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
