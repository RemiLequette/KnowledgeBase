// @forge-type: js-managed

// ====[ imports ]====

import { getLogger } from './logger.js';

const log = getLogger('forge:root-registry');

// ====[ class-open ]====

/**
 * RootRegistry — manages folder navigation and implements IRootRegistry.
 * All public methods receive a ref (parsed by mcp-tools.js at the MCP boundary).
 * The sole authority on URL syntax — URLs never leave this module.
 *
 * References:
 *   - conventions/forge.md v0.5 [sections Key concepts, Root registry,
 *     IRootRegistry, Registry / Root registry]
 */
export class RootRegistry {
  constructor() {
    /** @type {Map<string, { handler: object, root: object }>} rootName → {handler, root} */
    this.handlers = new Map();
    /** @type {object[]} raw roots config */
    this.roots = [];
  }

// ====[ load ]====

  async load(roots) {
    this.roots = roots;
    const cache = new Map();
    for (const root of roots) {
      if (!cache.has(root.handler)) {
        try {
          const mod = await import(root.handler);
          cache.set(root.handler, mod);
          if (mod.registerRoot) mod.registerRoot(root.name, root.url);
          log.info({ root: root.name }, 'Root handler loaded');
        } catch (err) {
          log.error({ root: root.name, err }, 'Failed to load root handler');
        }
      }
      this.handlers.set(root.name, { handler: cache.get(root.handler), root });
    }
  }

// ====[ url-helpers ]====

  _baseUrl(rootName) {
    const root = this.roots.find(r => r.name === rootName);
    if (!root) throw new Error(`Unknown root: '${rootName}'`);
    return root.url.endsWith('/') ? root.url : root.url + '/';
  }

  _refToUrlRef(ref) {
    const baseUrl = this._baseUrl(ref.root);
    const url     = baseUrl + ref.path + (ref.name ? ref.name + (ref.extension || '') : '');
    return { ...ref, _url: url + (ref.name ? '' : '/') };
  }

  rootRefs() {
    return [...this.handlers.keys()].map(name => ({ root: name, path: '', name: '', type: '' }));
  }

// ====[ folder-operations ]====

  async list(ref) {
    const folderUrlRef = this._refToUrlRef(ref);
    const entry        = this.handlers.get(ref.root);
    if (!entry) throw new Error(`No root handler for: ${ref.root}`);
    return entry.handler.list(folderUrlRef);
  }

  async mkdir(ref) {
    const urlRef = this._refToUrlRef(ref);
    const entry  = this.handlers.get(ref.root);
    if (!entry) throw new Error(`No root handler for: ${ref.root}`);
    return entry.handler.mkdir(urlRef);
  }

  async rmdir(ref) {
    const urlRef = this._refToUrlRef(ref);
    const entry  = this.handlers.get(ref.root);
    if (!entry) throw new Error(`No root handler for: ${ref.root}`);
    return entry.handler.rmdir(urlRef);
  }

  async mvdir(ref, targetRef) {
    if (ref.root !== targetRef.root) throw new Error('Cannot move folder across roots');
    const srcUrlRef = this._refToUrlRef(ref);
    const dstUrlRef = this._refToUrlRef(targetRef);
    const entry     = this.handlers.get(ref.root);
    if (!entry) throw new Error(`No root handler for: ${ref.root}`);
    return entry.handler.move(srcUrlRef, dstUrlRef);
  }

  async rndir(ref, name) {
    const urlRef = this._refToUrlRef(ref);
    const entry  = this.handlers.get(ref.root);
    if (!entry) throw new Error(`No root handler for: ${ref.root}`);
    return entry.handler.rename(urlRef, name);
  }

// ====[ iroot-registry ]====

  async create(urlRef) {
    const entry = this.handlers.get(urlRef.root);
    if (!entry) throw new Error(`No root handler for: ${urlRef.root}`);
    return entry.handler.create(urlRef);
  }

  async read(urlRef) {
    const entry = this.handlers.get(urlRef.root);
    if (!entry) throw new Error(`No root handler for: ${urlRef.root}`);
    return entry.handler.read(urlRef);
  }

  async write(urlRef, content) {
    const entry = this.handlers.get(urlRef.root);
    if (!entry) throw new Error(`No root handler for: ${urlRef.root}`);
    return entry.handler.write(urlRef, content);
  }

  async delete(urlRef) {
    const entry = this.handlers.get(urlRef.root);
    if (!entry) throw new Error(`No root handler for: ${urlRef.root}`);
    return entry.handler.delete(urlRef);
  }
}
