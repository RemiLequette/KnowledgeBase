/**
 * md-doc.test.js
 *
 * A priori tests for tools/md-doc.js (integration tests via child_process)
 *
 * Args: (none)
 */

'use strict';

const assert = require('assert');
const cp     = require('child_process');
const fs     = require('fs');
const path   = require('path');

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
// Paths
// ---------------------------------------------------------------------------

const TOOL         = path.join(__dirname, '..', 'md-doc.js');
const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const SANDBOX_DIR  = path.join(__dirname, 'sandbox');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns absolute path to a fixture file (read-only reference). */
function fixture(name) {
  return path.join(FIXTURES_DIR, name);
}

/**
 * Copies a fixture into the sandbox and returns the sandbox path.
 * The sandbox copy is safe to modify — the fixture is never touched.
 * @param {string} fixtureName - filename in fixtures/
 * @param {string} [destName]  - optional different name in sandbox
 */
function sandbox(fixtureName, destName) {
  const src  = fixture(fixtureName);
  const dest = path.join(SANDBOX_DIR, destName || fixtureName);
  fs.copyFileSync(src, dest);
  return dest;
}

/** Removes files from sandbox (ignores missing). */
function cleanup(...files) {
  for (const f of files) {
    try { fs.unlinkSync(f); } catch (_) {}
  }
}

/** Writes a JSON file to sandbox and returns its path. */
function sandboxJson(data, name) {
  const f = path.join(SANDBOX_DIR, name || ('tmp-' + Date.now() + '.json'));
  fs.writeFileSync(f, JSON.stringify(data, null, 2), 'utf-8');
  return f;
}

/** Reads and parses a JSON file. */
function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

/** Runs md-doc.js with given args, returns { status, lines }. */
function run(args) {
  const result = cp.spawnSync('node', [TOOL, ...args], { encoding: 'utf-8' });
  const lines  = result.stdout.trim().split('\n');
  return { status: lines[0], lines: lines.slice(1) };
}

// ---------------------------------------------------------------------------
// check — reads from fixtures directly (no writes)
// ---------------------------------------------------------------------------

// @convention conventions/documentation.md [section Document Structure]
test('check: OK on conformant document', () => {
  const r = run(['check', fixture('conformant.md')]);
  assert.strictEqual(r.status, 'OK');
  assert.strictEqual(r.lines.filter(Boolean).length, 0);
});

// @convention conventions/documentation.md [section Document Structure]
test('check: reports missing Index section', () => {
  const r = run(['check', fixture('missing-index.md')]);
  assert.strictEqual(r.status, 'OK');
  assert.ok(r.lines.some(l => l.includes('Index')));
});

// @convention conventions/documentation.md [section Keywords Rule]
test('check: reports empty Keywords section', () => {
  const r = run(['check', fixture('empty-keywords.md')]);
  assert.strictEqual(r.status, 'OK');
  assert.ok(r.lines.some(l => l.toLowerCase().includes('keywords')));
});

// @convention conventions/tools.md [section Standard Interface]
test('check: ERROR when file not found', () => {
  const r = run(['check', '/nonexistent/file.md']);
  assert.ok(r.status.startsWith('ERROR:FILE_NOT_FOUND'));
});

// ---------------------------------------------------------------------------
// dump — reads from fixtures directly (no writes to source)
// ---------------------------------------------------------------------------

// @convention conventions/md-doc-usage.md [section Lire un document]
test('dump: writes JSON output with title and all sections', () => {
  const out = path.join(SANDBOX_DIR, 'dump-output.json');
  const r   = run(['dump', fixture('conformant.md'), out]);
  assert.strictEqual(r.status, 'OK');
  const data = readJson(out);
  cleanup(out);
  assert.strictEqual(data.title, 'Conformant Document');
  assert.ok(data['Quick Start'].includes('conformant'));
  assert.ok(data['Keywords'].includes('conformant'));
  assert.ok('Index' in data);
  assert.ok('Changelog' in data);
});

// @convention conventions/tools.md [section Standard Interface]
test('dump: ERROR when file not found', () => {
  const out = path.join(SANDBOX_DIR, 'dump-missing.json');
  const r   = run(['dump', '/nonexistent/file.md', out]);
  cleanup(out);
  assert.ok(r.status.startsWith('ERROR:FILE_NOT_FOUND'));
});

