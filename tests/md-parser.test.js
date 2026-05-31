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
const md     = require('../public/tools/lib/md-parser');

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

const DOC_WITH_SUBTITLE = [
  '# My Title',
  '',
  'A short subtitle.',
  '',
  '## Quick Start',
  'Quick start content.',
  '',
  '## Keywords',
  'foo, bar',
  '',
  '## Index',
  '',
  '## Changelog',
].join('\n');

const DOC_WITH_SUBTITLE_AND_LANGUAGE = [
  '# My Title',
  '',
  'A short subtitle.',
  '',
  '*Language: French — this document targets a French-speaking team.*',
  '',
  '## Quick Start',
  'Quick start content.',
  '',
  '## Keywords',
  'foo, bar',
  '',
  '## Index',
  '',
  '## Changelog',
].join('\n');

// Document with enough content sections to trigger TOC (>2)
const DOC_WITH_TOC_SECTIONS = [
  '# My Title',
  '',
  '## Quick Start',
  'Quick start.',
  '',
  '## Keywords',
  'foo, bar',
  '',
  '## Section One',
  'Content one.',
  '',
  '## Section Two',
  'Content two.',
  '',
  '## Section Three',
  'Content three.',
  '',
  '## Index',
  '',
  '## Changelog',
  '### Version 1.0',
].join('\n');

// Document with existing TOC and [up] links that should be ignored at parse time
const DOC_WITH_EXISTING_TOC = [
  '# My Title',
  '',
  '## Quick Start',
  'Quick start.',
  '',
  '## Keywords',
  'foo, bar',
  '',
  '## Table of Contents',
  '',
  '1. [Section One](#section-one)',
  '2. [Section Two](#section-two)',
  '3. [Index](#index)',
  '',
  '## Section One',
  '[up](#table-of-contents)',
  'Content one.',
  '',
  '## Section Two',
  '[up](#table-of-contents)',
  'Content two.',
  '',
  '## Index',
  '',
  '## Changelog',
  '### Version 1.0',
].join('\n');

// Document with a non-English TOC heading
const DOC_WITH_FRENCH_TOC = [
  '# My Title',
  '',
  '## Quick Start',
  'Quick start.',
  '',
  '## Keywords',
  'foo, bar',
  '',
  '## Table des matieres',
  '',
  '1. [Section One](#section-one)',
  '',
  '## Section One',
  'Content.',
  '',
  '## Index',
  '',
  '## Changelog',
].join('\n');

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

// @convention conventions/documentation.md [section Language]
test('getIssues: reports non-English TOC heading as non-conformant', () => {
  const doc    = md.parseText(DOC_WITH_FRENCH_TOC, 'test.md');
  const issues = md.getIssues(doc);
  assert.ok(issues.some(i => i.includes('Table des matieres')), 'non-English TOC heading should be reported');
});

// @convention conventions/documentation.md [section Language]
test('getIssues: no issue for document without any TOC', () => {
  const doc    = md.parseText(SIMPLE_DOC, 'test.md');
  const issues = md.getIssues(doc);
  assert.ok(!issues.some(i => i.includes('Table')), 'no TOC issue for document without TOC heading');
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
// insertSectionAt
// ---------------------------------------------------------------------------

// @convention conventions/tools.md [section Catalogue]
test('insertSectionAt: beginning inserts before all sections', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  const err = md.insertSectionAt(doc, 'Preamble', 'content', 'beginning');
  assert.strictEqual(err, null);
  const names = md.getSections(doc).map(s => s.name);
  assert.strictEqual(names[0], 'Preamble');
});

// @convention conventions/tools.md [section Catalogue]
test('insertSectionAt: before:<name> inserts immediately before reference', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  const err = md.insertSectionAt(doc, 'NewSection', 'content', 'before:Keywords');
  assert.strictEqual(err, null);
  const names = md.getSections(doc).map(s => s.name);
  const iNew = names.indexOf('NewSection');
  const iKw  = names.indexOf('Keywords');
  assert.ok(iNew === iKw - 1, 'NewSection should be immediately before Keywords');
});

// @convention conventions/tools.md [section Catalogue]
test('insertSectionAt: after:<name> inserts immediately after reference', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  const err = md.insertSectionAt(doc, 'NewSection', 'content', 'after:Keywords');
  assert.strictEqual(err, null);
  const names = md.getSections(doc).map(s => s.name);
  const iNew = names.indexOf('NewSection');
  const iKw  = names.indexOf('Keywords');
  assert.ok(iNew === iKw + 1, 'NewSection should be immediately after Keywords');
});

