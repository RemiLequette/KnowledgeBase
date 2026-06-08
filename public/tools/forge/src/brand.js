/**
 * brand.js
 *
 * Brand and RTFM message constants, shared between forge-api.js and any
 * future protocol adapter that needs to surface the same error messages.
 *
 * brand() and the Brand registry live in ForgeSession (forge-api.js) —
 * session-scoped, not a global singleton.
 *
 * References:
 *   - conventions/forge.md [section Brand principle]
 *   - conventions/forge.md [section RTFM principle]
 */

export const BRAND_MSG = 'This FAL was not issued by Forge — call forge_ls to discover existing artifacts, or forge_create to create a new one.';
export const RTFM_MSG  = 'Call forge_describe(fal) first — RTFM: no read or write before the type is understood.';
