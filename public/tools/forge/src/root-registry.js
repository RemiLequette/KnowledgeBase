/**
 * root-registry.js
 *
 * RootRegistry — manages folder navigation and implements IRootRegistry.
 * Builds UrlRef objects from FAL strings and delegates to root handlers.
 * The sole authority on URL syntax — URLs never leave this module.
 *
 * References:
 *   - conventions/forge.md v7.0 [sections Key concepts, Root registry,
 *     IRootRegistry, Registry / Root registry]
 *   - conventions/tools.md [section Module Design Rules]
 *
 * Not yet in references: none
 */

import { log } from './logger.js';

// ---------------------------------------------------------------------------
// RootRegistry
// ---------------------------------------------------------------------------

/**
 * Manages folder navigation and implements IRootRegistry.
 * Builds UrlRef objects from FAL strings and delegates to root handlers.
 * Calls registerRoot on the file-root handler for each root at load time.
 */
export class RootRegistry {
  constructor() {
    /** @type {Map<string, { handler: object, root: object }>} rootName → {handler, root} */
    this.handlers = new Map();
    /** @type {object[]} raw roots config */
    this.roots = [];
  }

  async load(roots) {
    this.roots = roots;
    const cache = new Map();
    for (const root of roots) {
      if (!cache.has(root.handler)) {
        try {
          const mod = await import(root.handler);
          cache.set(root.handler, mod);
          // Populate rootBases on the file-root handler so refs without _url can be resolved
          if (mod.registerRoot) mod.registerRoot(root.name, root.url);
          log('INFO', `Root handler loaded: ${root.name}`);
        } catch (err) {
          log('ERROR', `Failed to load root handler for '${root.name}': ${err.message}`);
        }
      }
      this.handlers.set(root.name, { handler: cache.get(root.handler), root });
    }
  }

  // -------------------------------------------------------------------------
  // UrlRef construction
  // -------------------------------------------------------------------------

  _baseUrl(rootName) {
    const root = this.roots.find(r => r.name === rootName);
    if (!root) throw new Error(`Unknown root: '${rootName}'`);
    return root.url.endsWith('/') ? root.url : root.url + '/';
  }

  /**
   * Build a folder UrlRef from a folder FAL string.
   */
  _folderFALToUrlRef(fal) {
    if (!fal.startsWith('forge://')) throw new Error(`Invalid FAL: ${fal}`);
    const rest     = fal.slice('forge://'.length);
    const slashIdx = rest.indexOf('/');
    if (slashIdx === -1) throw new Error(`FAL has no path: ${fal}`);
    const rootName = rest.slice(0, slashIdx);
    const relPath  = rest.slice(slashIdx + 1);  // e.g. 'subdir/' or ''

    const baseUrl = this._baseUrl(rootName);
    const url     = baseUrl + relPath;

    // Decompose relPath into parent path + folder name
    const withoutTrailing = relPath.endsWith('/') ? relPath.slice(0, -1) : relPath;
    const lastSlash  = withoutTrailing.lastIndexOf('/');
    const folderName = lastSlash === -1 ? withoutTrailing : withoutTrailing.slice(lastSlash + 1);
    const parentPath = lastSlash === -1 ? '' : withoutTrailing.slice(0, lastSlash + 1);

    return { root: rootName, path: parentPath, name: folderName, extension: '', _url: url };
  }

  _urlToFolderFAL(url, rootName) {
    const baseUrl = this._baseUrl(rootName);
    if (!url.startsWith(baseUrl)) throw new Error(`URL not under root '${rootName}': ${url}`);
    return `forge://${rootName}/${url.slice(baseUrl.length)}`;
  }

  // -------------------------------------------------------------------------
  // Folder operations (called by Forge MCP tools)
  // -------------------------------------------------------------------------

  /**
   * List one level of a folder.
   * Returns raw entries — branding is Forge's responsibility.
   * @param {string} fal - folder FAL
   * @param {object} typeRegistry - used for type discovery only
   * @returns {Promise<Array<{ fal: string, type: string }>>}
   */
  async list(fal, typeRegistry) {
    const folderRef = this._folderFALToUrlRef(fal);
    const entry     = this.handlers.get(folderRef.root);
    if (!entry) throw new Error(`No root handler for: ${folderRef.root}`);

    const { folders, artifacts } = await entry.handler.list(folderRef);
    const result = [];

    for (const folderUrlRef of folders) {
      let folderFAL;
      if (folderUrlRef._url) {
        const urlWithSlash = folderUrlRef._url.endsWith('/') ? folderUrlRef._url : folderUrlRef._url + '/';
        folderFAL = this._urlToFolderFAL(urlWithSlash, folderRef.root);
      } else {
        folderFAL = `forge://${folderRef.root}/${folderUrlRef.path}${folderUrlRef.name}/`;
      }
      result.push({ fal: folderFAL, type: 'folder' });
    }

    for (const artifactUrlRef of artifacts) {
      const artifactRef = await typeRegistry.discover(artifactUrlRef, this);
      result.push({ artifactRef, type: artifactRef.type });
    }

    return result;
  }

  async mkdir(fal) {
    const ref   = this._folderFALToUrlRef(fal);
    const entry = this.handlers.get(ref.root);
    if (!entry) throw new Error(`No root handler for: ${ref.root}`);
    return entry.handler.mkdir(ref);
  }

  async rmdir(fal) {
    const ref   = this._folderFALToUrlRef(fal);
    const entry = this.handlers.get(ref.root);
    if (!entry) throw new Error(`No root handler for: ${ref.root}`);
    return entry.handler.rmdir(ref);
  }

  async mvdir(fal, targetFal) {
    const srcRef = this._folderFALToUrlRef(fal);
    const dstRef = this._folderFALToUrlRef(targetFal);
    if (srcRef.root !== dstRef.root) throw new Error('Cannot move folder across roots');
    const entry  = this.handlers.get(srcRef.root);
    if (!entry) throw new Error(`No root handler for: ${srcRef.root}`);
    return entry.handler.move(srcRef, dstRef);
  }

  async rndir(fal, name) {
    const ref   = this._folderFALToUrlRef(fal);
    const entry = this.handlers.get(ref.root);
    if (!entry) throw new Error(`No root handler for: ${ref.root}`);
    return entry.handler.rename(ref, name);
  }

  // -------------------------------------------------------------------------
  // IRootRegistry interface — called by type handlers with UrlRef objects
  // -------------------------------------------------------------------------

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
