// @forge-type: js-managed

// ====[ imports ]====

import fs from 'fs';
import { fileURLToPath } from 'url';
import { log } from './logger.js';
import { BRAND_MSG, RTFM_MSG } from './brand.js';

// ====[ class-open ]====

/**
 * TypeRegistry — manages artifact types, Brand registry, RTFM flags,
 * discovery, describe, and all artifact operations.
 *
 * Brand registry: session-scoped Set keyed by ref identity (root|path|name|type).
 *   - Populated by discover() (forge_ls) and createArtifact() (forge_create).
 *   - Checked by all operations that require Brand gate.
 *
 * RTFM flags: per-type described boolean, set by describe().
 *
 * Gate order: Brand checked first, RTFM second.
 * _checkGates(ref) enforces both in one call — used by all read/write operations.
 *
 * All block operations receive a fully-populated ArtifactRef — ref.block
 * carries the block/node path. No separate block parameter.
 *
 * References:
 *   - conventions/forge.md [sections Type discovery, Type handlers,
 *     Registry / Type registry, Brand principle, RTFM principle]
 */
export class TypeRegistry {
  constructor() {
    /** @type {Map<string, { handler: object, described: boolean, extension: string }>} */
    this.handlers = new Map();
    /** @type {string[][]} */
    this.discoveryGroups = [];
    /** @type {Set<string>} session-scoped Brand registry — keyed by ref identity */
    this._branded = new Set();
  }

// ====[ load ]====

  async load(typesUrl) {
    const typesPath = fileURLToPath(typesUrl);
    if (!fs.existsSync(typesPath)) throw new Error(`types file not found: ${typesPath}`);
    const registry = JSON.parse(fs.readFileSync(typesPath, 'utf8'));

    for (const [typeName, entry] of Object.entries(registry.types)) {
      if (this.handlers.has(typeName)) {
        throw new Error(`Type name collision: '${typeName}' is already registered`);
      }
      try {
        const mod       = await import(entry.handler);
        const result    = mod.initType ? await mod.initType({ name: typeName, ...entry }) : undefined;
        const handler   = (result && typeof result === 'object') ? result : mod;
        const extension = entry.extension ? '.' + entry.extension : '.' + typeName;
        this.handlers.set(typeName, { handler, described: false, extension });
        log('INFO', `Type handler loaded: ${typeName} v${entry.version} (ext: ${extension})`);
      } catch (err) {
        log('ERROR', `Failed to load handler for type '${typeName}': ${err.message}`);
      }
    }

    this.discoveryGroups = _buildDiscoveryGroups([...this.handlers.keys()]);
    log('INFO', `TypeRegistry loaded — ${this.handlers.size} types`);
  }

// ====[ brand ]====

  _brandKey(ref) {
    return `${ref.root}|${ref.path}|${ref.name}|${ref.type}`;
  }

  _brand(ref) {
    this._branded.add(this._brandKey(ref));
  }

  _checkBrand(ref) {
    if (!this._branded.has(this._brandKey(ref))) throw new Error(BRAND_MSG);
  }

  _checkRTFM(typeName) {
    if (!this.handlers.get(typeName)?.described) throw new Error(RTFM_MSG);
  }

  /** Brand + RTFM in order — required before any read/write operation. */
  _checkGates(ref) {
    this._checkBrand(ref);
    this._checkRTFM(ref.type);
  }

// ====[ ref-conversion ]====

  _toUrlRef(ref) {
    const entry = this._entry(ref.type);
    return { root: ref.root, path: ref.path, name: ref.name, extension: entry.extension };
  }

// ====[ helpers ]====

  _entry(typeName) {
    if (typeName === 'undefined') throw new Error('Operation not supported on undefined artifact type');
    const entry = this.handlers.get(typeName);
    if (!entry) throw new Error(`No handler registered for type: ${typeName}`);
    return entry;
  }

  isDescribed(typeName) {
    return this.handlers.get(typeName)?.described ?? false;
  }

// ====[ discover ]====

