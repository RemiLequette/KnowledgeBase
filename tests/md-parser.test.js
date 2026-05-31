/**
 * md-parser.test.js
 *
 * A priori tests for lib/md-parser.js
 *
 * Args: (none)
 */

'use strict';

const assert = require('assert');
const path   = require('path');
const md     = require('../lib/md-parser');

let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log('PASS: ' + name);
  } catch (e) {
    console.log('FAIL: ' + name + ' -- ' + e.message);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SIMPLE_DOC = [
  '# My Title',
  '',
  '## Quick Start',
  'This is the quick start.',
  '',
  '## Keywords',
  'foo, bar, baz',
  '',
  '## Index',
  '',
  '| Terme | Occurrences |',
  '|-------|-------------|',
  '',
  '## Changelog',
  '',
  '### Version 1.0',
  '**Date:** 2026-01-01',
].join('\n');

const EMPTY_DOC = '# Empty\n\n## Quick Start\n\n## Keywords\n\n## Index\n\n## Changelog\n';

// ---------------------------------------------------------------------------
// parseText / getTitle
// ---------------------------------------------------------------------------

// @convention conventions/documentation.md [section Document Structure]
test('parseText parses H1 title', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  assert.strictEqual(md.getTitle(doc), 'My Title');
});

// @convention conventions/documentation.md [section Document Structure]
test('getTitle returns null when no H1', () => {
  const doc = md.parseText('## Quick Start\nno title here', 'test.md');
  assert.strictEqual(md.getTitle(doc), null);
});

// @convention conventions/tools.md [section Standard Interface]
test('parseText requires filePath argument', () => {
  assert.throws(() => md.parseText('# Title'), /filePath/);
});

// ---------------------------------------------------------------------------
// getSection / hasSection
// ---------------------------------------------------------------------------

// @convention none — purely technical accessor behaviour
test('getSection returns section content', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  const qs  = md.getSection(doc, 'Quick Start');
  assert.ok(qs.includes('quick start'));
});

// @convention none — purely technical accessor behaviour
test('getSection returns null when section absent', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  assert.strictEqual(md.getSection(doc, 'Nonexistent'), null);
});

// @convention none — purely technical accessor behaviour
test('hasSection returns true when section present', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  assert.strictEqual(md.hasSection(doc, 'Keywords'), true);
});

// @convention none — purely technical accessor behaviour
test('hasSection returns false when section absent', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  assert.strictEqual(md.hasSection(doc, 'Rationale'), false);
});

// ---------------------------------------------------------------------------
// getKeywords
// ---------------------------------------------------------------------------

// @convention conventions/documentation.md [section Keywords Rule]
test('getKeywords returns array of trimmed strings', () => {
  const doc      = md.parseText(SIMPLE_DOC, 'test.md');
  const keywords = md.getKeywords(doc);
  assert.deepStrictEqual(keywords, ['foo', 'bar', 'baz']);
});

// @convention conventions/documentation.md [section Keywords Rule]
test('getKeywords returns empty array when Keywords section absent', () => {
  const doc = md.parseText('# Title\n## Index\n', 'test.md');
  assert.deepStrictEqual(md.getKeywords(doc), []);
});

// ---------------------------------------------------------------------------
// getSections
// ---------------------------------------------------------------------------

// @convention conventions/documentation.md [section Document Structure]
test('getSections returns sections in document order', () => {
  const doc   = md.parseText(SIMPLE_DOC, 'test.md');
  const names = md.getSections(doc).map(s => s.name);
  assert.deepStrictEqual(names, ['Quick Start', 'Keywords', 'Index', 'Changelog']);
});

// ---------------------------------------------------------------------------
// getIssues / isConformant
// ---------------------------------------------------------------------------

// @convention conventions/documentation.md [section Document Structure]
test('isConformant returns true for fully conformant doc', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  assert.strictEqual(md.isConformant(doc), true);
});

// @convention conventions/documentation.md [section Document Structure]
test('getIssues reports missing required sections', () => {
  const doc    = md.parseText('# Title\n## Quick Start\nok\n## Keywords\nfoo\n', 'test.md');
  const issues = md.getIssues(doc);
  assert.ok(issues.some(i => i.includes('Index')));
  assert.ok(issues.some(i => i.includes('Changelog')));
});

// @convention conventions/documentation.md [section Keywords Rule]
test('getIssues reports empty Keywords section', () => {
  const doc    = md.parseText('# Title\n## Quick Start\nok\n## Keywords\n\n## Index\n\n## Changelog\n', 'test.md');
  const issues = md.getIssues(doc);
  assert.ok(issues.some(i => i.toLowerCase().includes('keywords')));
});

