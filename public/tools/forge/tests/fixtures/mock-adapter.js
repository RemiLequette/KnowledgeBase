/**
 * mock-adapter.js
 *
 * Test fixture — minimal SyntaxAdapter for format registry tests.
 * Tracks injection via _name field.
 */

export async function initAdapter() {
  return { _name: 'mock-adapter' };
}
