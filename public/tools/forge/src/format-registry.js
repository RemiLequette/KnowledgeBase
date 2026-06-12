/**
 * format-registry.js
 *
 * Format registry — loads forge-formats.json, instantiates handlers,
 * and dispatches forge_read/write/create calls by format.
 *
 * References:
 *   - conventions/forge.md v0.6 [sections Format registry, Dispatch flow]
 */

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

export class FormatRegistry {
  constructor() {
    /**
     * extension → [ { name, runHandler } ]  (declaration order preserved)
     * @type {Map<string, Array<{ name: string, runHandler: object }>>}
     */
    this.byExtension = new Map();

    /**
     * formatName → runHandler  (for forge_create lookup)
     * @type {Map<string, object>}
     */
    this.byName = new Map();
  }

  // -------------------------------------------------------------------------
  // load() — build time
  // -------------------------------------------------------------------------

  async load(configPath) {
    if (!fs.existsSync(configPath)) {
      throw new Error(`forge-formats.json not found: ${configPath}`);
    }

    const raw    = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(raw);
    const dir    = path.dirname(configPath);

    // F5: load extensions — instantiate SyntaxAdapters
    const adapters = new Map();
    for (const [ext, entry] of Object.entries(config.extensions ?? {})) {
      if (!entry.syntaxAdapter) throw new Error(`Extension "${ext}" is missing required field "syntaxAdapter"`);
      const adapterUrl = pathToFileURL(path.resolve(dir, entry.syntaxAdapter)).href;
      const mod        = await import(adapterUrl);
      if (typeof mod.initAdapter !== 'function') {
        throw new Error(`SyntaxAdapter for "${ext}" does not export initAdapter()`);
      }
      adapters.set(ext, await mod.initAdapter());
    }

    for (const [formatKey, entry] of Object.entries(config.formats ?? {})) {
      // F1: skip primitives — no handler, not registered
      if (entry.primitive) continue;

      const formatName = entry.name ?? formatKey;
      const ext        = entry.fileNameExtension;

      // F3: skip reusable types — no fileNameExtension, not registered by extension
      if (!ext) continue;

      // F4: formats with extends must not declare a handler — build error
      if (entry.extends && entry.handler) {
        throw new Error(`Format "${formatKey}" declares both "extends" and "handler" — handlers are inherited, not declared on derived formats`);
      }

      // F6: fileNameExtension must be declared in extensions block
      if (!adapters.has(ext)) {
        throw new Error(`Format "${formatKey}" references extension "${ext}" which is not declared in the extensions block`);
      }

      if (!entry.handler) throw new Error(`Format "${formatKey}" is missing required field "handler"`);

      // Duplicate name check within same extension
      const existing = this.byExtension.get(ext) ?? [];
      if (existing.some(e => e.name === formatName)) {
        throw new Error(`Duplicate format name "${formatName}" for extension ".${ext}"`);
      }

      // Load handler module and instantiate run handler
      const handlerUrl = pathToFileURL(path.resolve(dir, entry.handler)).href;
      const mod        = await import(handlerUrl);
      if (typeof mod.initFormat !== 'function') {
        throw new Error(`Handler for "${formatKey}" does not export initFormat()`);
      }

      const runHandler = await mod.initFormat({ ...entry, name: formatName }, adapters.get(ext));

      // Register by extension (declaration order)
      if (!this.byExtension.has(ext)) this.byExtension.set(ext, []);
      this.byExtension.get(ext).push({ name: formatName, runHandler });

      // Register by name (global — names must be unique across all extensions)
      this.byName.set(formatName, runHandler);
    }
  }

  // -------------------------------------------------------------------------
  // formatsForExtension() — test helper + internal use
  // -------------------------------------------------------------------------

  formatsForExtension(ext) {
    return this.byExtension.get(ext) ?? [];
  }

  // -------------------------------------------------------------------------
  // dispatch() — claim loop (run time)
  // -------------------------------------------------------------------------

  async dispatch(ext, rawContent) {
    const handlers = this.byExtension.get(ext);
    if (!handlers) return null;

    for (const { runHandler } of handlers) {
      if (await runHandler.claim(rawContent)) return runHandler;
    }

    return null; // native fallback — caller's responsibility
  }

  // -------------------------------------------------------------------------
  // getByName() — forge_create lookup
  // -------------------------------------------------------------------------

  getByName(formatName) {
    return this.byName.get(formatName) ?? null;
  }

  // -------------------------------------------------------------------------
  // describe() — registry listing for forge://registry
  // -------------------------------------------------------------------------

  describe() {
    const extensions = {};
    for (const [ext, handlers] of this.byExtension) {
      const formats = {};
      for (const { name, runHandler } of handlers) {
        formats[name] = runHandler.describe();
      }
      extensions[ext] = { formats };
    }
    return { extensions };
  }
}