// ---------------------------------------------------------------------------
// setTitle
// ---------------------------------------------------------------------------

// @convention none — purely technical mutation behaviour
test('setTitle updates the document title', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  md.setTitle(doc, 'New Title');
  assert.strictEqual(md.getTitle(doc), 'New Title');
});

// @convention none — purely technical mutation behaviour
test('setTitle throws on empty string', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  assert.throws(() => md.setTitle(doc, ''), /non-empty/);
});

// @convention none — purely technical mutation behaviour
test('setTitle throws on non-string', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  assert.throws(() => md.setTitle(doc, null), /non-empty/);
});

// ---------------------------------------------------------------------------
// setSection
// ---------------------------------------------------------------------------

// @convention none — purely technical mutation behaviour
test('setSection replaces existing section content', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  md.setSection(doc, 'Quick Start', 'Updated content.');
  assert.strictEqual(md.getSection(doc, 'Quick Start'), 'Updated content.');
});

// @convention none — purely technical mutation behaviour
test('setSection creates new section when absent', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  md.setSection(doc, 'Rationale', 'New section content.');
  assert.strictEqual(md.getSection(doc, 'Rationale'), 'New section content.');
});

// @convention conventions/documentation.md [section Document Structure]
test('setSection inserts new section before Index', () => {
  const doc   = md.parseText(SIMPLE_DOC, 'test.md');
  md.setSection(doc, 'Rationale', 'content');
  const names = md.getSections(doc).map(s => s.name);
  const iRat  = names.indexOf('Rationale');
  const iIdx  = names.indexOf('Index');
  assert.ok(iRat < iIdx, 'Rationale should appear before Index');
});

// @convention conventions/documentation.md [section Document Structure]
test('regression: setSection inserts before Changelog when Index is absent', () => {
  const doc = md.parseText('# Title\n## Quick Start\nok\n## Keywords\nfoo\n## Changelog\n', 'test.md');
  md.setSection(doc, 'NewSection', 'content');
  const names = md.getSections(doc).map(s => s.name);
  const iNew  = names.indexOf('NewSection');
  const iCl   = names.indexOf('Changelog');
  assert.ok(iNew < iCl, 'NewSection should appear before Changelog');
});

// @convention none — purely technical mutation behaviour
test('setSection throws on empty name', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  assert.throws(() => md.setSection(doc, '', 'content'), /non-empty/);
});

// ---------------------------------------------------------------------------
// toMarkdown
// ---------------------------------------------------------------------------

// @convention conventions/documentation.md [section Document Structure]
test('toMarkdown includes H1 title', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  const out = md.toMarkdown(doc);
  assert.ok(out.startsWith('# My Title'));
});

// @convention conventions/documentation.md [section Document Structure]
test('toMarkdown includes all section headers', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  const out = md.toMarkdown(doc);
  assert.ok(out.includes('## Quick Start'));
  assert.ok(out.includes('## Keywords'));
  assert.ok(out.includes('## Index'));
  assert.ok(out.includes('## Changelog'));
});

// @convention none — purely technical reconstruction behaviour
test('toMarkdown round-trips section content', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  md.setSection(doc, 'Quick Start', 'Round-trip content.');
  const out = md.toMarkdown(doc);
  assert.ok(out.includes('Round-trip content.'));
});

// ---------------------------------------------------------------------------
// parseText — edge cases
// ---------------------------------------------------------------------------

// @convention none — edge case, no specific convention applies
test('parseText: document with title only has no sections', () => {
  const doc = md.parseText('# Title Only\n', 'test.md');
  assert.strictEqual(md.getTitle(doc), 'Title Only');
  assert.deepStrictEqual(md.getSections(doc), []);
});

// @convention none — edge case, no specific convention applies
test('parseText: empty string produces null title and no sections', () => {
  const doc = md.parseText('', 'test.md');
  assert.strictEqual(md.getTitle(doc), null);
  assert.deepStrictEqual(md.getSections(doc), []);
});

// ---------------------------------------------------------------------------
// getFilePath
// ---------------------------------------------------------------------------

// @convention none — purely technical accessor behaviour
test('getFilePath returns the filePath passed to parseText', () => {
  const doc = md.parseText(SIMPLE_DOC, 'my/path/file.md');
  assert.strictEqual(md.getFilePath(doc), 'my/path/file.md');
});

// ---------------------------------------------------------------------------
// getSection — present but empty
// ---------------------------------------------------------------------------

