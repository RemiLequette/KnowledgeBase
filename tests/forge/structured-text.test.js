/**
 * structured-text.test.js
 *
 * Unit tests for handlers/structured-text.js v3.0
 * Tests: claim (extension, shebang, matchName), listBlocks, readBlock, writeBlock, createArtifact.
 *
 * References:
 *   - conventions/structured-text.md
 *   - conventions/forge.md v7.2 [section Type handlers]
 */

import assert from 'assert';
import fs from 'fs';
import { init } from '../../public/tools/forge/handlers/structured-text.js';
import { urlRef, urlRefPath, sandboxCreate, sandboxClean, sandboxRead, FIXTURES_DIR } from './helpers.js';

// ---------------------------------------------------------------------------
// IRootRegistry stub
// ---------------------------------------------------------------------------

const rootRegistry = {
  async create(ref) {
    const p = urlRefPath(ref);
    if (fs.existsSync(p)) throw new Error(`File already exists: ${p}`);
    fs.writeFileSync(p, '', 'utf8');
  },
  async read(ref) {
    const p = urlRefPath(ref);
    if (!fs.existsSync(p)) throw new Error(`File not found: ${p}`);
    return fs.readFileSync(p, 'utf8');
  },
  async write(ref, content) {
    const p = urlRefPath(ref);
    if (!fs.existsSync(p)) throw new Error(`File does not exist: ${p} — call forge_create first`);
    fs.writeFileSync(p, content, 'utf8');
  },
  async delete(ref) { fs.unlinkSync(urlRefPath(ref)); }
};

// ---------------------------------------------------------------------------
// Handler instances
// ---------------------------------------------------------------------------

// Plain md — extension only, no shebang, no matchName, no blocks
const mdHandler = await init({ name: 'md', version: '1.0',
  handler: '', description: 'a Markdown document' });

// js-managed — shebang + extension override + block grammar
const jsManagedHandler = await init({
  name: 'js-managed', version: '1.0', handler: '',
  description: 'a managed JavaScript source file with named blocks',
  extension: 'js',
  shebang: '// @forge-type: js-managed',
  blocks: {
    separators: [
      { type: 'regex', pattern: '^// ====\\[ (.+?) \\]====$', nameGroup: 1, repeat: '+' }
    ]
  }
});

// md-structured — block grammar with Changelog special case
const mdStructuredHandler = await init({
  name: 'md-structured', version: '1.0', handler: '',
  description: 'a structured Markdown document with named sections',
  blocks: {
    separators: [
      {
        type: 'regex', pattern: '^## (.+)$', nameGroup: 1,
        name: 'Changelog', repeat: 1, template: '## {name}',
        blocks: {
          separators: [
            { type: 'regex', pattern: '^### (.+)$', nameGroup: 1, repeat: '*', template: '### {name}' }
          ]
        }
      },
      { type: 'regex', pattern: '^## (.+)$', nameGroup: 1, repeat: '+', template: '## {name}' }
    ]
  }
});

// doc-todolist — matchName + extension: 'md' + block grammar
// matchName is tested against urlRef.name (filename stem without extension)
const todoHandler = await init({
  name: 'doc-todolist', version: '1.0', handler: '',
  description: 'a TODO list document',
  extension: 'md',
  matchName: '^sample-todo$',
  blocks: {
    separators: [
      {
        type: 'regex', pattern: '^## (.+)$', nameGroup: 1,
        name: 'Changelog', repeat: 1, template: '## {name}',
        blocks: {
          separators: [
            { type: 'regex', pattern: '^### (.+)$', nameGroup: 1, repeat: '*', template: '### {name}' }
          ]
        }
      },
      { type: 'regex', pattern: '^## (.+)$', nameGroup: 1, repeat: '+', template: '## {name}' }
    ]
  }
});

// UrlRefs for fixtures
const MANAGED_REF    = urlRef('sample-managed', '.js');
const STRUCTURED_REF = urlRef('sample-structured', '.md');
const TODO_REF       = urlRef('sample-todo', '.md');
const SAMPLE_MD_REF  = urlRef('sample', '.md');
const PLAIN_JS_REF   = urlRef('sample-plain', '.js');

let failed = 0;
async function testAsync(name, fn) {
  try   { await fn(); console.log('PASS: ' + name); }
  catch (e) { console.log('FAIL: ' + name + ' — ' + e.message); failed++; }
}

