/**
 * shim-syntax-adapter.js
 *
 * Test fixture — minimal SyntaxAdapter for testing sequence.js in isolation.
 *
 * File format (fictional, for tests only):
 *   @@forge format: doc
 *   @@section why
 *   Why content here.
 *   @@section what
 *   What content here.
 *
 * All values are strings. No real file syntax involved.
 */

export class ShimSyntaxAdapter {

  // -------------------------------------------------------------------------
  // parseMetadata()
  // -------------------------------------------------------------------------

  parseMetadata(rawContent) {
    const line = rawContent.split('\n')[0] ?? '';
    if (!line.startsWith('@@forge ')) return null;
    const meta = {};
    for (const pair of line.slice('@@forge '.length).split(' ')) {
      const idx = pair.indexOf('=');
      if (idx === -1) continue;
      const k = pair.slice(0, idx).trim();
      const v = pair.slice(idx + 1).trim();
      if (k) meta[k] = v;
    }
    return meta.format ? meta : null;
  }

  // -------------------------------------------------------------------------
  // serializeMetadata()
  // -------------------------------------------------------------------------

  serializeMetadata(meta) {
    const pairs = Object.entries(meta).map(([k, v]) => `${k}=${v}`).join(' ');
    return `@@forge ${pairs}`;
  }

  // -------------------------------------------------------------------------
  // parseSections()
  // -------------------------------------------------------------------------

  parseSections(rawContent, grammar) {
    // Build set of known section names from grammar
    const knownNames = new Set((grammar.sections ?? []).map(s => s.name));

    const lines    = rawContent.split('\n');
    const sections = [];
    let current    = null;

    for (const line of lines) {
      if (line.startsWith('@@section ')) {
        const name = line.slice('@@section '.length).trim();
        if (current) sections.push({ ...current, content: current.content.trimEnd() });
        current = knownNames.has(name) ? { name, content: '' } : null;
      } else if (current) {
        current.content += line + '\n';
      }
    }
    if (current) sections.push({ ...current, content: current.content.trimEnd() });

    return sections;
  }

  // -------------------------------------------------------------------------
  // serializeSections()
  // -------------------------------------------------------------------------

  serializeSections(sections, rawContent) {
    // Preserve original metadata line
    const metaLine = rawContent.split('\n')[0] ?? '';
    const parts    = sections.map(s => `@@section ${s.name}\n${s.content}`);
    return metaLine + '\n' + parts.join('\n') + '\n';
  }

  // -------------------------------------------------------------------------
  // buildSkeleton()
  // -------------------------------------------------------------------------

  buildSkeleton(formatJson) {
    const meta  = this.serializeMetadata({ format: formatJson.name });
    const parts = (formatJson.sections ?? []).map(s => `@@section ${s.name}\n`);
    return meta + '\n' + parts.join('\n') + '\n';
  }
}