// @convention conventions/tools.md [section Catalogue]
test('insertSectionAt: returns SECTION_NOT_FOUND when reference is absent', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  const err = md.insertSectionAt(doc, 'NewSection', 'content', 'after:Nonexistent');
  assert.ok(err && err.startsWith('SECTION_NOT_FOUND'), 'should return error string');
});

// @convention none — purely technical mutation behaviour
test('insertSectionAt: does nothing when section already exists', () => {
  const doc    = md.parseText(SIMPLE_DOC, 'test.md');
  const before = md.getSections(doc).map(s => s.name);
  const err    = md.insertSectionAt(doc, 'Keywords', 'new content', 'beginning');
  assert.strictEqual(err, null);
  const after  = md.getSections(doc).map(s => s.name);
  assert.deepStrictEqual(after, before, 'sections should be unchanged');
  assert.ok(md.getSection(doc, 'Keywords') !== 'new content', 'content should not be replaced');
});

// @convention none — purely technical mutation behaviour
test('insertSectionAt: throws on invalid position format', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  assert.throws(() => md.insertSectionAt(doc, 'New', 'content', 'invalid'), /invalid position/);
});

// @convention none — purely technical mutation behaviour
test('insertSectionAt: throws on empty name', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  assert.throws(() => md.insertSectionAt(doc, '', 'content', 'beginning'), /non-empty/);
});

// ---------------------------------------------------------------------------
// deleteSection
// ---------------------------------------------------------------------------

// @convention none — purely technical mutation behaviour
test('deleteSection: removes an existing section', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  const result = md.deleteSection(doc, 'Keywords');
  assert.strictEqual(result, true);
  assert.strictEqual(md.hasSection(doc, 'Keywords'), false);
});

// @convention none — purely technical mutation behaviour
test('deleteSection: returns false when section is absent', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  const result = md.deleteSection(doc, 'Nonexistent');
  assert.strictEqual(result, false);
});

// @convention none — purely technical mutation behaviour
test('deleteSection: does not affect other sections', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  md.deleteSection(doc, 'Keywords');
  const names = md.getSections(doc).map(s => s.name);
  assert.deepStrictEqual(names, ['Quick Start', 'Index', 'Changelog']);
});

// @convention none — purely technical mutation behaviour
test('deleteSection: throws on empty name', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  assert.throws(() => md.deleteSection(doc, ''), /non-empty/);
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
  const afterQS = out.split('## Quick Start')[1];
  const nextSection = afterQS.trimStart();
  assert.ok(nextSection.startsWith('##') || nextSection.startsWith('[up]'));
});

// ---------------------------------------------------------------------------
// subtitle — parseText, getSubtitle, setSubtitle, toMarkdown
// ---------------------------------------------------------------------------

// @convention conventions/documentation.md [section Document Structure]
test('getSubtitle: returns subtitle when present', () => {
  const doc = md.parseText(DOC_WITH_SUBTITLE, 'test.md');
  assert.strictEqual(md.getSubtitle(doc), 'A short subtitle.');
});

// @convention conventions/documentation.md [section Document Structure]
test('getSubtitle: returns null when absent', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  assert.strictEqual(md.getSubtitle(doc), null);
});

// @convention conventions/documentation.md [section Document Structure]
test('setSubtitle: sets a new subtitle', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  md.setSubtitle(doc, 'New subtitle.');
  assert.strictEqual(md.getSubtitle(doc), 'New subtitle.');
});

// @convention conventions/documentation.md [section Document Structure]
test('setSubtitle: updates existing subtitle', () => {
  const doc = md.parseText(DOC_WITH_SUBTITLE, 'test.md');
  md.setSubtitle(doc, 'Updated subtitle.');
  assert.strictEqual(md.getSubtitle(doc), 'Updated subtitle.');
});

// @convention conventions/documentation.md [section Document Structure]
test('setSubtitle: empty string removes the subtitle', () => {
  const doc = md.parseText(DOC_WITH_SUBTITLE, 'test.md');
  md.setSubtitle(doc, '');
  assert.strictEqual(md.getSubtitle(doc), null);
});

// @convention conventions/documentation.md [section Document Structure]
test('toMarkdown: preserves subtitle between title and first section', () => {
  const doc = md.parseText(DOC_WITH_SUBTITLE, 'test.md');
  const out = md.toMarkdown(doc);
  const lines    = out.split('\n');
  const titleIdx = lines.findIndex(l => l.startsWith('# '));
  const qsIdx    = lines.findIndex(l => l.startsWith('## '));
  const between  = lines.slice(titleIdx + 1, qsIdx).join('\n');
  assert.ok(between.includes('A short subtitle.'), 'subtitle should appear between title and first section');
});