// ---------------------------------------------------------------------------
// claim — extension only (md)
// ---------------------------------------------------------------------------

await testAsync('md claim: .md → true', async () => {
  assert.strictEqual(await mdHandler.claim(urlRef('f', '.md'), rootRegistry), true);
});
await testAsync('md claim: .txt → false', async () => {
  assert.strictEqual(await mdHandler.claim(urlRef('f', '.txt'), rootRegistry), false);
});

// ---------------------------------------------------------------------------
// claim — shebang (js-managed)
// ---------------------------------------------------------------------------

await testAsync('js-managed claim: .js with shebang → true', async () => {
  assert.strictEqual(await jsManagedHandler.claim(MANAGED_REF, rootRegistry), true);
});
await testAsync('js-managed claim: .js without shebang → false', async () => {
  assert.strictEqual(await jsManagedHandler.claim(PLAIN_JS_REF, rootRegistry), false);
});
await testAsync('js-managed claim: .md → false', async () => {
  assert.strictEqual(await jsManagedHandler.claim(SAMPLE_MD_REF, rootRegistry), false);
});

// ---------------------------------------------------------------------------
// claim — matchName (doc-todolist)
// ---------------------------------------------------------------------------

await testAsync('doc-todolist claim: name matches → true', async () => {
  assert.strictEqual(await todoHandler.claim(TODO_REF, rootRegistry), true);
});
await testAsync('doc-todolist claim: name does not match → false', async () => {
  assert.strictEqual(await todoHandler.claim(SAMPLE_MD_REF, rootRegistry), false);
});
await testAsync('doc-todolist claim: wrong extension → false', async () => {
  assert.strictEqual(await todoHandler.claim(urlRef('sample-todo', '.txt'), rootRegistry), false);
});

// ---------------------------------------------------------------------------
// describe
// ---------------------------------------------------------------------------

await testAsync('md describe: no blocks → capabilities.blocks false', async () => {
  const d = mdHandler.describe();
  assert.strictEqual(d.capabilities.blocks, false);
  assert.ok(d.recognition.startsWith('A FAL ending with .md'));
});
await testAsync('js-managed describe: has blocks → capabilities.blocks true', async () => {
  const d = jsManagedHandler.describe();
  assert.strictEqual(d.capabilities.blocks, true);
});

// ---------------------------------------------------------------------------
// listBlocks — no grammar → throws
// ---------------------------------------------------------------------------

await testAsync('md listBlocks: no grammar → throws', async () => {
  try {
    await mdHandler.listBlocks(SAMPLE_MD_REF, '', rootRegistry);
    assert.fail('Expected error');
  } catch (e) {
    assert.ok(e.message.includes('no block grammar'), `unexpected: ${e.message}`);
  }
});

// ---------------------------------------------------------------------------
// listBlocks — js-managed (flat, shebang stripped)
// ---------------------------------------------------------------------------

await testAsync('js-managed listBlocks(""): returns all block names', async () => {
  const blocks = await jsManagedHandler.listBlocks(MANAGED_REF, '', rootRegistry);
  assert.deepStrictEqual(blocks, ['imports', 'constants', 'helpers', 'exports']);
});

await testAsync('js-managed listBlocks on named block: no child grammar → empty array', async () => {
  const blocks = await jsManagedHandler.listBlocks(MANAGED_REF, 'imports', rootRegistry);
  assert.deepStrictEqual(blocks, []);
});

// ---------------------------------------------------------------------------
// listBlocks — md-structured (hierarchical)
// ---------------------------------------------------------------------------

await testAsync('md-structured listBlocks(""): top-level sections', async () => {
  const blocks = await mdStructuredHandler.listBlocks(STRUCTURED_REF, '', rootRegistry);
  assert.ok(blocks.includes('Quick Start'), `missing Quick Start, got: ${blocks}`);
  assert.ok(blocks.includes('Changelog'),   `missing Changelog, got: ${blocks}`);
  assert.ok(blocks.includes('Section A'),   `missing Section A, got: ${blocks}`);
});

