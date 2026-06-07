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
 * handlers Map: typeName → { handler: object, described: boolean, extension: string }
 *
 * The physical file extension stored per handler entry is derived from:
 *   entry.extension (if present in forge-types.json) — allows js-managed to map to .js
 *   '.' + typeName  (default fallback)
 *
 * Gates (Brand + RTFM) are enforced here on read/write — brand.js provides
 * the checks, fal.js provides toFAL for FAL reconstruction.
 *
 * Handler resolution:
 *   If mod.init returns an object (factory pattern), that object is used as the handler.
 *   If mod.init returns undefined (side-effect pattern), mod itself is used.
 *   If mod has no init, mod is used directly (plain-text pattern).
 *
 * References:
 *   - conventions/forge.md v7.1 [sections Key concepts, Type discovery,
 *     Type handlers, Registry / Type registry]
 */
export class TypeRegistry {
  constructor() {
    /** @type {Map<string, { handler: object, described: boolean, extension: string }>} */
    this.handlers = new Map();
    /** @type {string[][]} type names grouped by hierarchy, each group sorted most-specific first */
    this.discoveryGroups = [];
  }

// ====[ load ]====

  async load(typesUrl) {
    const typesPath = fileURLToPath(typesUrl);
    if (!fs.existsSync(typesPath)) throw new Error(`types file not found: ${typesPath}`);
    const registry = JSON.parse(fs.readFileSync(typesPath, 'utf8'));

    for (const [typeName, entry] of Object.entries(registry.types)) {
      // @convention conventions/forge.md [section Registry / Collision rule]
      if (this.handlers.has(typeName)) {
        throw new Error(`Type name collision: '${typeName}' is already registered`);
      }
      try {
        const mod       = await import(entry.handler);
        const result    = mod.init ? await mod.init({ name: typeName, ...entry }) : undefined;
        const handler   = (result && typeof result === 'object') ? result : mod;
        // Physical file extension: explicit entry.extension takes precedence over typeName
        const extension = entry.extension ? '.' + entry.extension : '.' + typeName;
        this.handlers.set(typeName, { handler, described: false, extension });
        log('INFO', `Type handler loaded: ${typeName} v${entry.version} (ext: ${extension})`);
      } catch (err) {
        log('ERROR', `Failed to load handler for type '${typeName}': ${err.message}`);
      }
    }

    this.discoveryGroups = _buildDiscoveryGroups([...this.handlers.keys()]);

    log('INFO', `TypeRegistry loaded — ${this.handlers.size} types, groups: ${this.discoveryGroups.map(g => '[' + g.join(',') + ']').join(' ')}`);
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
   * Discovery runs per hierarchy group:
   *   - Within a hierarchy (e.g. js-managed, js): stop at first claim.
   *     More specific handlers are evaluated first (more segments = more specific).
   *   - Between independent hierarchies: all groups are evaluated.
   *   - More than one group claims the same UrlRef → error.
   *
   * claim() may be async — always awaited.
   *
   * Does NOT touch the Brand registry — caller (mcp-tools) is responsible.
   *
   * @convention conventions/forge.md [section Type discovery]
   */
  async discover(urlRef, rootRegistry) {
    const claimed = [];

    for (const group of this.discoveryGroups) {
      for (const typeName of group) {
        const entry = this.handlers.get(typeName);
        if (entry.handler.claim && await entry.handler.claim(urlRef, rootRegistry)) {
          claimed.push(typeName);
          break; // stop within this hierarchy
        }
      }
    }

    if (claimed.length === 0) {
      return { root: urlRef.root, path: urlRef.path, name: urlRef.name, type: 'undefined' };
    }
    if (claimed.length > 1) {
      throw new Error(`Multiple independent handlers claimed "${urlRef.name}${urlRef.extension}": ${claimed.join(', ')}`);
    }
    return { root: urlRef.root, path: urlRef.path, name: urlRef.name, type: claimed[0] };
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

// ====[ discovery-groups ]====

/**
 * Build discovery groups from a list of type names.
 *
 * Types sharing a common prefix form a hierarchy (e.g. "js" and "js-managed").
 * A type B is in the hierarchy of type A if B starts with A + "-".
 * Within a group, types are sorted most-specific first (descending segment count).
 * Groups are independent hierarchies — all evaluated during discovery.
 *
 * @param {string[]} typeNames
 * @returns {string[][]} array of groups, each group sorted most-specific first
 */
function _buildDiscoveryGroups(typeNames) {
  function rootOf(name) {
    const segments = name.split('-');
    for (let i = 1; i < segments.length; i++) {
      const prefix = segments.slice(0, i).join('-');
      if (typeNames.includes(prefix)) return prefix;
    }
    return name;
  }

  const groups = new Map();
  for (const name of typeNames) {
    const root = rootOf(name);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(name);
  }

  for (const group of groups.values()) {
    group.sort((a, b) => {
      const diff = b.split('-').length - a.split('-').length;
      return diff !== 0 ? diff : a.localeCompare(b);
    });
  }

  return [...groups.values()];
}
