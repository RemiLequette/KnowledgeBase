/**
 * type-registry.js
 *
 * TypeRegistry — manages artifact types, type discovery, describe,
 * and artifact read/write/create operations.
 *
 * All public methods work with ArtifactRef objects.
 * Brand and RTFM gates are handled by Forge (brand.js) — not here.
 * described flag is set by describe(), read via isDescribed().
 *
 * References:
 *   - conventions/forge.md v7.0 [sections Key concepts, Type discovery,
 *     Type handlers, Registry / Type registry]
 *   - conventions/tools.md [section Module Design Rules]
 *
 * Not yet in references: none
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { log } from './logger.js';

// ---------------------------------------------------------------------------
// TypeRegistry
// ---------------------------------------------------------------------------

/**
 * Manages artifact types, discovery, describe, and artifact operations.
 * handlers Map: typeName → { handler: module, described: boolean, extension: string }
 */
export class TypeRegistry {
  constructor() {
    /** @type {Map<string, { handler: object, described: boolean, extension: string }>} */
    this.handlers = new Map();
    /** @type {string[]} type names sorted by specificity (descending segment count) */
    this.discoveryOrder = [];
  }

  /**
   * Load handlers from the types JSON file.
   * @param {string} typesUrl - file:// URL of the types JSON
   */
  async load(typesUrl) {
    const typesPath = fileURLToPath(typesUrl);
    if (!fs.existsSync(typesPath)) throw new Error(`types file not found: ${typesPath}`);
    const registry = JSON.parse(fs.readFileSync(typesPath, 'utf8'));

    for (const [typeName, entry] of Object.entries(registry.types)) {
      try {
        const mod = await import(entry.handler);
        this.handlers.set(typeName, {
          handler:   mod,
          described: false,
          extension: '.' + typeName   // 'md' → '.md', 'js' → '.js', etc.
        });
        log('INFO', `Type handler loaded: ${typeName} v${entry.version}`);
      } catch (err) {
        log('ERROR', `Failed to load handler for type '${typeName}': ${err.message}`);
      }
    }

    this.discoveryOrder = [...this.handlers.keys()].sort((a, b) => {
      const segA = a.split('-').length;
      const segB = b.split('-').length;
      if (segB !== segA) return segB - segA;
      return a.localeCompare(b);
    });

    log('INFO', `TypeRegistry loaded — ${this.handlers.size} types, order: ${this.discoveryOrder.join(', ')}`);
  }

  // -------------------------------------------------------------------------
  // ArtifactRef ↔ UrlRef conversion
  // -------------------------------------------------------------------------

  /**
   * Convert an ArtifactRef to a UrlRef using the stored extension for the type.
   * @param {{ root: string, path: string, name: string, type: string }} ref
   * @returns {{ root: string, path: string, name: string, extension: string }}
   */
  artifactRefToUrlRef(ref) {
    const entry = this._entry(ref.type);
    return { root: ref.root, path: ref.path, name: ref.name, extension: entry.extension };
  }

  /**
   * Convert a UrlRef to an ArtifactRef by matching extension to a handler.
   * @param {{ root: string, path: string, name: string, extension: string }} urlRef
   * @returns {{ root: string, path: string, name: string, type: string }}
   */
  urlRefToArtifactRef(urlRef) {
    const ext = (urlRef.extension || '').toLowerCase();
    for (const [typeName, entry] of this.handlers.entries()) {
      if (entry.extension.toLowerCase() === ext) {
        return { root: urlRef.root, path: urlRef.path, name: urlRef.name, type: typeName };
      }
    }
    return { root: urlRef.root, path: urlRef.path, name: urlRef.name, type: 'undefined' };
  }

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  _entry(typeName) {
    if (typeName === 'undefined') throw new Error('Operation not supported on undefined artifact type');
    const entry = this.handlers.get(typeName);
    if (!entry) throw new Error(`No handler registered for type: ${typeName}`);
    return entry;
  }

  // -------------------------------------------------------------------------
  // RTFM — described flag (read-only from outside)
  // -------------------------------------------------------------------------

  /**
   * Return true if forge_describe has been called for this type in the session.
   * @param {string} typeName
   * @returns {boolean}
   */
  isDescribed(typeName) {
    const entry = this.handlers.get(typeName);
    return entry ? entry.described : false;
  }

  // -------------------------------------------------------------------------
  // Type discovery (called by Forge during forge_ls)
  // -------------------------------------------------------------------------

  /**
   * Discover the type of a UrlRef and return an ArtifactRef.
   * Does NOT touch the Brand registry — caller (Forge) is responsible for branding.
   * @param {{ root: string, path: string, name: string, extension: string }} urlRef
   * @param {object} rootRegistry - available for content inspection
   * @returns {Promise<{ root: string, path: string, name: string, type: string }>}
   */
  async discover(urlRef, rootRegistry) {
    for (const typeName of this.discoveryOrder) {
      const { handler } = this.handlers.get(typeName);
      if (handler.claim && handler.claim(urlRef, rootRegistry)) {
        return { root: urlRef.root, path: urlRef.path, name: urlRef.name, type: typeName };
      }
    }
    return { root: urlRef.root, path: urlRef.path, name: urlRef.name, type: 'undefined' };
  }

  // -------------------------------------------------------------------------
  // describe — sets described=true for the type
  // -------------------------------------------------------------------------

  /**
   * Describe the type of an artifact. Sets described=true for the type.
   * @param {{ root: string, path: string, name: string, type: string }} ref - ArtifactRef
   * @returns {{ recognition: string, capabilities: object, usage: string }}
   */
  describe(ref) {
    const entry = this._entry(ref.type);

    let result;
    if (entry.handler.describe) {
      result = entry.handler.describe(this.artifactRefToUrlRef(ref), null);
    } else {
      result = {
        recognition:  `A FAL ending with .${ref.type} is a plain-text file — full file access only, no named blocks.`,
        capabilities: { read: true, write: true, blocks: false },
        usage:        `forge_read(fal) returns the entire file content. forge_write(fal, content) replaces the entire file.`
      };
    }

    entry.described = true;
    return result;
  }

  // -------------------------------------------------------------------------
  // Artifact operations — no gates (gates are Forge's responsibility)
  // -------------------------------------------------------------------------

  /**
   * Read an artifact block.
   * @param {{ root, path, name, type }} ref - ArtifactRef
   * @param {object} rootRegistry
   * @param {string} [block='']
   */
  async read(ref, rootRegistry, block = '') {
    const { handler } = this._entry(ref.type);
    const urlRef = this.artifactRefToUrlRef(ref);
    return handler.readBlock(urlRef, block, rootRegistry);
  }

  /**
   * Write an artifact block.
   * @param {{ root, path, name, type }} ref - ArtifactRef
   * @param {object} rootRegistry
   * @param {string} block
   * @param {string} content
   */
  async write(ref, rootRegistry, block, content) {
    const { handler } = this._entry(ref.type);
    const urlRef = this.artifactRefToUrlRef(ref);
    return handler.writeBlock(urlRef, block, content, rootRegistry);
  }

  /**
   * Create an artifact.
   * @param {{ root, path, name, type }} ref - ArtifactRef
   * @param {object} rootRegistry
   */
  async createArtifact(ref, rootRegistry) {
    const { handler } = this._entry(ref.type);
    const urlRef = this.artifactRefToUrlRef(ref);
    return handler.createArtifact(urlRef, rootRegistry);
  }
}