// ---------------------------------------------------------------------------
// read — reads from fixtures directly (no writes to source)
// ---------------------------------------------------------------------------

// @convention conventions/md-doc-usage.md [section Lire un document]
test('read: returns requested elements', () => {
  const input = sandboxJson(['title', 'Quick Start', 'Keywords'], 'read-input.json');
  const out   = path.join(SANDBOX_DIR, 'read-output.json');
  const r     = run(['read', fixture('conformant.md'), input, out]);
  cleanup(input);
  assert.strictEqual(r.status, 'OK');
  const data = readJson(out);
  cleanup(out);
  assert.strictEqual(data.title, 'Conformant Document');
  assert.ok(data['Quick Start'].includes('conformant'));
  assert.ok(data['Keywords'].includes('conformant'));
});

// @convention conventions/md-doc-usage.md [section Lire un document]
test('read: returns null for absent section', () => {
  const input = sandboxJson(['Nonexistent'], 'read-absent-input.json');
  const out   = path.join(SANDBOX_DIR, 'read-absent-output.json');
  run(['read', fixture('conformant.md'), input, out]);
  cleanup(input);
  const data = readJson(out);
  cleanup(out);
  assert.strictEqual(data['Nonexistent'], null);
});

// @convention conventions/tools.md [section Standard Interface]
test('read: ERROR when json-input is not an array', () => {
  const input = sandboxJson({ title: true }, 'read-invalid-input.json');
  const out   = path.join(SANDBOX_DIR, 'read-invalid-output.json');
  const r     = run(['read', fixture('conformant.md'), input, out]);
  cleanup(input, out);
  assert.ok(r.status.startsWith('ERROR:INVALID_INPUT'));
});

// ---------------------------------------------------------------------------
// create — writes new files to sandbox
// ---------------------------------------------------------------------------

// @convention conventions/md-doc-usage.md [section Ecrire un document]
test('create: creates conformant document with provided content', () => {
  const dest  = path.join(SANDBOX_DIR, 'created.md');
  const input = sandboxJson({
    title:         'New Doc',
    'Quick Start': 'Created by test.',
    'Keywords':    'new, doc, test',
  }, 'create-input.json');
  const r = run(['create', dest, input]);
  cleanup(input);
  assert.strictEqual(r.status, 'OK');
  const content = fs.readFileSync(dest, 'utf-8');
  cleanup(dest);
  assert.ok(content.includes('# New Doc'));
  assert.ok(content.includes('Created by test.'));
  assert.ok(content.includes('## Keywords'));
  assert.ok(content.includes('## Index'));
  assert.ok(content.includes('## Changelog'));
});

// @convention conventions/tools.md [section Standard Interface]
test('create: ERROR when file already exists', () => {
  const dest  = sandbox('conformant.md', 'create-existing.md');
  const input = sandboxJson({ title: 'New Doc' }, 'create-existing-input.json');
  const r     = run(['create', dest, input]);
  cleanup(dest, input);
  assert.ok(r.status.startsWith('ERROR:FILE_ALREADY_EXISTS'));
});

// ---------------------------------------------------------------------------
// update — copies fixture to sandbox before modifying
// ---------------------------------------------------------------------------

// @convention conventions/md-doc-usage.md [section Ecrire un document]
test('update: replaces existing section content', () => {
  const f     = sandbox('conformant.md', 'update-replace.md');
  const input = sandboxJson({ 'Quick Start': 'Updated content.' }, 'update-replace-input.json');
  const r     = run(['update', f, input]);
  cleanup(input);
  assert.strictEqual(r.status, 'OK');
  const content = fs.readFileSync(f, 'utf-8');
  cleanup(f, f + '.bak');
  assert.ok(content.includes('Updated content.'));
});

// @convention conventions/md-doc-usage.md [section Ecrire un document]
test('update: creates backup before writing', () => {
  const f     = sandbox('conformant.md', 'update-backup.md');
  const bak   = f + '.bak';
  const input = sandboxJson({ 'Quick Start': 'Updated.' }, 'update-backup-input.json');
  run(['update', f, input]);
  cleanup(input, f);
  assert.ok(fs.existsSync(bak), 'backup file should exist');
  cleanup(bak);
});

