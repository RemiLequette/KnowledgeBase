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
 * v3.0 — block grammar: separators, repeat, recursion, matchName claim, createArtifact skeleton.
 *
 * Configuration via init(entry):
 *   entry.name        — type name
 *   entry.description — optional human-readable description for forge_describe
 *   entry.extension   — optional override for file extension (default: entry.name)
 *   entry.shebang     — optional shebang string (e.g. "// @forge-type: js-managed")
 *                       If present: claim = extension match AND first line === shebang
 *   entry.matchName   — optional regexp string matched against the filename stem (no extension)
 *                       If present: claim requires name match in addition to extension/shebang
 *   entry.blocks      — optional block grammar: { separators: [ SeparatorDef, ... ] }
 *
 * SeparatorDef:
 *   { type: "regex", pattern: string, nameGroup: number,
 *     name?: string, repeat?: RepeatSpec, blocks?: BlockGrammar,
 *     template?: string }
 *
 * RepeatSpec: 1 (default) | number | "?" | "*" | "+" | [min, max|"*"]
 *
 * Shebang contract:
 *   readBlock("")      — returns content WITHOUT the shebang line
 *   writeBlock("", c)  — prepends shebang + newline before writing
 *   createArtifact     — creates file with shebang + newline as initial content
 *
 * Block contract:
 *   readBlock(name)    — returns block own content (no separator line, no children)
 *   writeBlock(name,c) — replaces block own content; reconstructs full file
 *   listBlocks("")     — returns direct children names of root
 *   listBlocks(name)   — returns direct children names of named block
 *   createArtifact     — generates skeleton: shebang + one separator per fixed-name block
 *                        (separator with name + repeat min >= 1)
 *
 * writeBlock contract:
 *   Throws "File does not exist — call forge_create first" if artifact absent.
 *   Existence is checked before any read, to produce a clear error message.
 *
 * References:
 *   - conventions/forge.md v7.2 [section Type handlers]
 *   - conventions/structured-text.md
 */

export const type    = 'structured-text';
export const version = '3.0';

// ====[ repeat-helpers ]====

/**
 * Parse a RepeatSpec into { min, max } where max=Infinity means unbounded.
 * Default (absent) → { min: 1, max: 1 }
 */
function parseRepeat(repeat) {
  if (repeat === undefined || repeat === null) return { min: 1, max: 1 };
  if (repeat === '?') return { min: 0, max: 1 };
  if (repeat === '*') return { min: 0, max: Infinity };
  if (repeat === '+') return { min: 1, max: Infinity };
  if (typeof repeat === 'number') return { min: repeat, max: repeat };
  if (Array.isArray(repeat)) {
    const min = repeat[0];
    const max = repeat[1] === '*' ? Infinity : repeat[1];
    return { min, max };
  }
  throw new Error(`Invalid repeat spec: ${JSON.stringify(repeat)}`);
}

// ====[ block-parser ]====

/**
 * Parse file content lines into a flat list of block slots for a given grammar level.
 *
 * Returns an array of ParsedBlock:
 *   { name: string, sepLine: number, contentStart: number, contentEnd: number,
 *     ownEnd: number, separatorDef: SeparatorDef }
 *
 * - sepLine      : line index of the separator line (-1 for the anonymous root block "")
 * - contentStart : first line of own content (after separator)
 * - ownEnd       : last line (exclusive) of own content — where next separator or EOF begins
 * - contentEnd   : last line (exclusive) of entire block including children
 *
 * The anonymous block "" always exists:
 *   contentStart=0, contentEnd=index of first separator (or lines.length)
 *   ownEnd = same as contentEnd at this level (children not parsed here)
 *
 * @param {string[]} lines
 * @param {object}   grammar  — { separators: SeparatorDef[] }
 * @returns {ParsedBlock[]}
 */
