/**
 * sequence.js
 *
 * Generic sequence format engine — extension-independent.
 *
 * Receives a SyntaxAdapter at build time (via initSequence) and uses it
 * for all syntax-specific operations (metadata, sections, skeleton).
 *
 * Implements the run handler interface:
 *   claim(rawContent)                  → boolean
 *   read(path, rootRegistry, query?)   → object
 *   write(path, rootRegistry, payload) → void
 *   create(path, rootRegistry)         → void
 *   describe()                         → { description, example }
 *
 * References:
 *   - conventions/forge.md v0.8 [sections Sequence handler, Handler interface]
 */

// ---------------------------------------------------------------------------
// initSequence() — build time
// ---------------------------------------------------------------------------

/**
 * @param {object} formatJson  — format declaration from forge-formats.json
 * @param {object} adapter     — SyntaxAdapter instance (build-time closure)
 * @returns {object}           — run handler
 */
export function initSequence(formatJson, adapter) {
  const { name, description, sections = [] } = formatJson;

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  /** Index sections by name for quick lookup. */
  const sectionDefs = new Map(sections.map(s => [s.name, s]));

  /**
   * Build the read response object from a list of parsed sections.
   * Lazy sections return an array of key values only.
   */
  function buildResponse(parsedSections, query) {
    const result = { format: name };

    for (const def of sections) {
      const parsed = parsedSections.filter(s => s.name === def.name);

      if (def.repeat) {
        if (def.lazy && !query) {
          // Lazy: return key list only
          result[def.name] = parsed.map(s => s[def.key] ?? s.content.split('\n')[0]);
        } else {
          result[def.name] = parsed.map(s => s.content);
        }
      } else {
        const section = parsed[0];
        if (section !== undefined) {
          result[def.name] = section.content;
        }
        // optional absent → field omitted (undefined)
      }
    }

    // Apply dot-notation query — return only the requested section
    if (query) {
      const [sectionName] = query.split('.');
      const filtered = { format: name };
      if (result[sectionName] !== undefined) {
        filtered[sectionName] = result[sectionName];
      }
      return filtered;
    }

    return result;
  }

  // -------------------------------------------------------------------------
  // Run handler
  // -------------------------------------------------------------------------

  return {

    // claim() — does this handler own this file?
    async claim(rawContent) {
      const meta = adapter.parseMetadata(rawContent);
      return meta?.format === name;
    },

    // read() — parse and return structured content
    async read(path, rootRegistry, query) {
      const raw            = await rootRegistry.read(path);
      const parsedSections = adapter.parseSections(raw, formatJson);
      return buildResponse(parsedSections, query);
    },

    // write() — narrow update: only touch what's in payload
    async write(path, rootRegistry, payload) {
      const raw     = await rootRegistry.read(path);
      let sections  = adapter.parseSections(raw, formatJson);

      for (const [key, value] of Object.entries(payload)) {
        if (!sectionDefs.has(key)) continue;
        const def = sectionDefs.get(key);

        if (def.repeat) {
          // repeat sections — replace full array for now (actions deferred)
          sections = sections.filter(s => s.name !== key);
          if (Array.isArray(value)) {
            sections.push(...value.map(content => ({ name: key, content })));
          }
        } else {
          // simple section — update or add
          const idx = sections.findIndex(s => s.name === key);
          if (idx !== -1) {
            sections[idx] = { ...sections[idx], content: value };
          } else {
            sections.push({ name: key, content: value });
          }
        }
      }

      const updated = adapter.serializeSections(sections, raw);
      await rootRegistry.write(path, updated);
    },

    // create() — write metadata block + empty skeleton
    async create(path, rootRegistry) {
      const skeleton = adapter.buildSkeleton(formatJson);
      await rootRegistry.write(path, skeleton);
    },

    // describe() — format description for forge://registry
    describe() {
      const example = {};
      for (const s of sections) {
        if (!s.optional) example[s.name] = s.repeat ? [] : '';
      }
      return { description: description ?? name, example };
    },
  };
}
