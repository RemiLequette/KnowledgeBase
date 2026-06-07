/**
 * fal.js
 *
 * FAL (Forge Artifact Locator) parsing and building — pure functions.
 * These operations belong to the MCP boundary layer, not to the registries.
 * Imported by mcp-tools.js (MCP dispatcher) and by TypeRegistry (Brand registry).
 *
 * References:
 *   - conventions/forge.md v7.0 [section Forge Artifact Locator FAL]
 *
 * Not yet in references: none
 */

/**
 * Parse a FAL string into an ArtifactRef.
 * @param {string} fal
 * @returns {{ root: string, path: string, name: string, type: string, block: string }}
 */
export function parseFAL(fal) {
  if (!fal.startsWith('forge://')) throw new Error(`Invalid FAL: ${fal}`);
  const rest = fal.slice('forge://'.length);
  const slashIdx = rest.indexOf('/');
  if (slashIdx === -1) throw new Error(`FAL has no path: ${fal}`);
  const root      = rest.slice(0, slashIdx);
  const afterRoot = rest.slice(slashIdx + 1);

  const hashIdx  = afterRoot.indexOf('#');
  const pathPart = hashIdx === -1 ? afterRoot : afterRoot.slice(0, hashIdx);
  const block    = hashIdx === -1 ? '' : afterRoot.slice(hashIdx + 1);

  const lastSlash  = pathPart.lastIndexOf('/');
  const folderPath = lastSlash === -1 ? '' : pathPart.slice(0, lastSlash + 1);
  const falName    = lastSlash === -1 ? pathPart : pathPart.slice(lastSlash + 1);

  const dotIdx = falName.lastIndexOf('.');
  if (dotIdx === -1) throw new Error(`FAL name has no type extension: ${falName}`);
  const type = falName.slice(dotIdx + 1);
  const name = falName.slice(0, dotIdx);

  return { root, path: folderPath, name, type, block };
}

/**
 * Build a FAL string from an ArtifactRef.
 * @param {{ root: string, path: string, name: string, type: string }} ref
 * @returns {string}
 */
export function toFAL(ref) {
  return `forge://${ref.root}/${ref.path}${ref.name}.${ref.type}`;
}