function parseLevel(lines, grammar) {
  if (!grammar || !grammar.separators || grammar.separators.length === 0) return [];

  const separators = grammar.separators.map(s => ({
    ...s,
    _re: new RegExp(s.pattern)
  }));

  // Find all separator hits in order
  const hits = []; // { lineIndex, name, separatorDef }
  for (let i = 0; i < lines.length; i++) {
    for (const sep of separators) {
      const m = sep._re.exec(lines[i]);
      if (!m) continue;
      const extracted = m[sep.nameGroup] || '';
      // name constraint: if sep.name is set, extracted must match exactly
      if (sep.name !== undefined && sep.name !== extracted) continue;
      hits.push({ lineIndex: i, name: extracted, separatorDef: sep });
      break; // first matching separator wins for this line
    }
  }

  // Build blocks from hits
  const blocks = [];

  // Anonymous root block "" — content before first separator
  const firstSep = hits.length > 0 ? hits[0].lineIndex : lines.length;
  blocks.push({
    name: '',
    sepLine: -1,
    contentStart: 0,
    contentEnd: firstSep,
    ownEnd: firstSep,
    separatorDef: null
  });

  for (let i = 0; i < hits.length; i++) {
    const hit  = hits[i];
    const next = hits[i + 1];
    const end  = next ? next.lineIndex : lines.length;
    blocks.push({
      name:         hit.name,
      sepLine:      hit.lineIndex,
      contentStart: hit.lineIndex + 1,
      contentEnd:   end,
      ownEnd:       end,
      separatorDef: hit.separatorDef
    });
  }

  return blocks;
}

/**
 * Resolve a block path (array of name segments) recursively.
 * Returns the ParsedBlock for the final segment, plus the lines and child grammar.
 *
 * @param {string[]}  pathSegments  — e.g. ["Changelog", "Version 1.0 - Creation"]
 * @param {string[]}  lines
 * @param {object}    grammar
 * @returns {{ block: ParsedBlock, lines: string[], childGrammar: object|null }}
 */
function resolveBlock(pathSegments, lines, grammar) {
  if (pathSegments.length === 0) {
    const blocks = parseLevel(lines, grammar);
    const root   = blocks.find(b => b.name === '');
    if (!root) throw new Error('Internal: anonymous block not found');
    return { block: root, lines, childGrammar: grammar };
  }

  const [head, ...tail] = pathSegments;
  const blocks = parseLevel(lines, grammar);
  const found  = blocks.find(b => b.name === head);
  if (!found) throw new Error(`Block not found: "${head}"`);

  const childGrammar = found.separatorDef && found.separatorDef.blocks
    ? found.separatorDef.blocks
    : null;

  if (tail.length === 0) {
    return { block: found, lines, childGrammar };
  }

  if (!childGrammar) {
    throw new Error(`Block "${head}" has no child grammar — cannot resolve "${tail.join('/')}"`);
  }

  const slice  = lines.slice(found.contentStart, found.contentEnd);
  const result = resolveBlock(tail, slice, childGrammar);
  return {
    block: {
      ...result.block,
      sepLine:      result.block.sepLine      >= 0 ? result.block.sepLine      + found.contentStart : -1,
      contentStart: result.block.contentStart + found.contentStart,
      contentEnd:   result.block.contentEnd   + found.contentStart,
      ownEnd:       result.block.ownEnd       + found.contentStart
    },
    lines,
    childGrammar: result.childGrammar
  };
}

/**
 * Split a block path string into segments.
 * "" → []  |  "Changelog" → ["Changelog"]  |  "Changelog/Version 1.0" → ["Changelog","Version 1.0"]
 */
function splitBlockPath(block) {
  if (!block) return [];
  return block.split('/').filter(s => s.length > 0);
}

/**
 * Compute the ownEnd of a block — last line (exclusive) of its own content,
 * stopping before the first child separator if a child grammar is present.
 */
function computeOwnEnd(found, lines, childGrammar) {
  if (!childGrammar) return found.contentEnd;
  const childLines  = lines.slice(found.contentStart, found.contentEnd);
  const childBlocks = parseLevel(childLines, childGrammar);
  const firstChild  = childBlocks.find(b => b.name !== '');
  return firstChild ? found.contentStart + firstChild.sepLine : found.contentEnd;
}