// @convention conventions/md-doc-usage.md [section Ecrire un document]
test('update: creates new section when absent', () => {
  const f     = sandbox('conformant.md', 'update-new-section.md');
  const input = sandboxJson({ 'Rationale': 'New section via update.' }, 'update-new-section-input.json');
  run(['update', f, input]);
  cleanup(input);
  const content = fs.readFileSync(f, 'utf-8');
  cleanup(f, f + '.bak');
  assert.ok(content.includes('## Rationale'));
  assert.ok(content.includes('New section via update.'));
});

// @convention conventions/documentation.md [section Document Structure]
test('update: new section is inserted before Index', () => {
  const f     = sandbox('conformant.md', 'update-order.md');
  const input = sandboxJson({ 'Rationale': 'content' }, 'update-order-input.json');
  run(['update', f, input]);
  cleanup(input);
  const content = fs.readFileSync(f, 'utf-8');
  cleanup(f, f + '.bak');
  const iRat = content.indexOf('## Rationale');
  const iIdx = content.indexOf('## Index');
  assert.ok(iRat < iIdx, 'Rationale should appear before Index');
});

// @convention conventions/tools.md [section Standard Interface]
test('update: ERROR when file not found', () => {
  const input = sandboxJson({ 'Quick Start': 'x' }, 'update-missing-input.json');
  const r     = run(['update', '/nonexistent/file.md', input]);
  cleanup(input);
  assert.ok(r.status.startsWith('ERROR:FILE_NOT_FOUND'));
});

// ---------------------------------------------------------------------------
// restore — copies fixture to sandbox, creates manual backup, then restores
// ---------------------------------------------------------------------------

// @convention conventions/md-doc-usage.md [section Ecrire un document]
test('restore: restores file from backup and removes backup', () => {
  const f   = sandbox('conformant.md', 'restore-target.md');
  const bak = f + '.bak';
  fs.copyFileSync(fixture('missing-index.md'), bak);
  const r       = run(['restore', f]);
  assert.strictEqual(r.status, 'OK');
  const content = fs.readFileSync(f, 'utf-8');
  cleanup(f);
  assert.ok(content.includes('Missing Index Document'), 'file should be restored from backup');
  assert.ok(!fs.existsSync(bak), 'backup should be removed after restore');
});

// @convention conventions/tools.md [section Standard Interface]
test('restore: ERROR when no backup exists', () => {
  const f = sandbox('conformant.md', 'restore-no-bak.md');
  const r = run(['restore', f]);
  cleanup(f);
  assert.ok(r.status.startsWith('ERROR:FILE_NOT_FOUND'));
});

// @convention conventions/md-doc-usage.md [section Ecrire un document]
test('update: empty title value leaves existing title unchanged', () => {
  const f     = sandbox('conformant.md', 'update-empty-title.md');
  const input = sandboxJson({ title: '' }, 'update-empty-title-input.json');
  const r     = run(['update', f, input]);
  cleanup(input);
  assert.strictEqual(r.status, 'OK');
  const content = fs.readFileSync(f, 'utf-8');
  cleanup(f, f + '.bak');
  assert.ok(content.includes('# Conformant Document'), 'title should be unchanged');
});

// ---------------------------------------------------------------------------
// Missing args
// ---------------------------------------------------------------------------

// @convention conventions/tools.md [section Standard Interface]
test('missing command: ERROR', () => {
  const r = run([]);
  assert.ok(r.status.startsWith('ERROR:'));
});

// @convention conventions/tools.md [section Standard Interface]
test('read missing args: ERROR', () => {
  const r = run(['read', '/some/file.md']);
  assert.ok(r.status.startsWith('ERROR:MISSING_ARG'));
});

// @convention conventions/tools.md [section Standard Interface]
test('dump missing args: ERROR', () => {
  const r = run(['dump', '/some/file.md']);
  assert.ok(r.status.startsWith('ERROR:MISSING_ARG'));
});

// @convention conventions/tools.md [section Standard Interface]
test('create missing args: ERROR', () => {
  const r = run(['create', '/some/file.md']);
  assert.ok(r.status.startsWith('ERROR:MISSING_ARG'));
});

