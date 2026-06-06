/**
 * unknown.js
 *
 * Handler for the built-in 'unknown' artifact type.
 * Used for any file in a root that has no registered type.
 * Exposes no structured operations — signals presence only.
 *
 * References:
 *   - forge design session 2026-06-06
 *
 * Not yet in references:
 *   - unknown type exists to make unmanaged files visible, not to operate on them
 */

export const type = 'unknown';
export const version = '0.1.0';
export const supports = ['*'];

export function listBlocks(_handle) {
  return { ok: false, error: 'unknown type has no block structure' };
}

export function read(_handle, _block) {
  return { ok: false, error: 'unknown type has no read operation' };
}

export function write(_handle, _block, _content) {
  return { ok: false, error: 'unknown type has no write operation' };
}