// ====[ skeleton-builder ]====

/**
 * Build the skeleton content for createArtifact.
 * Emits one separator + empty line for each fixed-name block (name present, repeat.min >= 1).
 * Recurses for child grammars.
 */
function buildSkeleton(grammar, typeName) {
  if (!grammar || !grammar.separators) return '';
  const lines = [];
  for (const sep of grammar.separators) {
    const { min } = parseRepeat(sep.repeat);
    if (sep.name && min >= 1) {
      lines.push(buildSeparatorLine(sep, sep.name, typeName));
      lines.push('');
      if (sep.blocks) {
        const childContent = buildSkeleton(sep.blocks, typeName);
        if (childContent) lines.push(childContent);
      }
    }
  }
  return lines.join('\n');
}

/**
 * Reconstruct a separator line for a given name.
 * Uses sep.template if present ("{name}" placeholder), otherwise best-effort from pattern.
 */
function buildSeparatorLine(sep, name, _typeName) {
  if (sep.template) return sep.template.replace('{name}', name);
  const raw = sep.pattern
    .replace(/^\^/, '')
    .replace(/\$$/, '')
    .replace(/\\([^\\])/g, '$1')
    .replace(/\(.*?\)/, name);
  return raw;
}

// ====[ init ]====

/**
 * Factory — called once per type name at startup by the type registry.
 * Returns a handler object with its own closure on typeName/extension/shebang/matchName/blocks.
 */