// @convention conventions/tools.md [section Standard Interface]
test('update missing args: ERROR', () => {
  const r = run(['update', '/some/file.md']);
  assert.ok(r.status.startsWith('ERROR:MISSING_ARG'));
});

// @convention conventions/tools.md [section Standard Interface]
test('restore missing args: ERROR', () => {
  const r = run(['restore']);
  assert.ok(r.status.startsWith('ERROR:MISSING_ARG'));
});

// @convention conventions/tools.md [section Standard Interface]
test('unknown command: ERROR', () => {
  const r = run(['unknown']);
  assert.ok(r.status.startsWith('ERROR:'));
});

// ---------------------------------------------------------------------------
// check — required sections
// ---------------------------------------------------------------------------

// @convention conventions/documentation.md [section Document Structure]
test('check: reports missing Quick Start section', () => {
  const f = path.join(SANDBOX_DIR, 'check-missing-qs.md');
  fs.writeFileSync(f, '# Title\n## Keywords\nfoo\n## Index\n\n## Changelog\n', 'utf-8');
  const r = run(['check', f]);
  cleanup(f);
  assert.strictEqual(r.status, 'OK');
  assert.ok(r.lines.some(l => l.includes('Quick Start')));
});

// @convention conventions/documentation.md [section Document Structure]
test('check: reports missing Changelog section', () => {
  const f = path.join(SANDBOX_DIR, 'check-missing-changelog.md');
  fs.writeFileSync(f, '# Title\n## Quick Start\nok\n## Keywords\nfoo\n## Index\n\n', 'utf-8');
  const r = run(['check', f]);
  cleanup(f);
  assert.strictEqual(r.status, 'OK');
  assert.ok(r.lines.some(l => l.includes('Changelog')));
});

// ---------------------------------------------------------------------------
// read — edge cases
// ---------------------------------------------------------------------------

// @convention conventions/md-doc-usage.md [section Lire un document]
test('read: empty input array returns empty object', () => {
  const input = sandboxJson([], 'read-empty-input.json');
  const out   = path.join(SANDBOX_DIR, 'read-empty-output.json');
  const r     = run(['read', fixture('conformant.md'), input, out]);
  cleanup(input);
  assert.strictEqual(r.status, 'OK');
  const data = readJson(out);
  cleanup(out);
  assert.deepStrictEqual(data, {});
});

// ---------------------------------------------------------------------------
// create — edge cases
// ---------------------------------------------------------------------------

// @convention conventions/tools.md [section Standard Interface]
test('create: ERROR when input is an array instead of object', () => {
  const dest  = path.join(SANDBOX_DIR, 'create-array-input.md');
  const input = sandboxJson(['title', 'foo'], 'create-array-input.json');
  const r     = run(['create', dest, input]);
  cleanup(dest, input);
  assert.ok(r.status.startsWith('ERROR:INVALID_INPUT'));
});

// @convention conventions/tools.md [section Standard Interface]
test('create: ERROR when title is absent', () => {
  const dest  = path.join(SANDBOX_DIR, 'create-no-title.md');
  const input = sandboxJson({ 'Quick Start': 'No title doc.', Keywords: 'foo' }, 'create-no-title-input.json');
  const r     = run(['create', dest, input]);
  cleanup(input, dest);
  assert.ok(r.status.startsWith('ERROR:'), 'create without title should return ERROR');
});

// @convention conventions/documentation.md [section Document Structure]
test('create: canonical section order — Quick Start before Keywords', () => {
  const dest  = path.join(SANDBOX_DIR, 'create-order.md');
  const input = sandboxJson({
    title:         'Order Test',
    Keywords:      'order, test',
    'Quick Start': 'Testing order.',
  }, 'create-order-input.json');
  run(['create', dest, input]);
  cleanup(input);
  const content = fs.readFileSync(dest, 'utf-8');
  cleanup(dest);
  const iQS  = content.indexOf('## Quick Start');
  const iKW  = content.indexOf('## Keywords');
  assert.ok(iQS < iKW, 'Quick Start should appear before Keywords');
});

// ---------------------------------------------------------------------------
// update — edge cases
// ---------------------------------------------------------------------------