await testAsync('md-structured listBlocks("Changelog"): returns version entries', async () => {
  const blocks = await mdStructuredHandler.listBlocks(STRUCTURED_REF, 'Changelog', rootRegistry);
  assert.ok(blocks.length >= 2, `expected >= 2 entries, got: ${blocks.length}`);
  assert.ok(blocks[0].startsWith('Version'), `expected Version, got: ${blocks[0]}`);
});

await testAsync('md-structured listBlocks("Quick Start"): no child grammar → empty', async () => {
  const blocks = await mdStructuredHandler.listBlocks(STRUCTURED_REF, 'Quick Start', rootRegistry);
  assert.deepStrictEqual(blocks, []);
});

// ---------------------------------------------------------------------------
// readBlock — js-managed
// ---------------------------------------------------------------------------

// readBlock("") on a file with grammar returns the anonymous root block content:
// the content BEFORE the first separator (shebang stripped).
// sample-managed.js starts with shebang + blank line, then first separator.
// So the anonymous block content is the blank line only — not the named blocks.
await testAsync('js-managed readBlock(""): returns content before first separator (no shebang)', async () => {
  const content = await jsManagedHandler.readBlock(MANAGED_REF, '', rootRegistry);
  assert.ok(!content.startsWith('// @forge-type:'), 'shebang must be stripped');
  assert.ok(!content.includes('// ===='), 'separator must not appear in anonymous block');
});

await testAsync('js-managed readBlock("imports"): returns block content only', async () => {
  const content = await jsManagedHandler.readBlock(MANAGED_REF, 'imports', rootRegistry);
  assert.ok(content.includes("import fs"), `expected import, got: ${content}`);
  assert.ok(!content.includes('// ===='), 'separator must not appear in content');
});

await testAsync('js-managed readBlock("helpers"): returns helpers content', async () => {
  const content = await jsManagedHandler.readBlock(MANAGED_REF, 'helpers', rootRegistry);
  assert.ok(content.includes('helper()'), `expected helper fn, got: ${content}`);
});

await testAsync('js-managed readBlock unknown block → throws', async () => {
  try {
    await jsManagedHandler.readBlock(MANAGED_REF, 'nonexistent', rootRegistry);
    assert.fail('Expected error');
  } catch (e) {
    assert.ok(e.message.includes('not found'), `unexpected: ${e.message}`);
  }
});

// ---------------------------------------------------------------------------
// readBlock — md-structured
// ---------------------------------------------------------------------------

await testAsync('md-structured readBlock("Section A"): returns section content', async () => {
  const content = await mdStructuredHandler.readBlock(STRUCTURED_REF, 'Section A', rootRegistry);
  assert.ok(content.includes('Content of section A'), `unexpected: ${content}`);
  assert.ok(!content.includes('## '), 'no separator in own content');
});

await testAsync('md-structured readBlock("Changelog"): own content only, no version entries', async () => {
  const content = await mdStructuredHandler.readBlock(STRUCTURED_REF, 'Changelog', rootRegistry);
  assert.ok(!content.includes('### '), `child separators must not appear: ${content}`);
});

await testAsync('md-structured readBlock nested: Changelog/Version 1.0 - Creation', async () => {
  const blocks  = await mdStructuredHandler.listBlocks(STRUCTURED_REF, 'Changelog', rootRegistry);
  const version = blocks.find(b => b.includes('1.0'));
  assert.ok(version, 'Version 1.0 entry not found');
  const content = await mdStructuredHandler.readBlock(STRUCTURED_REF, `Changelog/${version}`, rootRegistry);
  assert.ok(content.includes('Initial content'), `unexpected: ${content}`);
});

// ---------------------------------------------------------------------------
// writeBlock — js-managed
// ---------------------------------------------------------------------------

await testAsync('js-managed writeBlock: replaces named block content', async () => {
  sandboxCreate('st-managed.js', [
    '// @forge-type: js-managed',
    '',
    '// ====[ imports ]====',
    '',
    "import fs from 'fs';",
    '',
    '// ====[ helpers ]====',
    '',
    'export function helper() { return 42; }'
  ].join('\n'));

  const ref = urlRef('st-managed', '.js', 'sandbox');
  await jsManagedHandler.writeBlock(ref, 'imports', "import path from 'path';", rootRegistry);

  const raw = sandboxRead('st-managed.js');
  assert.ok(raw.startsWith('// @forge-type: js-managed'), 'shebang preserved');
  assert.ok(raw.includes("import path from 'path';"), 'new content present');
  assert.ok(!raw.includes("import fs from 'fs';"), 'old content removed');
  assert.ok(raw.includes('// ====[ helpers ]===='), 'other block preserved');
  assert.ok(raw.includes('helper()'), 'other block content preserved');

  sandboxClean('st-managed.js');
});