export async function init(entry) {
  const typeName     = entry.name;
  const extension    = '.' + (entry.extension || entry.name);
  const description  = entry.description || '';
  const shebang      = entry.shebang   || null;
  const matchNameStr = entry.matchName || null;
  const matchNameRe  = matchNameStr ? new RegExp(matchNameStr) : null;
  const blockGrammar = entry.blocks    || null;

  // ---- claim ----

  async function claim(urlRef, rootRegistry) {
    const ext = (urlRef.extension || '').toLowerCase();
    if (ext !== extension.toLowerCase()) return false;
    if (matchNameRe && !matchNameRe.test(urlRef.name || '')) return false;
    if (shebang) {
      const content   = await rootRegistry.read(urlRef);
      const firstLine = content.split('\n')[0];
      if (firstLine !== shebang) return false;
    }
    return true;
  }

  // ---- describe ----

  function describe() {
    const hasBlocks   = !!blockGrammar;
    const recognition = description
      ? `A FAL ending with .${typeName} — ${description}`
      : `A FAL ending with .${typeName} is a plain-text file — full file access only, no named blocks.`;
    return {
      recognition,
      capabilities: { read: true, write: true, blocks: hasBlocks },
      usage: hasBlocks
        ? `forge_read(fal, block) reads a named block. forge_write(fal, block, content) replaces it. forge_read(fal) returns full managed content.`
        : `forge_read(fal) returns the entire file content. forge_write(fal, content) replaces the entire file.`
    };
  }

  // ---- read-block ----

  async function readBlock(urlRef, block, rootRegistry) {
    const raw     = await rootRegistry.read(urlRef);
    const content = shebang ? stripShebang(raw) : raw;

    if (!block) {
      if (!blockGrammar) return content;
      const lines  = content.split('\n');
      const blocks = parseLevel(lines, blockGrammar);
      const root   = blocks.find(b => b.name === '');
      return lines.slice(root.contentStart, root.contentEnd).join('\n');
    }

    if (!blockGrammar) {
      throw new Error(`${typeName}: no block structure — block must be "" (got "${block}")`);
    }

    const lines    = content.split('\n');
    const segments = splitBlockPath(block);
    const { block: found, childGrammar } = resolveBlock(segments, lines, blockGrammar);

    if (found.name === '') {
      return lines.slice(found.contentStart, found.contentEnd).join('\n');
    }

    const ownEnd = computeOwnEnd(found, lines, childGrammar);
    return lines.slice(found.contentStart, ownEnd).join('\n');
  }

  // ---- write-block ----

  async function writeBlock(urlRef, block, content, rootRegistry) {
    // Existence check first — clear error before any read attempt
    let raw;
    try {
      raw = await rootRegistry.read(urlRef);
    } catch (_) {
      throw new Error(`File does not exist — call forge_create first`);
    }

    const managed = shebang ? stripShebang(raw) : raw;

    if (!block) {
      if (!blockGrammar) {
        const toWrite = shebang ? shebang + '\n' + content : content;
        return rootRegistry.write(urlRef, toWrite);
      }
      const lines   = managed.split('\n');
      const blocks  = parseLevel(lines, blockGrammar);
      const root    = blocks.find(b => b.name === '');
      const rebuilt = [...content.split('\n'), ...lines.slice(root.contentEnd)];
      const toWrite = shebang ? shebang + '\n' + rebuilt.join('\n') : rebuilt.join('\n');
      return rootRegistry.write(urlRef, toWrite);
    }

    if (!blockGrammar) {
      throw new Error(`${typeName}: no block structure — block must be "" (got "${block}")`);
    }

    const lines    = managed.split('\n');
    const segments = splitBlockPath(block);
    const { block: found, childGrammar } = resolveBlock(segments, lines, blockGrammar);

    const ownEnd   = computeOwnEnd(found, lines, childGrammar);
    const newLines = [
      ...lines.slice(0, found.contentStart),
      ...content.split('\n'),
      ...lines.slice(ownEnd)
    ];

    const toWrite = shebang ? shebang + '\n' + newLines.join('\n') : newLines.join('\n');
    return rootRegistry.write(urlRef, toWrite);
  }

  // ---- list-blocks ----

  async function listBlocks(urlRef, block, rootRegistry) {
    if (!blockGrammar) {
      throw new Error(`${typeName}: listBlocks not available — no block grammar configured`);
    }

    const raw     = await rootRegistry.read(urlRef);
    const content = shebang ? stripShebang(raw) : raw;
    const lines   = content.split('\n');

    if (!block) {
      const blocks = parseLevel(lines, blockGrammar);
      return blocks.filter(b => b.name !== '').map(b => b.name);
    }

    const segments = splitBlockPath(block);
    const { block: found, childGrammar } = resolveBlock(segments, lines, blockGrammar);

    if (!childGrammar) return [];

    const childLines  = lines.slice(found.contentStart, found.contentEnd);
    const childBlocks = parseLevel(childLines, childGrammar);
    return childBlocks.filter(b => b.name !== '').map(b => b.name);
  }

  // ---- stubs ----

  async function insertBlock(_u, _n, _a, _r, _f = false) {
    throw new Error(`${typeName}: insertBlock not implemented`);
  }
  async function appendBlock(_u, _b, _c, _r) {
    throw new Error(`${typeName}: appendBlock not implemented`);
  }
  async function deleteBlock(_u, _b, _r) {
    throw new Error(`${typeName}: deleteBlock not implemented`);
  }
  async function deleteArtifact(_u, _r) {
    throw new Error(`${typeName}: deleteArtifact not implemented`);
  }
  async function moveArtifact(_u, _t, _r) {
    throw new Error(`${typeName}: moveArtifact not implemented`);
  }
  async function renameArtifact(_u, _n, _r) {
    throw new Error(`${typeName}: renameArtifact not implemented`);
  }

  // ---- create-artifact ----

  async function createArtifact(urlRef, rootRegistry) {
    await rootRegistry.create(urlRef);
    const skeleton = blockGrammar ? buildSkeleton(blockGrammar, typeName) : '';
    const content  = shebang ? shebang + '\n' + skeleton : skeleton;
    if (content) await rootRegistry.write(urlRef, content);
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

// ====[ shebang-helpers ]====

/**
 * Strip the first line (shebang) from content.
 */
function stripShebang(content) {
  const nl = content.indexOf('\n');
  return nl === -1 ? '' : content.slice(nl + 1);
}