// @convention conventions/documentation.md [section Document Structure]
test('toMarkdown: no subtitle line when subtitle is absent', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  const out = md.toMarkdown(doc);
  const lines    = out.split('\n');
  const titleIdx = lines.findIndex(l => l.startsWith('# '));
  const qsIdx    = lines.findIndex(l => l.startsWith('## '));
  const between  = lines.slice(titleIdx + 1, qsIdx).filter(Boolean).join('\n');
  assert.strictEqual(between, '', 'no content should appear between title and first section');
});

// ---------------------------------------------------------------------------
// language — parseText, getLanguage, setLanguage, toMarkdown
// ---------------------------------------------------------------------------

// @convention conventions/documentation.md [section Language]
test('getLanguage: returns language declaration when present', () => {
  const doc = md.parseText(DOC_WITH_SUBTITLE_AND_LANGUAGE, 'test.md');
  assert.ok(md.getLanguage(doc).includes('French'));
});

// @convention conventions/documentation.md [section Language]
test('getLanguage: returns null when absent', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  assert.strictEqual(md.getLanguage(doc), null);
});

// @convention conventions/documentation.md [section Language]
test('setLanguage: sets a new language declaration', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  md.setLanguage(doc, '*Language: French — this document targets a French-speaking team.*');
  assert.ok(md.getLanguage(doc).includes('French'));
});

// @convention conventions/documentation.md [section Language]
test('setLanguage: updates existing language declaration', () => {
  const doc = md.parseText(DOC_WITH_SUBTITLE_AND_LANGUAGE, 'test.md');
  md.setLanguage(doc, '*Language: Spanish — test.*');
  assert.ok(md.getLanguage(doc).includes('Spanish'));
});

// @convention conventions/documentation.md [section Language]
test('setLanguage: empty string removes the language declaration', () => {
  const doc = md.parseText(DOC_WITH_SUBTITLE_AND_LANGUAGE, 'test.md');
  md.setLanguage(doc, '');
  assert.strictEqual(md.getLanguage(doc), null);
});

// @convention conventions/documentation.md [section Language]
test('toMarkdown: preserves language declaration after subtitle', () => {
  const doc = md.parseText(DOC_WITH_SUBTITLE_AND_LANGUAGE, 'test.md');
  const out = md.toMarkdown(doc);
  const lines  = out.split('\n');
  const qsIdx  = lines.findIndex(l => l.startsWith('## '));
  const header = lines.slice(0, qsIdx).join('\n');
  assert.ok(header.includes('*Language: French'), 'language should appear in header block');
});

// @convention conventions/documentation.md [section Language]
test('toMarkdown: no language line when language is absent', () => {
  const doc = md.parseText(DOC_WITH_SUBTITLE, 'test.md');
  const out = md.toMarkdown(doc);
  assert.ok(!out.includes('*Language:'), 'no language line should appear');
});

// @convention conventions/documentation.md [section Document Structure]
test('toMarkdown: subtitle before language in output', () => {
  const doc = md.parseText(DOC_WITH_SUBTITLE_AND_LANGUAGE, 'test.md');
  const out = md.toMarkdown(doc);
  const iSub  = out.indexOf('A short subtitle.');
  const iLang = out.indexOf('*Language:');
  assert.ok(iSub < iLang, 'subtitle should appear before language declaration');
});

// @convention conventions/documentation.md [section Document Structure]
test('update subtitle does not lose language', () => {
  const doc = md.parseText(DOC_WITH_SUBTITLE_AND_LANGUAGE, 'test.md');
  md.setSubtitle(doc, 'New subtitle.');
  assert.ok(md.getLanguage(doc).includes('French'), 'language should be preserved after subtitle update');
});

// @convention conventions/documentation.md [section Document Structure]
test('update language does not lose subtitle', () => {
  const doc = md.parseText(DOC_WITH_SUBTITLE_AND_LANGUAGE, 'test.md');
  md.setLanguage(doc, '*Language: Spanish — test.*');
  assert.strictEqual(md.getSubtitle(doc), 'A short subtitle.', 'subtitle should be preserved after language update');
});

// ---------------------------------------------------------------------------
// TOC — generation and [up] links
// ---------------------------------------------------------------------------

// @convention conventions/documentation.md [section TOC Rule]
test('toMarkdown: generates TOC when more than 2 content sections', () => {
  const doc = md.parseText(DOC_WITH_TOC_SECTIONS, 'test.md');
  const out = md.toMarkdown(doc);
  assert.ok(out.includes('## Table of Contents'), 'TOC should be generated');
});

// @convention conventions/documentation.md [section TOC Rule]
test('toMarkdown: no TOC when 2 or fewer content sections', () => {
  const doc = md.parseText(SIMPLE_DOC, 'test.md');
  const out = md.toMarkdown(doc);
  assert.ok(!out.includes('## Table of Contents'), 'TOC should not be generated for <=2 content sections');
});

