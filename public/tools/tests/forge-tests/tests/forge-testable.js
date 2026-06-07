/**
 * forge-testable.js
 *
 * Re-exports TypeRegistry and RootRegistry from forge.js for unit testing.
 * Also provides a minimal test config pointing to the real forge-types.json
 * and a fixtures folder as a test root.
 *
 * References:
 *   - conventions/forge.md [section Registry]
 *   - conventions/forge.md [section RTFM principle]
 *   - conventions/forge.md [section Brand principle]
 *
 * Not yet in references:
 *   - TypeRegistry and RootRegistry are not exported from forge.js — this shim
 *     duplicates them minimally so tests can instantiate them directly.
 *     Once forge.js exports them, this file should import from there instead.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FORGE_DIR = path.join(__dirname, '..');
const FIXTURES_DIR = path.join(__dirname, 'fixtures');

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

export class TypeRegistry {
  constructor() {
    this.handlers = new Map();
    this.discoveryOrder = [];
    this.brandRegistry = new Set();
  }

  async load(typesUrl) {
    const typesPath = fileURLToPath(typesUrl);
    if (!fs.existsSync(typesPath)) throw new Error(`types file not found: ${typesPath}`);
    const registry = JSON.parse(fs.readFileSync(typesPath, 'utf8'));
    for (const [typeName, entry] of Object.entries(registry.types)) {
      const mod = await import(entry.handler);
      this.handlers.set(typeName, { handler: mod, described: false });
    }
    this.discoveryOrder = [...this.handlers.keys()].sort((a, b) => {
      const segA = a.split('-').length;
      const segB = b.split('-').length;
      if (segB !== segA) return segB - segA;
      return a.localeCompare(b);
    });
  }

  _baseUrl(rootName, roots) {
    const root = roots.find(r => r.name === rootName);
    if (!root) throw new Error(`Unknown root: '${rootName}'`);
    return root.url.endsWith('/') ? root.url : root.url + '/';
  }

  _parseFAL(fal) {
    if (!fal.startsWith('forge://')) throw new Error(`Invalid FAL: ${fal}`);
    const rest = fal.slice('forge://'.length);
    const slashIdx = rest.indexOf('/');
    if (slashIdx === -1) throw new Error(`FAL has no path: ${fal}`);
    const rootName = rest.slice(0, slashIdx);
    const afterRoot = rest.slice(slashIdx + 1);
    const hashIdx = afterRoot.indexOf('#');
    const pathPart = hashIdx === -1 ? afterRoot : afterRoot.slice(0, hashIdx);
    const blockPath = hashIdx === -1 ? '' : afterRoot.slice(hashIdx + 1);
    const lastSlash = pathPart.lastIndexOf('/');
    const folderPath = lastSlash === -1 ? '' : pathPart.slice(0, lastSlash + 1);
    const falName = lastSlash === -1 ? pathPart : pathPart.slice(lastSlash + 1);
    const dotIdx = falName.lastIndexOf('.');
    if (dotIdx === -1) throw new Error(`FAL name has no type extension: ${falName}`);
    const typeName = falName.slice(dotIdx + 1);
    return { rootName, folderPath, falName, typeName, blockPath };
  }

  _entry(typeName) {
    if (typeName === 'unknown') throw new Error('Operation not supported on unknown artifact type');
    const entry = this.handlers.get(typeName);
    if (!entry) throw new Error(`No handler registered for type: ${typeName}`);
    return entry;
  }

  _checkRTFM(typeName) {
    const entry = this._entry(typeName);
    if (!entry.described) {
      throw new Error(`Call forge_describe(fal) first — RTFM: no read or write before the type is understood.`);
    }
  }

  _checkBrand(fal) {
    if (!this.brandRegistry.has(fal)) {
      throw new Error(`This FAL was not issued by Forge — call forge_ls to obtain a valid FAL.`);
    }
  }

  brandRegister(fal) { this.brandRegistry.add(fal); }

  describe(fal, force = false) {
    const { typeName } = this._parseFAL(fal);
    const entry = this._entry(typeName);
    if (force) entry.described = false;
    let result;
    if (entry.handler.describe) {
      result = entry.handler.describe();
    } else {
      result = {
        recognition: `A FAL ending with .${typeName} is a plain-text file — full file access only, no named blocks.`,
        capabilities: { read: true, write: true, blocks: false },
        usage: `forge_read(fal) returns the entire file content. forge_write(fal, content) replaces the entire file.`
      };
    }
    entry.described = true;
    return result;
  }

  discover(url, rootName, folderPath) {
    for (const typeName of this.discoveryOrder) {
      const { handler } = this.handlers.get(typeName);
      if (handler.claim && handler.claim(url, typeName)) {
        const falName = handler.urlToFAL(url);
        const fal = `forge://${rootName}/${folderPath}${falName}`;
        this.brandRegistry.add(fal);
        return fal;
      }
    }
    const filename = path.basename(fileURLToPath(url));
    const fal = `forge://${rootName}/${folderPath}${filename}.unknown`;
    this.brandRegistry.add(fal);
    return fal;
  }

  async read(fal, roots, block = '') {
    const { rootName, folderPath, falName, typeName } = this._parseFAL(fal);
    this._checkRTFM(typeName);
    this._checkBrand(fal);
    const { handler } = this._entry(typeName);
    const baseUrl = this._baseUrl(rootName, roots);
    const url = handler.falToURL(falName, baseUrl + folderPath);
    return handler.readBlock(url, block);
  }

  async write(fal, roots, block, content) {
    const { rootName, folderPath, falName, typeName } = this._parseFAL(fal);
    this._checkRTFM(typeName);
    this._checkBrand(fal);
    const { handler } = this._entry(typeName);
    const baseUrl = this._baseUrl(rootName, roots);
    const url = handler.falToURL(falName, baseUrl + folderPath);
    return handler.writeBlock(url, block, content);
  }
}

export class RootRegistry {
  constructor() { this.handlers = new Map(); }

  async load(roots) {
    const cache = new Map();
    for (const root of roots) {
      if (!cache.has(root.handler)) {
        const mod = await import(root.handler);
        cache.set(root.handler, mod);
      }
      this.handlers.set(root.name, cache.get(root.handler));
    }
  }

  _baseUrl(rootName, roots) {
    const root = roots.find(r => r.name === rootName);
    if (!root) throw new Error(`Unknown root: '${rootName}'`);
    return root.url.endsWith('/') ? root.url : root.url + '/';
  }

  _falToUrl(fal, roots) {
    const rest = fal.slice('forge://'.length);
    const slashIdx = rest.indexOf('/');
    const rootName = rest.slice(0, slashIdx);
    const relPath = rest.slice(slashIdx + 1);
    return { rootName, url: this._baseUrl(rootName, roots) + relPath };
  }

  _urlToFal(url, rootName, roots) {
    const baseUrl = this._baseUrl(rootName, roots);
    return `forge://${rootName}/${url.slice(baseUrl.length)}`;
  }

  async list(fal, roots, typeRegistry) {
    const { rootName, url } = this._falToUrl(fal, roots);
    const handler = this.handlers.get(rootName);
    if (!handler) throw new Error(`No root handler for: ${rootName}`);
    const entries = handler.list(url);
    const baseUrl = this._baseUrl(rootName, roots);
    const folderRelPath = url.slice(baseUrl.length);
    return entries.map(entry => {
      if (entry.isFolder) {
        const folderFal = this._urlToFal(entry.url, rootName, roots);
        typeRegistry.brandRegister(folderFal);
        return { fal: folderFal, type: 'folder' };
      }
      const artifactFal = typeRegistry.discover(entry.url, rootName, folderRelPath);
      return { fal: artifactFal, type: artifactFal.split('.').pop() };
    });
  }
}
