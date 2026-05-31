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

test('parseText parses H1 title', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  assert.strictEqual(md.getTitle(doc), 'My Title');
});

test('getTitle returns null when no H1', () => {
  const doc = md.parseText('## Quick Start\nno title here', 'test.md');
  assert.strictEqual(md.getTitle(doc), null);
});

test('parseText requires filePath argument', () => {
  assert.throws(() => md.parseText('# Title'), /filePath/);
});

// ---------------------------------------------------------------------------
// getSection / hasSection
// ---------------------------------------------------------------------------

test('getSection returns section content', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  const qs  = md.getSection(doc, 'Quick Start');
  assert.ok(qs.includes('quick start'));
});

test('getSection returns null when section absent', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  assert.strictEqual(md.getSection(doc, 'Nonexistent'), null);
});

test('hasSection returns true when section present', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  assert.strictEqual(md.hasSection(doc, 'Keywords'), true);
});

test('hasSection returns false when section absent', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  assert.strictEqual(md.hasSection(doc, 'Rationale'), false);
});

// ---------------------------------------------------------------------------
// getKeywords
// ---------------------------------------------------------------------------

test('getKeywords returns array of trimmed strings', () => {
  const doc      = md.parseText(SIMPLE_DOC, 'test.md');
  const keywords = md.getKeywords(doc);
  assert.deepStrictEqual(keywords, ['foo', 'bar', 'baz']);
});

test('getKeywords returns empty array when Keywords section absent', () => {
  const doc = md.parseText('# Title\n## Index\n', 'test.md');
  assert.deepStrictEqual(md.getKeywords(doc), []);
});

// ---------------------------------------------------------------------------
// getSections
// ---------------------------------------------------------------------------

test('getSections returns sections in document order', () => {
  const doc   = md.parseText(SIMPLE_DOC, 'test.md');
  const names = md.getSections(doc).map(s => s.name);
  assert.deepStrictEqual(names, ['Quick Start', 'Keywords', 'Index', 'Changelog']);
});

// ---------------------------------------------------------------------------
// getIssues / isConformant
// ---------------------------------------------------------------------------

test('isConformant returns true for fully conformant doc', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  assert.strictEqual(md.isConformant(doc), true);
});

test('getIssues reports missing required sections', () => {
  const doc    = md.parseText('# Title\n## Quick Start\nok\n## Keywords\nfoo\n', 'test.md');
  const issues = md.getIssues(doc);
  assert.ok(issues.some(i => i.includes('Index')));
  assert.ok(issues.some(i => i.includes('Changelog')));
});

test('getIssues reports empty Keywords section', () => {
  const doc    = md.parseText('# Title\n## Quick Start\nok\n## Keywords\n\n## Index\n\n## Changelog\n', 'test.md');
  const issues = md.getIssues(doc);
  assert.ok(issues.some(i => i.toLowerCase().includes('keywords')));
});

// ---------------------------------------------------------------------------
// setTitle
// ---------------------------------------------------------------------------

test('setTitle updates the document title', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  md.setTitle(doc, 'New Title');
  assert.strictEqual(md.getTitle(doc), 'New Title');
});

test('setTitle throws on empty string', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  assert.throws(() => md.setTitle(doc, ''), /non-empty/);
});

test('setTitle throws on non-string', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  assert.throws(() => md.setTitle(doc, null), /non-empty/);
});

// ---------------------------------------------------------------------------
// setSection
// ---------------------------------------------------------------------------

test('setSection replaces existing section content', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  md.setSection(doc, 'Quick Start', 'Updated content.');
  assert.strictEqual(md.getSection(doc, 'Quick Start'), 'Updated content.');
});

test('setSection creates new section when absent', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  md.setSection(doc, 'Rationale', 'New section content.');
  assert.strictEqual(md.getSection(doc, 'Rationale'), 'New section content.');
});

test('setSection inserts new section before Index', () => {
  const doc   = md.parseText(SIMPLE_DOC, 'test.md');
  md.setSection(doc, 'Rationale', 'content');
  const names = md.getSections(doc).map(s => s.name);
  const iRat  = names.indexOf('Rationale');
  const iIdx  = names.indexOf('Index');
  assert.ok(iRat < iIdx, 'Rationale should appear before Index');
});

test('regression: setSection inserts before Changelog when Index is absent', () => {
  const doc = md.parseText('# Title\n## Quick Start\nok\n## Keywords\nfoo\n## Changelog\n', 'test.md');
  md.setSection(doc, 'NewSection', 'content');
  const names = md.getSections(doc).map(s => s.name);
  const iNew  = names.indexOf('NewSection');
  const iCl   = names.indexOf('Changelog');
  assert.ok(iNew < iCl, 'NewSection should appear before Changelog');
});

test('setSection throws on empty name', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  assert.throws(() => md.setSection(doc, '', 'content'), /non-empty/);
});

// ---------------------------------------------------------------------------
// toMarkdown
// ---------------------------------------------------------------------------

test('toMarkdown includes H1 title', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  const out = md.toMarkdown(doc);
  assert.ok(out.startsWith('# My Title'));
});

test('toMarkdown includes all section headers', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  const out = md.toMarkdown(doc);
  assert.ok(out.includes('## Quick Start'));
  assert.ok(out.includes('## Keywords'));
  assert.ok(out.includes('## Index'));
  assert.ok(out.includes('## Changelog'));
});

test('toMarkdown round-trips section content', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  md.setSection(doc, 'Quick Start', 'Round-trip content.');
  const out = md.toMarkdown(doc);
  assert.ok(out.includes('Round-trip content.'));
});

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------

process.exit(failed > 0 ? 1 : 0);
