// @forge-type: js-managed

// ====[ imports ]====

// (none)

// ====[ parse-fal ]====

/**
 * Parse a FAL string into a ref object.
 *
 * Folder FAL  (ends with /)  → { root, path, name: '', type: '', block: '' }
 * Artifact FAL               → { root, path, name, type, block }
 *
 * Type extraction rule: first dot in the filename — name is everything before,
 * type is everything after. This supports multi-segment type names (e.g. doc.md,
 * managed.js, commwise:layout) produced by toFAL.
 *
 * path always ends with '/' when non-empty.
 * Throws on malformed input.
 *
 * @param {string} fal
 * @param {'artifact'|'folder'|undefined} expect  — optional shape validation
 * @returns {{ root: string, path: string, name: string, type: string, block: string }}
 */
export function parseFAL(fal, expect) {
  if (typeof fal !== 'string' || !fal.startsWith('forge://')) {
    throw new Error(`Invalid FAL — must start with forge://: ${fal}`);
  }

  const rest = fal.slice('forge://'.length);
  const slashIdx = rest.indexOf('/');
  if (slashIdx === -1) throw new Error(`Invalid FAL — missing path separator: ${fal}`);

  const root      = rest.slice(0, slashIdx);
  if (!root) throw new Error(`Invalid FAL — empty root: ${fal}`);

  const afterRoot = rest.slice(slashIdx + 1);

  // Folder FAL — ends with /
  if (afterRoot.endsWith('/') || afterRoot === '') {
    if (expect === 'artifact') throw new Error(`Expected an artifact FAL, got a folder FAL: ${fal}`);
    return { root, path: afterRoot, name: '', type: '', block: '' };
  }

  // Artifact FAL — may have a block path after #
  if (expect === 'folder') throw new Error(`Expected a folder FAL (ending with /), got an artifact FAL: ${fal}`);

  const hashIdx  = afterRoot.indexOf('#');
  const pathPart = hashIdx === -1 ? afterRoot : afterRoot.slice(0, hashIdx);
  const block    = hashIdx === -1 ? '' : afterRoot.slice(hashIdx + 1);

  const lastSlash  = pathPart.lastIndexOf('/');
  const folderPath = lastSlash === -1 ? '' : pathPart.slice(0, lastSlash + 1);
  const falName    = lastSlash === -1 ? pathPart : pathPart.slice(lastSlash + 1);

  if (!falName) throw new Error(`Invalid FAL — empty artifact name: ${fal}`);

  // First dot: name stops here, type is everything after.
  const dotIdx = falName.indexOf('.');
  if (dotIdx === -1) throw new Error(`Invalid FAL — artifact name has no type extension: ${fal}`);
  if (dotIdx === 0)  throw new Error(`Invalid FAL — artifact name is empty before extension: ${fal}`);

  const name = falName.slice(0, dotIdx);
  const type = falName.slice(dotIdx + 1);

  if (!type) throw new Error(`Invalid FAL — empty type extension: ${fal}`);

  return { root, path: folderPath, name, type, block };
}

// ====[ to-fal ]====

/**
 * Build a FAL string from a ref.
 *
 * Folder ref (name === '')  → forge://<root>/<path>
 * Artifact ref              → forge://<root>/<path><name>.<type>
 *
 * @param {{ root: string, path: string, name: string, type: string }} ref
 * @returns {string}
 */
export function toFAL(ref) {
  if (!ref.name) return `forge://${ref.root}/${ref.path}`;
  return `forge://${ref.root}/${ref.path}${ref.name}.${ref.type}`;
}