  /**
   * Discover the type of a UrlRef, brand the ArtifactRef, return it.
   * Called by ForgeSession.ls() for each artifact from rootRegistry.list().
   */
  async discover(urlRef, rootRegistry) {
    const claimed = [];

    for (const group of this.discoveryGroups) {
      for (const typeName of group) {
        const entry = this.handlers.get(typeName);
        if (entry.handler.claim && await entry.handler.claim(urlRef, rootRegistry)) {
          claimed.push(typeName);
          break;
        }
      }
    }

    if (claimed.length > 1) {
      throw new Error(`Multiple independent handlers claimed "${urlRef.name}${urlRef.extension}": ${claimed.join(', ')}`);
    }

    const type = claimed.length === 1 ? claimed[0] : 'undefined';
    const ref  = { root: urlRef.root, path: urlRef.path, name: urlRef.name, type, block: '' };
    this._brand(ref);
    return ref;
  }

// ====[ describe ]====

  describe(ref) {
    const entry  = this._entry(ref.type);
    const result = entry.handler.describe
      ? entry.handler.describe(this._toUrlRef(ref), null)
      : {
          recognition:  `A FAL ending with .${ref.type} is a plain-text file — full file access only, no named blocks.`,
          capabilities: { read: true, write: true, blocks: false },
          usage:        `forge_read(fal) returns the entire file content. forge_write(fal, content) replaces the entire file.`
        };
    entry.described = true;
    return result;
  }

// ====[ read ]====

  /** ref.block = block path ('' = full content). Requires Brand + RTFM. */
  async read(ref, rootRegistry) {
    this._checkGates(ref);
    const { handler } = this._entry(ref.type);
    return handler.readBlock(this._toUrlRef(ref), ref.block, rootRegistry);
  }

// ====[ write ]====

  /** ref.block = block path ('' = full content). Requires Brand + RTFM. */
  async write(ref, rootRegistry, content) {
    this._checkGates(ref);
    const { handler } = this._entry(ref.type);
    return handler.writeBlock(this._toUrlRef(ref), ref.block, content, rootRegistry);
  }

// ====[ ls ]====

  /** ref.block = node path ('' = root node). Requires Brand + RTFM. */
  async ls(ref, rootRegistry) {
    this._checkGates(ref);
    const { handler } = this._entry(ref.type);
    return handler.ls(this._toUrlRef(ref), ref.block, rootRegistry);
  }

// ====[ is-block ]====

  /** ref.block = target path. Requires Brand + RTFM. */
  async isBlock(ref, rootRegistry) {
    this._checkGates(ref);
    const { handler } = this._entry(ref.type);
    return handler.isBlock(this._toUrlRef(ref), ref.block, rootRegistry);
  }

// ====[ delete ]====

  /** Delete full artifact. Requires Brand + RTFM. */
  async deleteArtifact(ref, rootRegistry) {
    this._checkGates(ref);
    const { handler } = this._entry(ref.type);
    return handler.deleteArtifact(this._toUrlRef(ref), rootRegistry);
  }

  /** ref.block = block/node to delete. Requires Brand + RTFM. */
  async deleteBlock(ref, rootRegistry) {
    this._checkGates(ref);
    const { handler } = this._entry(ref.type);
    return handler.deleteBlock(this._toUrlRef(ref), ref.block, rootRegistry);
  }

// ====[ create ]====

  /** Create new empty artifact and brand it. */
  async createArtifact(ref, rootRegistry) {
    const { handler } = this._entry(ref.type);
    await handler.createArtifact(this._toUrlRef(ref), rootRegistry);
    this._brand(ref);
  }
}

// ====[ discovery-groups ]====

function _buildDiscoveryGroups(typeNames) {
  const typeSet = new Set(typeNames);

  function rootOf(name) {
    const segments = name.split('.');
    for (let i = segments.length - 1; i >= 1; i--) {
      const suffix = segments.slice(i).join('.');
      if (typeSet.has(suffix)) return suffix;
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
      const diff = b.split('.').length - a.split('.').length;
      return diff !== 0 ? diff : a.localeCompare(b);
    });
  }

  return [...groups.values()];
}
