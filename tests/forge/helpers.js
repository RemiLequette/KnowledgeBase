/**
 * helpers.js
 *
 * Test helpers for Forge unit tests.
 * Provides UrlRef / ArtifactRef builders and sandbox filesystem utilities.
 *
 * All helpers are relative to tests/forge/fixtures/.
 * Registers the 'test' root in file-root.js rootBases at import time
 * so UrlRefs without _url resolve correctly in all test files.
 *
 * References:
 *   - conventions/forge.md v7.0 [sections Key concepts, IRootRegistry]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerRoot } from '../../public/tools/forge/handlers/file-root.js';

const __dirname    = path.dirname(fileURLToPath(import.meta.url));
export const FIXTURES_DIR = path.join(__dirname, 'fixtures');
export const SANDBOX_DIR  = path.join(FIXTURES_DIR, 'sandbox');

// Register the 'test' root so refToPath works for UrlRefs without _url.
// This must run before any file-root operation that receives a UrlRef without _url.
const fixturesUrl = 'file:///' + FIXTURES_DIR.replace(/\\/g, '/').replace(/^\//, '') + '/';
registerRoot('test', fixturesUrl);

// ---------------------------------------------------------------------------
// UrlRef / ArtifactRef builders
// ---------------------------------------------------------------------------

/**
 * Build a UrlRef pointing to a file in fixtures/.
 * @param {string} name       - filename stem (e.g. 'sample')
 * @param {string} extension  - with dot (e.g. '.md')
 * @param {string} [subdir]   - optional subfolder under fixtures/ (e.g. 'sandbox')
 */
export function urlRef(name, extension, subdir = '') {
  const relPath = subdir ? subdir + '/' : '';
  const absPath = path.join(FIXTURES_DIR, relPath, name + extension);
  return {
    root:      'test',
    path:      relPath,
    name,
    extension,
    _url:      'file:///' + absPath.replace(/\\/g, '/').replace(/^\//, '')
  };
}

/**
 * Resolve the absolute filesystem path from a UrlRef.
 */
export function urlRefPath(ref) {
  if (ref._url) {
    const u = ref._url.replace(/\/$/, '');
    return fileURLToPath(u.startsWith('file:') ? u : 'file:///' + u.replace(/^\//, ''));
  }
  return path.join(FIXTURES_DIR, ref.path || '', (ref.name || '') + (ref.extension || ''));
}

/**
 * Build an ArtifactRef.
 * @param {string} name      - artifact name stem
 * @param {string} type      - type name without dot (e.g. 'md')
 * @param {string} [subdir]  - optional subfolder
 */
export function artifactRef(name, type, subdir = '') {
  return { root: 'test', path: subdir ? subdir + '/' : '', name, type };
}

/**
 * Build a FAL string from an ArtifactRef.
 */
export function toFAL(ref) {
  if (!ref.name) return `forge://${ref.root}/${ref.path}`;
  return `forge://${ref.root}/${ref.path}${ref.name}.${ref.type}`;
}

// ---------------------------------------------------------------------------
// Sandbox filesystem utilities
// ---------------------------------------------------------------------------

export function sandboxCreate(filename, content = '') {
  fs.writeFileSync(path.join(SANDBOX_DIR, filename), content, 'utf8');
}

export function sandboxClean(filename) {
  const p = path.join(SANDBOX_DIR, filename);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

export function sandboxRead(filename) {
  return fs.readFileSync(path.join(SANDBOX_DIR, filename), 'utf8');
}
