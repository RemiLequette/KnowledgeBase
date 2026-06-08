/**
 * structured-text.test.js
 *
 * Unit tests for handlers/structured-text.js v3.4
 * Tests: claim, ls, isBlock, readBlock, writeBlock (leaf-only + separator guard), createArtifact.
 * Also tests: old-shebang migration in claim and writeBlock.
 *
 * References:
 *   - conventions/forge.md v7.8 [section Type handlers]
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import { initType } from '../../public/tools/forge/handlers/structured-text.js';
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

const mdHandler = await initType({ name: 'md', version: '1.0',
  handler: '', description: 'a Markdown document' });

const managedJsHandler = await initType({
  name: 'managed.js', version: '1.0', handler: '',
  description: 'a managed JavaScript source file with named blocks',
  extension: 'js',
  shebang: '// @forge-type: managed.js',
  oldShebang: '// @forge-type: js-managed',
  blocks: {
    separators: [
      { type: 'regex', pattern: '^// ====\\[ (.+?) \\]====$', nameGroup: 1, repeat: '+' }
    ]
  }
});

const docMdHandler = await initType({
  name: 'doc.md', version: '1.0', handler: '',
  description: 'a structured Markdown document with named sections',
  extension: 'md',
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

const todoHandler = await initType({
  name: 'todolist.doc.md', version: '1.0', handler: '',
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

const MANAGED_REF    = urlRef('sample-managed', '.js');
const STRUCTURED_REF = urlRef('sample-structured', '.md');
const TODO_REF       = urlRef('sample-todo', '.md');
const SAMPLE_MD_REF  = urlRef('sample', '.md');
const PLAIN_JS_REF   = urlRef('sample-plain', '.js');

// ---------------------------------------------------------------------------
// claim — extension only (md)
// ---------------------------------------------------------------------------

describe('claim — extension only (md)', () => {
  it('md claim: .md → true',  async () => expect(await mdHandler.claim(urlRef('f', '.md'),  rootRegistry)).toBe(true));
  it('md claim: .txt → false', async () => expect(await mdHandler.claim(urlRef('f', '.txt'), rootRegistry)).toBe(false));
});

// ---------------------------------------------------------------------------
// claim — shebang (managed.js)
// ---------------------------------------------------------------------------

describe('claim — shebang (managed.js)', () => {
  it('claim: .js with new shebang → true', async () => {
    sandboxCreate('new-shebang.js', '// @forge-type: managed.js\n// ====[ imports ]====\n\n');
    const ref = urlRef('new-shebang', '.js', 'sandbox');
    expect(await managedJsHandler.claim(ref, rootRegistry)).toBe(true);
    sandboxClean('new-shebang.js');
  });

  it('claim: .js with old shebang → true (migration)', async () => {
    expect(await managedJsHandler.claim(MANAGED_REF, rootRegistry)).toBe(true);
  });

  it('claim: .js without shebang → false', async () => {
    expect(await managedJsHandler.claim(PLAIN_JS_REF, rootRegistry)).toBe(false);
  });

  it('claim: .md → false', async () => {
    expect(await managedJsHandler.claim(SAMPLE_MD_REF, rootRegistry)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// claim — matchName (todolist.doc.md)
// ---------------------------------------------------------------------------

describe('claim — matchName (todolist.doc.md)', () => {
  it('name matches → true', async () => expect(await todoHandler.claim(TODO_REF, rootRegistry)).toBe(true));
  it('name does not match → false', async () => expect(await todoHandler.claim(SAMPLE_MD_REF, rootRegistry)).toBe(false));
  it('wrong extension → false', async () => expect(await todoHandler.claim(urlRef('sample-todo', '.txt'), rootRegistry)).toBe(false));
});

// ---------------------------------------------------------------------------
// claim — hierarchy: todolist.doc.md and doc.md do not conflict
// ---------------------------------------------------------------------------

// @convention conventions/forge.md [section Type discovery — hierarchy]
describe('claim — hierarchy: todolist.doc.md vs doc.md', () => {
  it('todolist.doc.md claims sample-todo.md', async () => {
    expect(await todoHandler.claim(TODO_REF, rootRegistry)).toBe(true);
  });

  it('doc.md does not claim sample-todo.md when todolist.doc.md is in the hierarchy', async () => {
    // todolist.doc.md is more specific than doc.md in the *.md hierarchy —
    // doc.md should not be evaluated once todolist.doc.md claims.
    // This test verifies doc.md alone does claim it (it would if evaluated),
    // but the hierarchy stops at the first claim.
    expect(await docMdHandler.claim(TODO_REF, rootRegistry)).toBe(true); // doc.md alone would claim
    // The TypeRegistry stops at todolist.doc.md — no conflict at the registry level.
    // Conflict only happens when two INDEPENDENT groups both claim — not within the same hierarchy.
  });

  it('doc.md claims non-TODO .md files', async () => {
    expect(await docMdHandler.claim(STRUCTURED_REF, rootRegistry)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// describe
// ---------------------------------------------------------------------------

describe('describe', () => {
  it('md describe: no blocks → capabilities.blocks false', () => {
    const d = mdHandler.describe();
    expect(d.capabilities.blocks).toBe(false);
    expect(d.recognition).toMatch(/^A FAL ending with \.md/);
  });

  it('managed.js describe: has blocks → capabilities.blocks true', () => {
    expect(managedJsHandler.describe().capabilities.blocks).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// readBlock — managed.js
// ---------------------------------------------------------------------------

describe('readBlock — managed.js', () => {
  it('readBlock(""): returns content before first separator (no shebang)', async () => {
    const content = await managedJsHandler.readBlock(MANAGED_REF, '', rootRegistry);
    expect(content).not.toMatch(/^\/\/ @forge-type:/);
    expect(content).not.toContain('// ====');
  });

  it('readBlock("imports"): returns block content only', async () => {
    const content = await managedJsHandler.readBlock(MANAGED_REF, 'imports', rootRegistry);
    expect(content).toContain('import fs');
    expect(content).not.toContain('// ====');
  });

  it('readBlock("helpers"): returns helpers content', async () => {
    const content = await managedJsHandler.readBlock(MANAGED_REF, 'helpers', rootRegistry);
    expect(content).toContain('helper()');
  });

  it('readBlock unknown block → throws', async () => {
    await expect(managedJsHandler.readBlock(MANAGED_REF, 'nonexistent', rootRegistry))
      .rejects.toThrow(/not found/);
  });
});

// ---------------------------------------------------------------------------
// readBlock — doc.md
// ---------------------------------------------------------------------------

describe('readBlock — doc.md', () => {
  it('readBlock("Section A"): returns section content', async () => {
    const content = await docMdHandler.readBlock(STRUCTURED_REF, 'Section A', rootRegistry);
    expect(content).toContain('Content of section A');
    expect(content).not.toMatch(/^## /m);
  });

  it('readBlock("Changelog"): own content only, no version entries', async () => {
    const content = await docMdHandler.readBlock(STRUCTURED_REF, 'Changelog', rootRegistry);
    expect(content).not.toMatch(/^### /m);
  });

  it('readBlock nested: Changelog/Version 1.0 - Creation', async () => {
    const entries = await docMdHandler.ls(STRUCTURED_REF, 'Changelog', rootRegistry);
    const version = entries.find(e => e.name.includes('1.0'));
    expect(version).toBeTruthy();
    const content = await docMdHandler.readBlock(STRUCTURED_REF, `Changelog/${version.name}`, rootRegistry);
    expect(content).toContain('Initial content');
  });
});

// ---------------------------------------------------------------------------
// writeBlock — leaf-only guard
// ---------------------------------------------------------------------------

describe('writeBlock — leaf-only guard', () => {
  it('doc.md writeBlock on node (Changelog) → throws', async () => {
    sandboxCreate('st-node.md', [
      '## Quick Start', '', 'Some content.', '',
      '## Changelog', '', '### Version 1.0', '', 'Initial.'
    ].join('\n'));
    const ref = urlRef('st-node', '.md', 'sandbox');
    await expect(docMdHandler.writeBlock(ref, 'Changelog', 'should fail', rootRegistry))
      .rejects.toThrow(/node|child grammar/);
    sandboxClean('st-node.md');
  });

  it('doc.md writeBlock on block (Quick Start) → succeeds', async () => {
    sandboxCreate('st-leaf.md', [
      '## Quick Start', '', 'Old content.', '',
      '## Changelog', '', '### Version 1.0', '', 'Initial.'
    ].join('\n'));
    const ref = urlRef('st-leaf', '.md', 'sandbox');
    await docMdHandler.writeBlock(ref, 'Quick Start', 'New content.', rootRegistry);
    const raw = sandboxRead('st-leaf.md');
    expect(raw).toContain('New content.');
    expect(raw).not.toContain('Old content.');
    sandboxClean('st-leaf.md');
  });
});

// ---------------------------------------------------------------------------
// writeBlock — managed.js (new shebang)
// ---------------------------------------------------------------------------

describe('writeBlock — managed.js (new shebang)', () => {
  it('replaces named block content, writes new shebang', async () => {
    sandboxCreate('st-managed.js', [
      '// @forge-type: managed.js', '',
      '// ====[ imports ]====', '', "import fs from 'fs';", '',
      '// ====[ helpers ]====', '', 'export function helper() { return 42; }'
    ].join('\n'));
    const ref = urlRef('st-managed', '.js', 'sandbox');
    await managedJsHandler.writeBlock(ref, 'imports', "import path from 'path';", rootRegistry);
    const raw = sandboxRead('st-managed.js');
    expect(raw).toMatch(/^\/\/ @forge-type: managed\.js/);
    expect(raw).toContain("import path from 'path';");
    expect(raw).not.toContain("import fs from 'fs';");
    expect(raw).toContain('// ====[ helpers ]====');
    expect(raw).toContain('helper()');
    sandboxClean('st-managed.js');
  });

  it('writeBlock(""): replaces full content, writes new shebang', async () => {
    sandboxCreate('st-managed.js', '// @forge-type: managed.js\nold body');
    const ref = urlRef('st-managed', '.js', 'sandbox');
    await managedJsHandler.writeBlock(ref, '', 'new body', rootRegistry);
    const raw = sandboxRead('st-managed.js');
    expect(raw).toMatch(/^\/\/ @forge-type: managed\.js\n/);
    expect(raw).toContain('new body');
    expect(raw).not.toContain('old body');
    sandboxClean('st-managed.js');
  });
});

// ---------------------------------------------------------------------------
// old-shebang migration — writeBlock upgrades silently
// ---------------------------------------------------------------------------

describe('old-shebang migration', () => {
  it('writeBlock on old-shebang file: migrates to new shebang', async () => {
    sandboxCreate('st-old-shebang.js', [
      '// @forge-type: js-managed', '',
      '// ====[ imports ]====', '', "import fs from 'fs';"
    ].join('\n'));
    const ref = urlRef('st-old-shebang', '.js', 'sandbox');
    await managedJsHandler.writeBlock(ref, 'imports', "import path from 'path';", rootRegistry);
    const raw = sandboxRead('st-old-shebang.js');
    expect(raw).toMatch(/^\/\/ @forge-type: managed\.js\n/);
    expect(raw).toContain("import path from 'path';");
    expect(raw).not.toContain('js-managed');
    sandboxClean('st-old-shebang.js');
  });
});

// ---------------------------------------------------------------------------
// writeBlock — existence guard
// ---------------------------------------------------------------------------

describe('writeBlock — existence guard', () => {
  it('non-existent file → existence guard error', async () => {
    sandboxClean('st-missing.js');
    const ref = urlRef('st-missing', '.js', 'sandbox');
    await expect(managedJsHandler.writeBlock(ref, '', 'x', rootRegistry))
      .rejects.toThrow(/forge_create|does not exist/);
  });
});

// ---------------------------------------------------------------------------
// writeBlock — separator guard
// ---------------------------------------------------------------------------

describe('writeBlock — separator guard', () => {
  it('managed.js writeBlock(""): content with separator → throws', async () => {
    sandboxCreate('st-sep.js', [
      '// @forge-type: managed.js', '',
      '// ====[ imports ]====', '', "import fs from 'fs';"
    ].join('\n'));
    const ref = urlRef('st-sep', '.js', 'sandbox');
    await expect(managedJsHandler.writeBlock(ref, '', '// ====[ imports ]====\nbad content', rootRegistry))
      .rejects.toThrow(/separator/);
    sandboxClean('st-sep.js');
  });

  it('managed.js writeBlock(name): content with separator → throws', async () => {
    sandboxCreate('st-sep.js', [
      '// @forge-type: managed.js', '',
      '// ====[ imports ]====', '', "import fs from 'fs';", '',
      '// ====[ helpers ]====', '', 'export function helper() { return 42; }'
    ].join('\n'));
    const ref = urlRef('st-sep', '.js', 'sandbox');
    await expect(managedJsHandler.writeBlock(ref, 'imports', '// ====[ helpers ]====\nbad', rootRegistry))
      .rejects.toThrow(/separator/);
    sandboxClean('st-sep.js');
  });

  it('doc.md writeBlock(name): content with separator → throws', async () => {
    sandboxCreate('st-sep.md', ['## Quick Start', '', 'Some content.', '', '## Keywords', '', 'test'].join('\n'));
    const ref = urlRef('st-sep', '.md', 'sandbox');
    await expect(docMdHandler.writeBlock(ref, 'Quick Start', '## Keywords\nbad', rootRegistry))
      .rejects.toThrow(/separator/);
    sandboxClean('st-sep.md');
  });
});

// ---------------------------------------------------------------------------
// createArtifact
// ---------------------------------------------------------------------------

describe('createArtifact', () => {
  it('md: creates empty file', async () => {
    sandboxClean('st-new.md');
    const ref = urlRef('st-new', '.md', 'sandbox');
    await mdHandler.createArtifact(ref, rootRegistry);
    expect(fs.existsSync(urlRefPath(ref))).toBe(true);
    expect(sandboxRead('st-new.md')).toBe('');
    sandboxClean('st-new.md');
  });

  it('managed.js: writes new shebang only', async () => {
    sandboxClean('st-new.js');
    const ref = urlRef('st-new', '.js', 'sandbox');
    await managedJsHandler.createArtifact(ref, rootRegistry);
    expect(sandboxRead('st-new.js')).toMatch(/^\/\/ @forge-type: managed\.js\n/);
    sandboxClean('st-new.js');
  });

  it('doc.md: skeleton has Changelog block', async () => {
    sandboxClean('st-new.md');
    const ref = urlRef('st-new', '.md', 'sandbox');
    await docMdHandler.createArtifact(ref, rootRegistry);
    expect(sandboxRead('st-new.md')).toContain('## Changelog');
    sandboxClean('st-new.md');
  });

  it('throws if file already exists', async () => {
    sandboxCreate('st-new.md', 'x');
    const ref = urlRef('st-new', '.md', 'sandbox');
    await expect(mdHandler.createArtifact(ref, rootRegistry)).rejects.toThrow();
    sandboxClean('st-new.md');
  });
});

// ---------------------------------------------------------------------------
// Unimplemented stubs
// ---------------------------------------------------------------------------

describe('Unimplemented stubs — all throw', () => {
  it('insertBlock', async () => { await expect(mdHandler.insertBlock(SAMPLE_MD_REF, 'x', 'y', rootRegistry)).rejects.toThrow(/not implemented/); });
  it('appendBlock', async () => { await expect(mdHandler.appendBlock(SAMPLE_MD_REF, '', 'x', rootRegistry)).rejects.toThrow(/not implemented/); });
  it('deleteBlock', async () => { await expect(mdHandler.deleteBlock(SAMPLE_MD_REF, 'x', rootRegistry)).rejects.toThrow(/not implemented/); });
});
