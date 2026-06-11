/**
 * md-extension-handler.js
 *
 * SyntaxAdapter implementation for .md files.
 *
 * Implements the SyntaxAdapter interface:
 *   parseMetadata(rawContent)               → { format, ...meta } | null
 *   serializeMetadata(meta)                 → string
 *   parseSections(rawContent, grammar)      → Section[]
 *   serializeSections(sections, rawContent) → string
 *   buildSkeleton(formatJson)               → string
 *
 * Metadata block syntax (.md):
 *   [//]: # (forge-start)
 *   format: doc
 *   version: 1.0
 *   [//]: # (forge-end)
 *
 * Metadata is parsed as simple key: value pairs — all values are strings.
 * No YAML library — avoids type coercion surprises (1.0 → number, yes → boolean).
 *
 * Section separator: ## <Section name> (h2 heading, capitalized name)
 *
 * References:
 *   - conventions/forge.md v0.8 [sections Metadata block, Sequence handler]
 */

const FORGE_START = '[//]: # (forge-start)';
const FORGE_END   = '[//]: # (forge-end)';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Capitalize first letter of a string. */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Section heading line for a given section name. */
function headingFor(name) {
  return `## ${capitalize(name)}`;
}

/** Extract the raw metadata block content between forge-start and forge-end. */
function extractMetadataRaw(rawContent) {
  const startIdx = rawContent.indexOf(FORGE_START);
  const endIdx   = rawContent.indexOf(FORGE_END);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) return null;
  return rawContent.slice(startIdx + FORGE_START.length, endIdx).trim();
}

/**
 * Parse simple key: value pairs — all values are strings.
 * Lines that are empty or don't contain ': ' are ignored.
 */
function parseKV(raw) {
  const result = {};
  for (const line of raw.split('\n')) {
    const idx = line.indexOf(': ');
    if (idx === -1) continue;
    const key   = line.slice(0, idx).trim();
    const value = line.slice(idx + 2).trim();
    if (key) result[key] = value;
  }
  return result;
}

/**
 * Serialize an object to simple key: value lines.
 * All values are coerced to strings.
 */
function serializeKV(obj) {
  return Object.entries(obj)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
}

/** Return the content after the metadata block, or the full content if no block. */
function contentAfterMetadata(rawContent) {
  const endIdx = rawContent.indexOf(FORGE_END);
  if (endIdx === -1) return rawContent;
  return rawContent.slice(endIdx + FORGE_END.length);
}

// ---------------------------------------------------------------------------
// MdSyntaxAdapter
// ---------------------------------------------------------------------------

export class MdSyntaxAdapter {

  // -------------------------------------------------------------------------
  // parseMetadata()
  // -------------------------------------------------------------------------

  parseMetadata(rawContent) {
    const raw = extractMetadataRaw(rawContent);
    if (raw === null) return null;
    const meta = parseKV(raw);
    if (!meta.format) return null;
    return meta;
  }

  // -------------------------------------------------------------------------
  // serializeMetadata()
  // -------------------------------------------------------------------------

  serializeMetadata(meta) {
    const kvStr = serializeKV(meta);
    return `${FORGE_START}\n${kvStr}\n${FORGE_END}`;
  }

  // -------------------------------------------------------------------------
  // parseSections()
  // -------------------------------------------------------------------------

  parseSections(rawContent, grammar) {
    const body = contentAfterMetadata(rawContent);

    // Build a map of heading → section name from grammar
    const headingToName = new Map();
    for (const section of grammar.sections) {
      headingToName.set(headingFor(section.name), section.name);
    }

    // Split body into lines and walk through
    const lines    = body.split('\n');
    const sections = [];
    let current    = null;

    for (const line of lines) {
      const trimmed = line.trimEnd();
      if (headingToName.has(trimmed)) {
        if (current) sections.push(current);
        current = { name: headingToName.get(trimmed), content: '' };
      } else if (current) {
        current.content += line + '\n';
      }
    }
    if (current) sections.push(current);

    // Trim trailing whitespace from each section's content
    return sections.map(s => ({ ...s, content: s.content.trimEnd() }));
  }

  // -------------------------------------------------------------------------
  // serializeSections()
  // -------------------------------------------------------------------------

  serializeSections(sections, rawContent) {
    // Preserve the original metadata block
    const startIdx = rawContent.indexOf(FORGE_START);
    const endIdx   = rawContent.indexOf(FORGE_END);
    const metaBlock = (startIdx !== -1 && endIdx !== -1)
      ? rawContent.slice(startIdx, endIdx + FORGE_END.length)
      : '';

    const sectionParts = sections.map(s => {
      const heading = headingFor(s.name);
      const content = s.content ? `\n${s.content}` : '';
      return `${heading}\n${content}`;
    });

    return metaBlock + '\n\n' + sectionParts.join('\n\n') + '\n';
  }

  // -------------------------------------------------------------------------
  // buildSkeleton()
  // -------------------------------------------------------------------------

  buildSkeleton(formatJson) {
    const meta     = { format: formatJson.name };
    const metaBlock = this.serializeMetadata(meta);

    const sectionParts = (formatJson.sections ?? []).map(s => {
      return `${headingFor(s.name)}\n`;
    });

    return metaBlock + '\n\n' + sectionParts.join('\n') + '\n';
  }
}