// @convention conventions/tools.md [section Standard Interface]
test('update: ERROR when input is an array instead of object', () => {
  const f     = sandbox('conformant.md', 'update-array-input.md');
  const input = sandboxJson(['Quick Start'], 'update-array-input.json');
  const r     = run(['update', f, input]);
  cleanup(f, input);
  assert.ok(r.status.startsWith('ERROR:INVALID_INPUT'));
});

// @convention conventions/md-doc-usage.md [section Ecrire un document]
test('update: updates title when title key is provided', () => {
  const f     = sandbox('conformant.md', 'update-title.md');
  const input = sandboxJson({ title: 'Updated Title' }, 'update-title-input.json');
  const r     = run(['update', f, input]);
  cleanup(input);
  assert.strictEqual(r.status, 'OK');
  const content = fs.readFileSync(f, 'utf-8');
  cleanup(f, f + '.bak');
  assert.ok(content.includes('# Updated Title'));
});

// ---------------------------------------------------------------------------
// round-trip: dump -> compare -> update -> dump -> compare
// ---------------------------------------------------------------------------

// @convention conventions/documentation.md [section Document Structure]
test('round-trip: dump sections match direct filesystem read, update preserves content', () => {
  // Step 1 — dump the fixture into JSON
  const src     = fixture('conformant.md');
  const dump1   = path.join(SANDBOX_DIR, 'roundtrip-dump1.json');
  const r1      = run(['dump', src, dump1]);
  assert.strictEqual(r1.status, 'OK', 'dump step 1 failed: ' + r1.status);
  const dumped1 = readJson(dump1);
  cleanup(dump1);

  // Step 2 — read the fixture directly and parse sections with md-parser
  // (require inline to stay self-contained)
  const mdParser  = require('../lib/md-parser');
  const doc       = mdParser.parseFile(src);
  const sections  = mdParser.getSections(doc);

  // Every section returned by dump must match the direct parse
  for (const s of sections) {
    assert.strictEqual(
      dumped1[s.name],
      s.content,
      `Section "${s.name}" content mismatch between dump and direct parse`
    );
  }
  assert.strictEqual(dumped1.title, mdParser.getTitle(doc), 'title mismatch between dump and direct parse');

  // Step 3 — update a sandbox copy with the dumped content
  const target    = sandbox('conformant.md', 'roundtrip-target.md');
  const updateInput = {};
  for (const s of sections) {
    updateInput[s.name] = dumped1[s.name];
  }
  const updateJson = sandboxJson(updateInput, 'roundtrip-update-input.json');
  const r2         = run(['update', target, updateJson]);
  cleanup(updateJson);
  assert.strictEqual(r2.status, 'OK', 'update step failed: ' + r2.status);

  // Step 4 — dump the updated file
  const dump2   = path.join(SANDBOX_DIR, 'roundtrip-dump2.json');
  const r3      = run(['dump', target, dump2]);
  cleanup(target, target + '.bak');
  assert.strictEqual(r3.status, 'OK', 'dump step 2 failed: ' + r3.status);
  const dumped2 = readJson(dump2);
  cleanup(dump2);

  // Step 5 — compare dump1 and dump2 section by section
  for (const s of sections) {
    assert.strictEqual(
      dumped2[s.name],
      dumped1[s.name],
      `Section "${s.name}" content changed after update round-trip`
    );
  }
  assert.strictEqual(dumped2.title, dumped1.title, 'title changed after update round-trip');
});

// ---------------------------------------------------------------------------
// round-trip on real KB files
// NOTE: tmp files go to knowledgebase/tmp/ (KB maintenance convention).
// TODO: move this test to tools/tests/ at KB root once tests are relocated.
// ---------------------------------------------------------------------------

const KB_ROOT      = path.join(__dirname, '..', '..', '..', '..');
const KB_TMP       = path.join(KB_ROOT, 'tmp');
const KB_CONV      = path.join(KB_ROOT, 'public', 'conventions');

const KB_ROUNDTRIP_FILES = [
  path.join(KB_CONV, 'documentation.md'),
  path.join(KB_CONV, 'md-doc-usage.md'),
  path.join(KB_CONV, 'filesystem.md'),
];

// Ensure tmp/ exists
if (!fs.existsSync(KB_TMP)) fs.mkdirSync(KB_TMP, { recursive: true });

