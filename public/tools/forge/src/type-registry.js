// @forge-type: js-managed

// ====[ imports ]====

import fs from 'fs';
import { fileURLToPath } from 'url';
import { log } from './logger.js';
import { checkBrand, checkRTFM } from './brand.js';
import { toFAL } from './fal.js';

// ====[ class-open ]====

/**
 * Manages artifact types, discovery, describe, and artifact operations.
 * handlers Map: typeName → { handler: module, described: boolean, extension: string }
 *
 * Gates (Brand + RTFM) are enforced here on read/write — brand.js provides
 * the checks, fal.js provides toFAL for FAL reconstruction.
 *
 * References:
 *   - conventions/forge.md v7.0 [sections Key concepts, Type discovery,
 *     Type handlers, Registry / Type registry]
 */
export class TypeRegistry {
  constructor() {
    /** @type {Map<string, { handler: object, described: boolean, extension: string }>} */
    this.handlers = new Map();
    /** @type {string[]} type names sorted by specificity (descending segment count) */
    this.discoveryOrder = [];
  }

// ====[ load ]====

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
          extension: '.' + typeName
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

// ====[ ref-conversion ]====

  artifactRefToUrlRef(ref) {
    const entry = this._entry(ref.type);
    return { root: ref.root, path: ref.path, name: ref.name, extension: entry.extension };
  }

  urlRefToArtifactRef(urlRef) {
    const ext = (urlRef.extension || '').toLowerCase();
    for (const [typeName, entry] of this.handlers.entries()) {
      if (entry.extension.toLowerCase() === ext) {
        return { root: urlRef.root, path: urlRef.path, name: urlRef.name, type: typeName };
      }
    }
    return { root: urlRef.root, path: urlRef.path, name: urlRef.name, type: 'undefined' };
  }

// ====[ helpers ]====

  _entry(typeName) {
    if (typeName === 'undefined') throw new Error('Operation not supported on undefined artifact type');
    const entry = this.handlers.get(typeName);
    if (!entry) throw new Error(`No handler registered for type: ${typeName}`);
    return entry;
  }

// ====[ rtfm ]====

  isDescribed(typeName) {
    const entry = this.handlers.get(typeName);
    return entry ? entry.described : false;
  }

// ====[ discover ]====

  /**
   * Discover the type of a UrlRef and return an ArtifactRef.
   *
   * Discovery runs in two phases per handler:
   *   1. Extension pre-filter — skip handlers whose registered extension
   *      does not match urlRef.extension. This prevents a generic handler
   *      (e.g. plain-text claiming .css) from shadowing the correct one (md).
   *   2. claim(urlRef, rootRegistry) — handler may inspect content (shebang etc.)
   *
   * Does NOT touch the Brand registry — caller (mcp-tools) is responsible.
   */
  async discover(urlRef, rootRegistry) {
    const ext = (urlRef.extension || '').toLowerCase();
    for (const typeName of this.discoveryOrder) {
      const entry = this.handlers.get(typeName);
      // Pre-filter: skip if registered extension does not match
      if (entry.extension.toLowerCase() !== ext) continue;
      if (entry.handler.claim && entry.handler.claim(urlRef, rootRegistry)) {
        return { root: urlRef.root, path: urlRef.path, name: urlRef.name, type: typeName };
      }
    }
    return { root: urlRef.root, path: urlRef.path, name: urlRef.name, type: 'undefined' };
  }

// ====[ describe ]====

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

// ====[ read ]====

  /**
   * Read an artifact block. Enforces Brand + RTFM gates.
   * @param {{ root, path, name, type }} ref - ArtifactRef
   * @param {object} rootRegistry
   * @param {string} [block='']
   */
  async read(ref, rootRegistry, block = '') {
    checkBrand(toFAL(ref));
    checkRTFM(ref.type, this);
    const { handler } = this._entry(ref.type);
    const urlRef = this.artifactRefToUrlRef(ref);
    return handler.readBlock(urlRef, block, rootRegistry);
  }

// ====[ write ]====

  /**
   * Write an artifact block. Enforces Brand + RTFM gates.
   * @param {{ root, path, name, type }} ref - ArtifactRef
   * @param {object} rootRegistry
   * @param {string} block
   * @param {string} content
   */
  async write(ref, rootRegistry, block, content) {
    checkBrand(toFAL(ref));
    checkRTFM(ref.type, this);
    const { handler } = this._entry(ref.type);
    const urlRef = this.artifactRefToUrlRef(ref);
    return handler.writeBlock(urlRef, block, content, rootRegistry);
  }

// ====[ create ]====

  async createArtifact(ref, rootRegistry) {
    const { handler } = this._entry(ref.type);
    const urlRef = this.artifactRefToUrlRef(ref);
    return handler.createArtifact(urlRef, rootRegistry);
  }
}
