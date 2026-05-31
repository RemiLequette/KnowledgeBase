/**
 * md-parser.js
 *
 * Parse Markdown files conforming to the documentation convention into a structured
 * doc object, and provide accessor functions. The doc object is opaque — always use
 * the exported functions, never access doc internals directly.
 *
 * Conforms to: conventions/documentation.md
 *
 * Usage:
 *   const md = require('./lib/md-parser');
 *   const doc = md.parseFile('/path/to/file.md');
 *   console.log(md.getKeywords(doc));
 */

'use strict';

const fs   = require('./fs-scan');

// Required sections per documentation convention
const REQUIRED_SECTIONS = ['Quick Start', 'Keywords', 'Index', 'Changelog'];

// ---------------------------------------------------------------------------
// Internal parsing
// ---------------------------------------------------------------------------

/**
 * Parse raw Markdown text into an internal doc structure.
 * @param {string} text     - Raw Markdown content.
 * @param {string} filePath - Source file path (for error messages).
 * @returns {object} Opaque doc object.
 */
function _parse(text, filePath) {
  const lines    = text.split(/\r?\n/);
  const sections = []; // [{ name, level, startLine, lines[] }]

  let title      = null;
  let currentSection = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // H1 title — first one wins
    if (!title && /^#\s+\S/.test(line)) {
      title = line.replace(/^#\s+/, '').trim();
      continue;
    }

    // Horizontal rule — skip, do not accumulate into sections
    if (/^---+$/.test(line.trim())) continue;

    // H2 section header
    const h2Match = line.match(/^##\s+(.+)$/);
    if (h2Match) {
      currentSection = {
        name:      h2Match[1].trim(),
        level:     2,
        startLine: i,
        lines:     [],
      };
      sections.push(currentSection);
      continue;
    }

    // Accumulate lines into current section
    if (currentSection) {
      currentSection.lines.push(line);
    }
  }

  // Trim trailing blank lines from each section's content
  for (const s of sections) {
    while (s.lines.length > 0 && s.lines[s.lines.length - 1].trim() === '') {
      s.lines.pop();
    }
  }

  return { filePath, title, sections };
}

// ---------------------------------------------------------------------------
// Public API — parsing
// ---------------------------------------------------------------------------

/**
 * Parse a Markdown file from disk into a doc object.
 * @param {string} filePath - Absolute path to the .md file.
 * @returns {object} Opaque doc object.
 */
function parseFile(filePath) {
  const text = fs.readFile(filePath);
  return _parse(text, filePath);
}

/**
 * Parse a Markdown string into a doc object (useful for testing).
 * @param {string} text     - Raw Markdown content.
 * @param {string} filePath - Logical file path (used for identification).
 * @returns {object} Opaque doc object.
 */
function parseText(text, filePath) {
  if (typeof filePath === 'undefined') throw new Error('parseText requires a filePath argument');
  return _parse(text, filePath);
}

// ---------------------------------------------------------------------------
// Public API — accessors
// ---------------------------------------------------------------------------

/**
 * Returns the H1 title of the document, or null if absent.
 * @param {object} doc
 * @returns {string|null}
 */
function getTitle(doc) {
  return doc.title || null;
}

/**
 * Returns the content of the ## Quick Start section, or null if absent.
 * @param {object} doc
 * @returns {string|null}
 */
function getQuickStart(doc) {
  return getSection(doc, 'Quick Start');
}

/**
 * Returns the Keywords section as an array of trimmed strings, or [] if absent.
 * @param {object} doc
 * @returns {string[]}
 */
function getKeywords(doc) {
  const raw = getSection(doc, 'Keywords');
  if (!raw) return [];
  return raw
    .split(',')
    .map(k => k.trim())
    .filter(Boolean);
}

/**
 * Returns all sections in document order.
 * @param {object} doc
 * @returns {{ name: string, level: number, content: string }[]}
 */
function getSections(doc) {
  return doc.sections.map(s => ({
    name:    s.name,
    level:   s.level,
    content: s.lines.join('\n'),
  }));
}

/**
 * Returns the content of a named ## section as a string, or null if not found.
 * @param {object} doc
 * @param {string} name - Exact section name (case-sensitive).
 * @returns {string|null}
 */
function getSection(doc, name) {
  const s = doc.sections.find(s => s.name === name);
  return s ? s.lines.join('\n') : null;
}

/**
 * Returns true if the document has a section with the given name.
 * @param {object} doc
 * @param {string} name
 * @returns {boolean}
 */
function hasSection(doc, name) {
  return doc.sections.some(s => s.name === name);
}

/**
 * Returns the source file path of the document.
 * @param {object} doc
 * @returns {string}
 */
function getFilePath(doc) {
  return doc.filePath;
}

// ---------------------------------------------------------------------------
// Public API — conformance
// ---------------------------------------------------------------------------

/**
 * Returns a list of conformance issues. Empty array means fully conformant.
 * @param {object} doc
 * @returns {string[]}
 */
function getIssues(doc) {
  const issues = [];

  for (const required of REQUIRED_SECTIONS) {
    if (!hasSection(doc, required)) {
      issues.push(`Missing ## ${required}`);
    }
  }

  if (hasSection(doc, 'Keywords') && getKeywords(doc).length === 0) {
    issues.push('## Keywords section is empty');
  }

  return issues;
}

/**
 * Returns true if the document has no conformance issues.
 * @param {object} doc
 * @returns {boolean}
 */
function isConformant(doc) {
  return getIssues(doc).length === 0;
}

// ---------------------------------------------------------------------------
// Public API — mutations
// ---------------------------------------------------------------------------

/**
 * Set the H1 title of the document. Mutates doc in place.
 * @param {object} doc
 * @param {string} title
 */
function setTitle(doc, title) {
  if (typeof title !== 'string' || title.trim() === '') {
    throw new Error('setTitle: title must be a non-empty string');
  }
  doc.title = title.trim();
}

/**
 * Set the content of a named ## section. Creates the section if absent,
 * inserting it before ## Index (or at end if no Index section exists).
 * Mutates doc in place.
 * @param {object} doc
 * @param {string} name    - Exact section name.
 * @param {string} content - New content (may be empty string).
 */
function setSection(doc, name, content) {
  if (typeof name !== 'string' || name.trim() === '') {
    throw new Error('setSection: name must be a non-empty string');
  }
  const contentStr = typeof content === 'string' ? content : '';
  const lines = contentStr === '' ? [] : contentStr.split(/\r?\n/);

  const existing = doc.sections.find(s => s.name === name);
  if (existing) {
    existing.lines = lines;
    return;
  }

  // Insert before ## Index, or before ## Changelog, or at end
  const anchors = ['Index', 'Changelog'];
  let insertAt = doc.sections.length;
  for (const anchor of anchors) {
    const idx = doc.sections.findIndex(s => s.name === anchor);
    if (idx !== -1) {
      insertAt = idx;
      break;
    }
  }

  doc.sections.splice(insertAt, 0, {
    name,
    level: 2,
    startLine: -1,
    lines,
  });
}

// ---------------------------------------------------------------------------
// Public API — reconstruction
// ---------------------------------------------------------------------------

/**
 * Reconstruct the document as a Markdown string from its parsed structure.
 * Suitable for pretty-printing or round-trip validation.
 * @param {object} doc
 * @returns {string}
 */
function toMarkdown(doc) {
  const parts = [];

  if (doc.title) {
    parts.push(`# ${doc.title}`);
    parts.push('');
  }

  for (const s of doc.sections) {
    parts.push(`## ${s.name}`);
    if (s.lines.length > 0) {
      parts.push(...s.lines);
    }
    parts.push('');
  }

  return parts.join('\n').trimEnd() + '\n';
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  // Parsing
  parseFile,
  parseText,
  // Accessors
  getTitle,
  getQuickStart,
  getKeywords,
  getSections,
  getSection,
  hasSection,
  getFilePath,
  // Conformance
  getIssues,
  isConformant,
  // Mutations
  setTitle,
  setSection,
  // Reconstruction
  toMarkdown,
};

// ---------------------------------------------------------------------------
// Changelog
// ---------------------------------------------------------------------------
//
// Version 1.1 - Mutations
// Date: 2026-05-30
// Added setTitle(doc, title) and setSection(doc, name, content).
// setSection creates the section if absent, inserting before ## Index or ## Changelog.
//
// Version 1.0 - Creation
// Date: 2026-05-30
// Initial implementation: parseFile, parseText, accessors, conformance, toMarkdown.