for (const srcFile of KB_ROUNDTRIP_FILES) {
  const name = path.basename(srcFile, '.md');

  test(`round-trip KB file: ${name}`, () => {
    const dump1Path  = path.join(KB_TMP, `md-doc-roundtrip-${name}-dump1.json`);
    const dump2Path  = path.join(KB_TMP, `md-doc-roundtrip-${name}-dump2.json`);
    const updatePath = path.join(KB_TMP, `md-doc-roundtrip-${name}-update.json`);
    const targetPath = path.join(KB_TMP, `md-doc-roundtrip-${name}-target.md`);

    try {
      // Step 1 — dump the KB file
      const r1 = run(['dump', srcFile, dump1Path]);
      assert.strictEqual(r1.status, 'OK', 'dump step 1 failed: ' + r1.status);
      const dumped1 = readJson(dump1Path);

      // Step 2 — compare dump output with direct md-parser read
      const mdParser = require('../lib/md-parser');
      const doc      = mdParser.parseFile(srcFile);
      const sections = mdParser.getSections(doc);

      for (const s of sections) {
        assert.strictEqual(
          dumped1[s.name],
          s.content,
          `[${name}] Section "${s.name}" mismatch between dump and direct parse`
        );
      }
      assert.strictEqual(
        dumped1.title,
        mdParser.getTitle(doc),
        `[${name}] title mismatch between dump and direct parse`
      );

      // Step 3 — update a tmp copy with the dumped content
      fs.copyFileSync(srcFile, targetPath);
      const updateInput = {};
      for (const s of sections) {
        updateInput[s.name] = dumped1[s.name];
      }
      fs.writeFileSync(updatePath, JSON.stringify(updateInput, null, 2), 'utf-8');
      const r2 = run(['update', targetPath, updatePath]);
      assert.strictEqual(r2.status, 'OK', 'update step failed: ' + r2.status);

      // Step 4 — dump the updated file
      const r3 = run(['dump', targetPath, dump2Path]);
      assert.strictEqual(r3.status, 'OK', 'dump step 2 failed: ' + r3.status);
      const dumped2 = readJson(dump2Path);

      // Step 5 — compare dump1 and dump2 section by section
      for (const s of sections) {
        assert.strictEqual(
          dumped2[s.name],
          dumped1[s.name],
          `[${name}] Section "${s.name}" changed after update round-trip`
        );
      }
      assert.strictEqual(
        dumped2.title,
        dumped1.title,
        `[${name}] title changed after update round-trip`
      );

    } finally {
      // Always clean up tmp files, even on failure
      for (const f of [dump1Path, dump2Path, updatePath, targetPath, targetPath + '.bak']) {
        try { fs.unlinkSync(f); } catch (_) {}
      }
    }
  });
}

// ---------------------------------------------------------------------------
// mutation tests on real KB file: documentation.md
// NOTE: tmp files go to knowledgebase/tmp/.
// TODO: move this test to tools/tests/ at KB root once tests are relocated.
// ---------------------------------------------------------------------------

const MUTATION_SRC  = path.join(KB_CONV, 'documentation.md');
const MUTATION_NAME = 'documentation';

/**
 * Prepares a fresh tmp copy of documentation.md for a mutation test.
 * Returns the tmp file path.
 */
function mutationTarget() {
  const p = path.join(KB_TMP, `md-doc-mutation-${MUTATION_NAME}-${Date.now()}.md`);
  fs.copyFileSync(MUTATION_SRC, p);
  return p;
}

/**
 * Runs md-doc read on a single section, returns its content string.
 */
function readSection(filePath, sectionName) {
  const inputPath  = path.join(KB_TMP, `md-doc-mutation-read-input-${Date.now()}.json`);
  const outputPath = path.join(KB_TMP, `md-doc-mutation-read-output-${Date.now()}.json`);
  fs.writeFileSync(inputPath, JSON.stringify([sectionName], null, 2), 'utf-8');
  const r = run(['read', filePath, inputPath, outputPath]);
  try { fs.unlinkSync(inputPath); } catch (_) {}
  if (!r.status.startsWith('OK')) {
    try { fs.unlinkSync(outputPath); } catch (_) {}
    throw new Error('read failed: ' + r.status);
  }
  const data = readJson(outputPath);
  try { fs.unlinkSync(outputPath); } catch (_) {}
  return data[sectionName];
}