// @convention none — purely technical accessor behaviour
test('getSection: present section with no content returns empty string', () => {
  const doc = md.parseText('# Title\n## Quick Start\n\n## Keywords\nfoo\n## Index\n\n## Changelog\n', 'test.md');
  assert.strictEqual(md.getSection(doc, 'Quick Start'), '');
});

// @convention none — purely technical accessor behaviour
test('getSection: absent section returns null, not empty string', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  assert.strictEqual(md.getSection(doc, 'Absent'), null);
});

// ---------------------------------------------------------------------------
// getKeywords — whitespace tolerance
// ---------------------------------------------------------------------------

// @convention conventions/documentation.md [section Keywords Rule]
test('getKeywords: trims whitespace around each keyword', () => {
  const doc = md.parseText('# T\n## Quick Start\nok\n## Keywords\n  foo ,  bar ,baz  \n## Index\n\n## Changelog\n', 'test.md');
  assert.deepStrictEqual(md.getKeywords(doc), ['foo', 'bar', 'baz']);
});

// ---------------------------------------------------------------------------
// getSections — empty document
// ---------------------------------------------------------------------------

// @convention none — edge case, no specific convention applies
test('getSections: returns empty array when document has no sections', () => {
  const doc = md.parseText('# Title Only\n', 'test.md');
  assert.deepStrictEqual(md.getSections(doc), []);
});

// ---------------------------------------------------------------------------
// getIssues — all required sections missing
// ---------------------------------------------------------------------------

// @convention conventions/documentation.md [section Document Structure]
test('getIssues: reports all four required sections when document has none', () => {
  const doc    = md.parseText('# Title\n', 'test.md');
  const issues = md.getIssues(doc);
  assert.ok(issues.some(i => i.includes('Quick Start')));
  assert.ok(issues.some(i => i.includes('Keywords')));
  assert.ok(issues.some(i => i.includes('Index')));
  assert.ok(issues.some(i => i.includes('Changelog')));
});

// @convention conventions/documentation.md [section Quick Start Rule]
test('getIssues: missing Quick Start is reported', () => {
  const doc    = md.parseText('# Title\n## Keywords\nfoo\n## Index\n\n## Changelog\n', 'test.md');
  const issues = md.getIssues(doc);
  assert.ok(issues.some(i => i.includes('Quick Start')));
});

// @convention conventions/documentation.md [section Changelog Rule]
test('getIssues: missing Changelog is reported', () => {
  const doc    = md.parseText('# Title\n## Quick Start\nok\n## Keywords\nfoo\n## Index\n\n', 'test.md');
  const issues = md.getIssues(doc);
  assert.ok(issues.some(i => i.includes('Changelog')));
});

// @convention none — edge case, title is not checked by getIssues
test('getIssues: absent title does not produce an issue', () => {
  const doc    = md.parseText('## Quick Start\nok\n## Keywords\nfoo\n## Index\n\n## Changelog\n', 'test.md');
  const issues = md.getIssues(doc);
  assert.strictEqual(issues.length, 0);
});

// ---------------------------------------------------------------------------
// setSection — insert with no anchor section
// ---------------------------------------------------------------------------

// @convention none — edge case, no specific convention applies
test('setSection: inserts at end when neither Index nor Changelog exist', () => {
  const doc = md.parseText('# Title\n## Quick Start\nok\n## Keywords\nfoo\n', 'test.md');
  md.setSection(doc, 'NewSection', 'content');
  const names = md.getSections(doc).map(s => s.name);
  assert.ok(names.includes('NewSection'));
  assert.strictEqual(names[names.length - 1], 'NewSection');
});

// ---------------------------------------------------------------------------
// toMarkdown — edge cases
// ---------------------------------------------------------------------------

// @convention conventions/documentation.md [section Document Structure]
test('toMarkdown: throws when document has no title', () => {
  const doc = md.parseText('## Quick Start\nok\n## Keywords\nfoo\n## Index\n\n## Changelog\n', 'test.md');
  assert.throws(() => md.toMarkdown(doc), /title/);
});

// @convention none — purely technical reconstruction behaviour
test('toMarkdown: empty section produces heading with no content lines', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  md.setSection(doc, 'Quick Start', '');
  const out = md.toMarkdown(doc);
  assert.ok(out.includes('## Quick Start'));
  // Content between Quick Start and next section should be empty
  const afterQS = out.split('## Quick Start')[1];
  const nextSection = afterQS.trimStart();
  assert.ok(nextSection.startsWith('##'));
});

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------

process.exit(failed > 0 ? 1 : 0);
