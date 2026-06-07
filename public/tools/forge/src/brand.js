/**
 * brand.js
 *
 * Brand registry — session-scoped set of FALs issued by Forge.
 * Forge is the sole authority on branded FALs.
 * Also holds the RTFM gate check (reads described flag from TypeRegistry).
 *
 * References:
 *   - conventions/forge.md v7.0 [section Brand principle]
 *   - conventions/forge.md v7.0 [section RTFM principle]
 *
 * Not yet in references: none
 */

const BRAND_MSG = 'This FAL was not issued by Forge — call forge_ls to obtain a valid FAL.';
const RTFM_MSG  = 'Call forge_describe(fal) first — RTFM: no read or write before the type is understood.';

/** Session-scoped set of branded FAL strings. */
export const brandRegistry = new Set();

/**
 * Register a FAL as branded (issued by Forge).
 * @param {string} fal
 */
export function brand(fal) {
  brandRegistry.add(fal);
}

/**
 * Throw if the FAL was not issued by Forge.
 * @param {string} fal
 */
export function checkBrand(fal) {
  if (!brandRegistry.has(fal)) throw new Error(BRAND_MSG);
}

/**
 * Throw if the type has not been described in this session.
 * @param {string} typeName
 * @param {import('./type-registry.js').TypeRegistry} typeRegistry
 */
export function checkRTFM(typeName, typeRegistry) {
  if (!typeRegistry.isDescribed(typeName)) throw new Error(RTFM_MSG);
}