/**
 * Runs md-doc update with a single key/value pair.
 */
function updateSection(filePath, sectionName, content) {
  const inputPath = path.join(KB_TMP, `md-doc-mutation-update-input-${Date.now()}.json`);
  fs.writeFileSync(inputPath, JSON.stringify({ [sectionName]: content }, null, 2), 'utf-8');
  const r = run(['update', filePath, inputPath]);
  try { fs.unlinkSync(inputPath); } catch (_) {}
  return r;
}

// ---------------------------------------------------------------------------
// mandatory sections — replace content
// ---------------------------------------------------------------------------

// @convention conventions/md-doc-usage.md [section Ecrire un document]
test('mutation: replace Quick Start content', () => {
  const f = mutationTarget();
  try {
    const newContent = 'Replaced Quick Start content for mutation test.';
    const r = updateSection(f, 'Quick Start', newContent);
    assert.strictEqual(r.status, 'OK');
    assert.strictEqual(readSection(f, 'Quick Start'), newContent);
  } finally {
    cleanup(f, f + '.bak');
  }
});

// @convention conventions/md-doc-usage.md [section Ecrire un document]
test('mutation: replace Keywords content', () => {
  const f = mutationTarget();
  try {
    const newContent = 'mutation, test, keywords';
    const r = updateSection(f, 'Keywords', newContent);
    assert.strictEqual(r.status, 'OK');
    assert.strictEqual(readSection(f, 'Keywords'), newContent);
  } finally {
    cleanup(f, f + '.bak');
  }
});

// @convention conventions/md-doc-usage.md [section Ecrire un document]
test('mutation: empty Index content leaves section present', () => {
  const f = mutationTarget();
  try {
    const r = updateSection(f, 'Index', '');
    assert.strictEqual(r.status, 'OK');
    assert.strictEqual(readSection(f, 'Index'), '');
  } finally {
    cleanup(f, f + '.bak');
  }
});

// @convention conventions/md-doc-usage.md [section Ecrire un document]
test('mutation: prepend entry to Changelog', () => {
  const f = mutationTarget();
  try {
    const original = readSection(f, 'Changelog');
    const newEntry  = '### Version 99.0 - Mutation test\n**Date:** 2026-05-31\n**Reason:** Test entry.\n\n---\n\n';
    const r = updateSection(f, 'Changelog', newEntry + original);
    assert.strictEqual(r.status, 'OK');
    const updated = readSection(f, 'Changelog');
    assert.ok(updated.startsWith('### Version 99.0'), 'new entry should be at the top');
    assert.ok(updated.includes(original.slice(0, 40)), 'original content should be preserved');
  } finally {
    cleanup(f, f + '.bak');
  }
});

// ---------------------------------------------------------------------------
// non-mandatory sections — add at beginning and middle
// ---------------------------------------------------------------------------

// @convention conventions/md-doc-usage.md [section Ecrire un document]
test('mutation: add section at beginning — appears before Document Structure', () => {
  const f = mutationTarget();
  try {
    // TODO: this test defines the expected behaviour for position control (not yet implemented).
    // Once md-doc supports insert position, update with: insert before Document Structure.
    // For now, verify the section is created and readable.
    const r = updateSection(f, 'Preamble', 'Section added at beginning.');
    assert.strictEqual(r.status, 'OK');
    const content = fs.readFileSync(f, 'utf-8');
    const iPreamble = content.indexOf('## Preamble');
    const iDocStruct = content.indexOf('## Document Structure');
    assert.ok(iPreamble !== -1, 'Preamble section should exist');
    assert.ok(iPreamble < iDocStruct, 'Preamble should appear before Document Structure');
  } finally {
    cleanup(f, f + '.bak');
  }
});

// @convention conventions/md-doc-usage.md [section Ecrire un document]
test('mutation: add section in middle — appears between Language and Numbering', () => {
  const f = mutationTarget();
  try {
    // TODO: this test defines the expected behaviour for position control (not yet implemented).
    // Once md-doc supports insert position, update with: insert after Language.
    // For now, verify the section is created and readable.
    const r = updateSection(f, 'Interlude', 'Section added in the middle.');
    assert.strictEqual(r.status, 'OK');
    const content = fs.readFileSync(f, 'utf-8');
    const iInterlude = content.indexOf('## Interlude');
    const iLanguage  = content.indexOf('## Language');
    const iNumbering = content.indexOf('## Numbering');
    assert.ok(iInterlude !== -1, 'Interlude section should exist');
    assert.ok(iLanguage < iInterlude && iInterlude < iNumbering,
      'Interlude should appear between Language and Numbering');
  } finally {
    cleanup(f, f + '.bak');
  }
});

