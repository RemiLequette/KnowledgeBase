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
 * v1.0 — plain-text behaviour only (no block structure yet).
 *
 * Configuration via init(entry):
 *   entry.name        — type name, used to derive the claimed extension
 *   entry.description — optional human-readable description for forge_describe
 *
 * Claim strategy: extension-only — matches urlRef.extension === '.' + typeName.
 * No file content inspection in this version.
 *
 * References:
 *   - conventions/forge.md v7.1 [section Type handlers]
 *   - tmp/driver-design-notes.md
 */

export const type    = 'structured-text';
export const version = '1.0';

/**
 * Factory — called once per type name at startup by the type registry.
 * Returns a handler object with its own closure on typeName/extension/description.
 *
 * @param {{ name: string, version: string, handler: string, description?: string }} entry
 * @returns {object} handler
 */
export async function init(entry) {
  const typeName    = entry.name;
  const extension   = '.' + entry.name;
  const description = entry.description || '';

  // ---- claim ----

  function claim(urlRef) {
    const ext = (urlRef.extension || '').toLowerCase();
    return ext === extension.toLowerCase();
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
    return rootRegistry.read(urlRef);
  }

  // ---- write-block ----

  async function writeBlock(urlRef, block, content, rootRegistry) {
    if (block !== '') {
      throw new Error(`${typeName}: no block structure — block must be "" (got "${block}")`);
    }
    return rootRegistry.write(urlRef, content);
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
    return rootRegistry.create(urlRef);
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