await testAsync('js-managed writeBlock(""): replaces full content, preserves shebang', async () => {
  sandboxCreate('st-managed.js', '// @forge-type: js-managed\nold body');
  const ref = urlRef('st-managed', '.js', 'sandbox');
  await jsManagedHandler.writeBlock(ref, '', 'new body', rootRegistry);
  const raw = sandboxRead('st-managed.js');
  assert.ok(raw.startsWith('// @forge-type: js-managed\n'), 'shebang first');
  assert.ok(raw.includes('new body'), 'new body present');
  assert.ok(!raw.includes('old body'), 'old body removed');
  sandboxClean('st-managed.js');
});

await testAsync('writeBlock on non-existent file → existence guard error', async () => {
  sandboxClean('st-missing.js');
  const ref = urlRef('st-missing', '.js', 'sandbox');
  try {
    await jsManagedHandler.writeBlock(ref, '', 'x', rootRegistry);
    assert.fail('Expected error');
  } catch (e) {
    assert.ok(
      e.message.includes('forge_create') || e.message.includes('does not exist'),
      `unexpected: ${e.message}`
    );
  }
});

// ---------------------------------------------------------------------------
// createArtifact
// ---------------------------------------------------------------------------

await testAsync('md createArtifact: creates empty file', async () => {
  sandboxClean('st-new.md');
  const ref = urlRef('st-new', '.md', 'sandbox');
  await mdHandler.createArtifact(ref, rootRegistry);
  assert.ok(fs.existsSync(urlRefPath(ref)));
  assert.strictEqual(sandboxRead('st-new.md'), '');
  sandboxClean('st-new.md');
});

await testAsync('js-managed createArtifact: writes shebang only (no fixed-name blocks)', async () => {
  sandboxClean('st-new.js');
  const ref = urlRef('st-new', '.js', 'sandbox');
  await jsManagedHandler.createArtifact(ref, rootRegistry);
  const raw = sandboxRead('st-new.js');
  assert.ok(raw.startsWith('// @forge-type: js-managed\n'), `unexpected: ${raw}`);
  sandboxClean('st-new.js');
});

await testAsync('md-structured createArtifact: skeleton has Changelog block', async () => {
  sandboxClean('st-new.md');
  const ref = urlRef('st-new', '.md', 'sandbox');
  await mdStructuredHandler.createArtifact(ref, rootRegistry);
  const raw = sandboxRead('st-new.md');
  assert.ok(raw.includes('## Changelog'), `expected Changelog in skeleton: ${raw}`);
  sandboxClean('st-new.md');
});

await testAsync('createArtifact throws if file already exists', async () => {
  sandboxCreate('st-new.md', 'x');
  const ref = urlRef('st-new', '.md', 'sandbox');
  try {
    await mdHandler.createArtifact(ref, rootRegistry);
    assert.fail('Expected error');
  } catch (e) {
    assert.ok(e.message.length > 0);
  } finally {
    sandboxClean('st-new.md');
  }
});

// ---------------------------------------------------------------------------
// Unimplemented stubs
// ---------------------------------------------------------------------------

await testAsync('insertBlock throws', async () => {
  try { await mdHandler.insertBlock(SAMPLE_MD_REF, 'x', 'y', rootRegistry); assert.fail(); }
  catch (e) { assert.ok(e.message.includes('not implemented')); }
});
await testAsync('appendBlock throws', async () => {
  try { await mdHandler.appendBlock(SAMPLE_MD_REF, '', 'x', rootRegistry); assert.fail(); }
  catch (e) { assert.ok(e.message.includes('not implemented')); }
});
await testAsync('deleteBlock throws', async () => {
  try { await mdHandler.deleteBlock(SAMPLE_MD_REF, 'x', rootRegistry); assert.fail(); }
  catch (e) { assert.ok(e.message.includes('not implemented')); }
});

console.log(`\n${failed === 0 ? 'All tests passed' : `${failed} test(s) failed`}`);
process.exit(failed > 0 ? 1 : 0);
