/**
 * forge-testable.js
 *
 * Test helpers for Forge unit tests.
 * Provides testConfig, UrlRef/ArtifactRef factories, and sandbox utilities.
 *
 * Does NOT duplicate TypeRegistry or RootRegistry — tests import those
 * directly from forge.js once it exports them.
 *
 * References:
 *   - conventions/forge.md v7.0 [section Key concepts]
 *   - conventions/forge.md v7.0 [section Registry]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FORGE_DIR  = path.join(__dirname, '..');
const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const SANDBOX_DIR  = path.join(FIXTURES_DIR, 'sandbox');

// ---------------------------------------------------------------------------
// Test config
// ---------------------------------------------------------------------------

export const testConfig = {
  roots: [
    {
      name: 'test',
      url: pathToFileURL(FIXTURES_DIR).href + '/',
      handler: pathToFileURL(path.join(FORGE_DIR, 'handlers', 'file-root.js')).href
    }
  ],
  types: pathToFileURL(path.join(FORGE_DIR, 'forge-types.json')).href
};

// ---------------------------------------------------------------------------
// UrlRef factory
// ---------------------------------------------------------------------------

/**
 * Build a UrlRef object.
 * @param {string} name - filename stem, e.g. 'sample'
 * @param {string} extension - with dot, e.g. '.md'
 * @param {string} [subPath] - relative subfolder within fixtures, e.g. 'sandbox/'
 * @returns {{ root: string, path: string, name: string, extension: string, _url: string }}
 */
export function urlRef(name, extension, subPath = '') {
  const rel = subPath ? subPath.replace(/\/?$/, '/') : '';
  const absPath = path.join(FIXTURES_DIR, rel, name + extension);
  const url = pathToFileURL(absPath).href;
  return { root: 'test', path: rel, name, extension, _url: url };
}

/**
 * Return the absolute filesystem path for a UrlRef.
 * Used in tests that need to touch the filesystem directly (setup/teardown).
 * @param {{ path: string, name: string, extension: string }} ref
 * @returns {string}
 */
export function urlRefPath(ref) {
  return path.join(FIXTURES_DIR, ref.path, ref.name + ref.extension);
}

// ---------------------------------------------------------------------------
// ArtifactRef factory
// ---------------------------------------------------------------------------

/**
 * Build an ArtifactRef object.
 * @param {string} name - artifact stem, e.g. 'sample'
 * @param {string} type - type name, e.g. 'md'
 * @param {string} [subPath] - relative subfolder within root, e.g. 'sandbox/'
 * @returns {{ root: string, path: string, name: string, type: string }}
 */
export function artifactRef(name, type, subPath = '') {
  const rel = subPath ? subPath.replace(/\/?$/, '/') : '';
  return { root: 'test', path: rel, name, type };
}

// ---------------------------------------------------------------------------
// FAL helpers
// ---------------------------------------------------------------------------

/**
 * Build a FAL string from an ArtifactRef.
 * @param {{ root: string, path: string, name: string, type: string }} ref
 * @returns {string}
 */
export function toFAL(ref) {
  return `forge://${ref.root}/${ref.path}${ref.name}.${ref.type}`;
}

// ---------------------------------------------------------------------------
// Sandbox utilities
// ---------------------------------------------------------------------------

/**
 * Return the absolute path of a sandbox file (does not create it).
 * @param {string} filename - e.g. 'write-test.md'
 * @returns {string}
 */
export function sandboxPath(filename) {
  return path.join(SANDBOX_DIR, filename);
}

/**
 * Create a sandbox file with given content.
 * @param {string} filename
 * @param {string} content
 * @returns {string} absolute path
 */
export function sandboxCreate(filename, content = '') {
  const p = sandboxPath(filename);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

/**
 * Delete a sandbox file if it exists. Silent if absent.
 * @param {string} filename
 */
export function sandboxClean(filename) {
  const p = sandboxPath(filename);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

/**
 * Read a sandbox file content.
 * @param {string} filename
 * @returns {string}
 */
export function sandboxRead(filename) {
  return fs.readFileSync(sandboxPath(filename), 'utf8');
}

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

export let failCount = 0;

export function test(name, fn) {
  try {
    const result = fn();
    if (result && typeof result.then === 'function') {
      throw new Error('Use testAsync for async tests');
    }
    console.log('PASS: ' + name);
  } catch (e) {
    console.log('FAIL: ' + name + ' -- ' + e.message);
    failCount++;
  }
}

export async function testAsync(name, fn) {
  try {
    await fn();
    console.log('PASS: ' + name);
  } catch (e) {
    console.log('FAIL: ' + name + ' -- ' + e.message);
    failCount++;
  }
}

export function summary() {
  console.log(`\n${failCount === 0 ? 'All tests passed' : `${failCount} test(s) failed`}`);
  process.exit(failCount > 0 ? 1 : 0);
}