// ---------------------------------------------------------------------------
// delete section (spec: md-doc delete command — not yet implemented)
// ---------------------------------------------------------------------------

// @convention conventions/md-doc-usage.md [section Ecrire un document]
test('mutation: delete non-mandatory section removes it from the document', () => {
  const f = mutationTarget();
  try {
    // First add a section to delete
    updateSection(f, 'ToDelete', 'This section will be deleted.');
    assert.ok(fs.readFileSync(f, 'utf-8').includes('## ToDelete'), 'section should exist before delete');

    // TODO: replace with run(['delete', f, 'ToDelete']) once delete command is implemented
    const r = run(['delete', f, 'ToDelete']);
    assert.strictEqual(r.status, 'OK', 'delete should succeed');
    assert.ok(!fs.readFileSync(f, 'utf-8').includes('## ToDelete'), 'section should be gone after delete');
  } finally {
    cleanup(f, f + '.bak');
  }
});

// @convention conventions/md-doc-usage.md [section Ecrire un document]
test('mutation: delete mandatory section returns ERROR', () => {
  const f = mutationTarget();
  try {
    // TODO: replace with run(['delete', f, 'Quick Start']) once delete command is implemented
    const r = run(['delete', f, 'Quick Start']);
    assert.ok(r.status.startsWith('ERROR:'), 'deleting a mandatory section should return ERROR');
    assert.ok(fs.readFileSync(f, 'utf-8').includes('## Quick Start'), 'Quick Start should still be present');
  } finally {
    cleanup(f, f + '.bak');
  }
});

// ---------------------------------------------------------------------------
// non-conformant file — update/read/dump must return ERROR:NOT_CONFORMANT
// ---------------------------------------------------------------------------

// @convention conventions/documentation.md [section Document Structure]
test('mutation: update on non-conformant file returns ERROR:NOT_CONFORMANT', () => {
  const f = path.join(KB_TMP, `md-doc-mutation-nonconformant-${Date.now()}.md`);
  fs.writeFileSync(f, '# Title\n## Quick Start\nok\n', 'utf-8'); // missing Keywords, Index, Changelog
  try {
    const r = updateSection(f, 'Quick Start', 'new content');
    assert.ok(r.status.startsWith('ERROR:NOT_CONFORMANT'), 'update on non-conformant file should fail');
  } finally {
    cleanup(f);
  }
});

// @convention conventions/documentation.md [section Document Structure]
test('mutation: read on non-conformant file returns ERROR:NOT_CONFORMANT', () => {
  const f = path.join(KB_TMP, `md-doc-mutation-nonconformant-read-${Date.now()}.md`);
  fs.writeFileSync(f, '# Title\n## Quick Start\nok\n', 'utf-8');
  try {
    const r = readSection(f, 'Quick Start');
    // readSection throws on ERROR — catch and verify
    assert.fail('read on non-conformant file should have thrown');
  } catch (e) {
    assert.ok(e.message.includes('NOT_CONFORMANT'), 'error should mention NOT_CONFORMANT');
  } finally {
    cleanup(f);
  }
});

// @convention conventions/documentation.md [section Document Structure]
test('mutation: dump on non-conformant file returns ERROR:NOT_CONFORMANT', () => {
  const f      = path.join(KB_TMP, `md-doc-mutation-nonconformant-dump-${Date.now()}.md`);
  const outPath = path.join(KB_TMP, `md-doc-mutation-nonconformant-dump-out-${Date.now()}.json`);
  fs.writeFileSync(f, '# Title\n## Quick Start\nok\n', 'utf-8');
  try {
    const r = run(['dump', f, outPath]);
    assert.ok(r.status.startsWith('ERROR:NOT_CONFORMANT'), 'dump on non-conformant file should fail');
  } finally {
    cleanup(f, outPath);
  }
});

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------

process.exit(failed > 0 ? 1 : 0);
