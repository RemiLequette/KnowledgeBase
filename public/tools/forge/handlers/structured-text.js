// @forge-type: js-managed

// ====[ imports ]====

// (none)

// ====[ init ]====

/**
 * structured-text.js
 *
 * Generic type handler — factory pattern.
 * init(entry) returns a handler object with a closure on the type configuration.
 * One handler object per type name — no shared mutable state.
 *
 * v2.0 — shebang claim strategy + shebang strip/restore on read/write/create.
 *
 * Configuration via init(entry):
 *   entry.name        — type name
 *   entry.description — optional human-readable description for forge_describe
 *   entry.shebang     — optional shebang string (e.g. "// @forge-type: js-managed")
 *                       If present: claim = extension match AND first line === shebang
 *                       If absent:  claim = extension match only (sync)
 *
 * Shebang contract:
 *   readBlock("")      — returns content WITHOUT the shebang line
 *   writeBlock("", c)  — prepends shebang + newline before writing
 *   createArtifact     — creates file with shebang + newline as initial content
 *                        (create via rootRegistry.create, then write shebang via rootRegistry.write)
 *
 * References:
 *   - conventions/forge.md v7.2 [section Type handlers]
 *   - tmp/driver-design-notes.md
 *   - tmp/js-managed-type-spec.md
 */

export const type    = 'structured-text';
export const version = '2.0';

/**
 * Factory — called once per type name at startup by the type registry.
 * Returns a handler object with its own closure on typeName/extension/shebang/description.
 *
 * @param {{ name: string, version: string, handler: string, description?: string, shebang?: string }} entry
 * @returns {object} handler
 */
export async function init(entry) {
  const typeName    = entry.name;
  const extension   = '.' + (entry.extension || entry.name);
  const description = entry.description || '';
  const shebang     = entry.shebang || null;

  // ---- claim ----

  async function claim(urlRef, rootRegistry) {
    const ext = (urlRef.extension || '').toLowerCase();
    if (ext !== extension.toLowerCase()) return false;
    if (!shebang) return true;
    // shebang strategy — read first line
    const content   = await rootRegistry.read(urlRef);
    const firstLine = content.split('\n')[0];
    return firstLine === shebang;
  }

  // ---- describe ----

  function describe() {
    const recognition = description
      ? `A FAL ending with .${typeName} — ${description}`
      : `A FAL ending with .${typeName} is a plain-text file — full file access only, no named blocks.`;
    return {
      recognition,
      capabilities: { read: true, write: true, blocks: false },
      usage: `forge_read(fal) returns the entire file content. forge_write(fal, content) replaces the entire file.`
    };
  }

  // ---- read-block ----

  async function readBlock(urlRef, block, rootRegistry) {
    if (block !== '') {
      throw new Error(`${typeName}: no block structure — block must be "" (got "${block}")`);
    }
    const content = await rootRegistry.read(urlRef);
    if (!shebang) return content;
    // Strip shebang line (first line) from returned content
    const nl = content.indexOf('\n');
    return nl === -1 ? '' : content.slice(nl + 1);
  }

  // ---- write-block ----

  async function writeBlock(urlRef, block, content, rootRegistry) {
    if (block !== '') {
      throw new Error(`${typeName}: no block structure — block must be "" (got "${block}")`);
    }
    const toWrite = shebang ? shebang + '\n' + content : content;
    return rootRegistry.write(urlRef, toWrite);
  }

  // ---- list-blocks ----

  async function listBlocks(_urlRef, _block, _rootRegistry) {
    throw new Error(`${typeName}: listBlocks not implemented — no block structure in this version`);
  }

  // ---- insert-block ----

  async function insertBlock(_urlRef, _name, _after, _rootRegistry, _firstChild = false) {
    throw new Error(`${typeName}: insertBlock not implemented`);
  }

  // ---- append-block ----

  async function appendBlock(_urlRef, _block, _content, _rootRegistry) {
    throw new Error(`${typeName}: appendBlock not implemented`);
  }

  // ---- delete-block ----

  async function deleteBlock(_urlRef, _block, _rootRegistry) {
    throw new Error(`${typeName}: deleteBlock not implemented`);
  }

  // ---- create-artifact ----

  async function createArtifact(urlRef, rootRegistry) {
    await rootRegistry.create(urlRef);           // creates empty file
    if (shebang) {
      await rootRegistry.write(urlRef, shebang + '\n'); // write shebang as initial content
    }
  }

  // ---- delete-artifact ----

  async function deleteArtifact(_urlRef, _rootRegistry) {
    throw new Error(`${typeName}: deleteArtifact not implemented`);
  }

  // ---- move-artifact ----

  async function moveArtifact(_urlRef, _targetUrlRef, _rootRegistry) {
    throw new Error(`${typeName}: moveArtifact not implemented`);
  }

  // ---- rename-artifact ----

  async function renameArtifact(_urlRef, _name, _rootRegistry) {
    throw new Error(`${typeName}: renameArtifact not implemented`);
  }

  return {
    type: typeName,
    version: entry.version,
    claim, describe,
    readBlock, writeBlock, listBlocks,
    insertBlock, appendBlock, deleteBlock,
    createArtifact, deleteArtifact, moveArtifact, renameArtifact
  };
}
