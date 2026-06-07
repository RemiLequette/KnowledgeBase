// @forge-type: js-managed

// ====[ imports ]====

import { log } from './logger.js';

// ====[ class-open ]====

/**
 * RootRegistry — manages folder navigation and implements IRootRegistry.
 * All public methods receive a ref (parsed by mcp-tools.js at the MCP boundary).
 * The sole authority on URL syntax — URLs never leave this module.
 *
 * References:
 *   - conventions/forge.md v7.0 [sections Key concepts, Root registry,
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
          log('INFO', `Root handler loaded: ${root.name}`);
        } catch (err) {
          log('ERROR', `Failed to load root handler for '${root.name}': ${err.message}`);
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

  /**
   * Build a UrlRef from a parsed ref and the root base URL.
   * For folder refs (name === ''), returns a folder UrlRef.
   * For artifact refs, returns an artifact UrlRef.
   */
  _refToUrlRef(ref) {
    const baseUrl = this._baseUrl(ref.root);
    const url     = baseUrl + ref.path + (ref.name ? ref.name + (ref.extension || '') : '');
    return { ...ref, _url: url + (ref.name ? '' : '/') };
  }

  _urlToFolderFAL(url, rootName) {
    const baseUrl = this._baseUrl(rootName);
    if (!url.startsWith(baseUrl)) throw new Error(`URL not under root '${rootName}': ${url}`);
    return `forge://${rootName}/${url.slice(baseUrl.length)}`;
  }

// ====[ folder-operations ]====

  /**
   * List one level of a folder.
   * @param {{ root: string, path: string, name: string, type: string }} ref — folder ref (name === '')
   * @param {object} typeRegistry — used for type discovery
   * @returns {Promise<Array<{ fal: string, type: string, artifactRef?: object }>>}
   */
  async list(ref, typeRegistry) {
    const folderUrlRef = this._refToUrlRef(ref);
    const entry        = this.handlers.get(ref.root);
    if (!entry) throw new Error(`No root handler for: ${ref.root}`);

    const { folders, artifacts } = await entry.handler.list(folderUrlRef);
    const result = [];

    for (const folderUrlRef of folders) {
      let folderFAL;
      if (folderUrlRef._url) {
        const urlWithSlash = folderUrlRef._url.endsWith('/') ? folderUrlRef._url : folderUrlRef._url + '/';
        folderFAL = this._urlToFolderFAL(urlWithSlash, ref.root);
      } else {
        folderFAL = `forge://${ref.root}/${folderUrlRef.path}${folderUrlRef.name}/`;
      }
      result.push({ fal: folderFAL, type: 'folder' });
    }

    for (const artifactUrlRef of artifacts) {
      const artifactRef = await typeRegistry.discover(artifactUrlRef, this);
      result.push({ artifactRef, type: artifactRef.type });
    }

    return result;
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