// @convention conventions/documentation.md [section TOC Rule]
test('toMarkdown: TOC placed after Keywords and before first content section', () => {
  const doc = md.parseText(DOC_WITH_TOC_SECTIONS, 'test.md');
  const out = md.toMarkdown(doc);
  const iKw  = out.indexOf('## Keywords');
  const iToc = out.indexOf('## Table of Contents');
  const iS1  = out.indexOf('## Section One');
  assert.ok(iKw < iToc, 'TOC should appear after Keywords');
  assert.ok(iToc < iS1, 'TOC should appear before first content section');
});

// @convention conventions/documentation.md [section TOC Rule]
test('toMarkdown: TOC includes content sections and Index, excludes Quick Start Keywords Changelog', () => {
  const doc = md.parseText(DOC_WITH_TOC_SECTIONS, 'test.md');
  const out = md.toMarkdown(doc);
  const tocBlock = out.split('## Table of Contents')[1].split('## Section One')[0];
  assert.ok(tocBlock.includes('Section One'), 'TOC should include Section One');
  assert.ok(tocBlock.includes('Section Two'), 'TOC should include Section Two');
  assert.ok(tocBlock.includes('Section Three'), 'TOC should include Section Three');
  assert.ok(tocBlock.includes('Index'), 'TOC should include Index');
  assert.ok(!tocBlock.includes('Quick Start'), 'TOC should not include Quick Start');
  assert.ok(!tocBlock.includes('Keywords'), 'TOC should not include Keywords');
  assert.ok(!tocBlock.includes('Changelog'), 'TOC should not include Changelog');
});

// @convention conventions/documentation.md [section TOC Rule]
test('toMarkdown: TOC anchors are lowercase with spaces as hyphens', () => {
  const doc = md.parseText(DOC_WITH_TOC_SECTIONS, 'test.md');
  const out = md.toMarkdown(doc);
  assert.ok(out.includes('#section-one'), 'anchor for Section One should be #section-one');
  assert.ok(out.includes('#section-two'), 'anchor for Section Two should be #section-two');
});

// @convention conventions/documentation.md [section TOC Rule]
test('toMarkdown: content sections have [up] link after heading', () => {
  const doc = md.parseText(DOC_WITH_TOC_SECTIONS, 'test.md');
  const out = md.toMarkdown(doc);
  const afterS1 = out.split('## Section One')[1];
  assert.ok(afterS1.trimStart().startsWith('[up](#table-of-contents)'), 'Section One should have [up] link');
});

// @convention conventions/documentation.md [section TOC Rule]
test('toMarkdown: Quick Start Keywords Index Changelog have no [up] link', () => {
  const doc = md.parseText(DOC_WITH_TOC_SECTIONS, 'test.md');
  const out = md.toMarkdown(doc);
  const afterQS  = out.split('## Quick Start')[1].split('##')[0];
  const afterKW  = out.split('## Keywords')[1].split('##')[0];
  const afterIdx = out.split('## Index')[1].split('##')[0];
  assert.ok(!afterQS.includes('[up]'), 'Quick Start should have no [up] link');
  assert.ok(!afterKW.includes('[up]'), 'Keywords should have no [up] link');
  assert.ok(!afterIdx.includes('[up]'), 'Index should have no [up] link');
});

// @convention conventions/documentation.md [section TOC Rule]
test('parseText: existing Table of Contents section is ignored', () => {
  const doc   = md.parseText(DOC_WITH_EXISTING_TOC, 'test.md');
  const names = md.getSections(doc).map(s => s.name);
  assert.ok(!names.includes('Table of Contents'), 'Table of Contents should not appear in sections');
});

// @convention conventions/documentation.md [section TOC Rule]
test('parseText: [up] links are stripped from section content', () => {
  const doc = md.parseText(DOC_WITH_EXISTING_TOC, 'test.md');
  const s1  = md.getSection(doc, 'Section One');
  assert.ok(!s1.includes('[up]'), '[up] link should be stripped from section content');
  assert.ok(s1.includes('Content one.'), 'actual content should be preserved');
});

// @convention conventions/documentation.md [section TOC Rule]
test('toMarkdown: round-trip strips existing TOC and regenerates it', () => {
  const doc = md.parseText(DOC_WITH_EXISTING_TOC, 'test.md');
  const out = md.toMarkdown(doc);
  assert.ok(out.includes('## Table of Contents'), 'TOC should be regenerated');
  assert.ok(out.includes('Content one.'), 'content should be preserved');
  assert.ok(out.includes('Content two.'), 'content should be preserved');
});

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------

process.exit(failed > 0 ? 1 : 0);
