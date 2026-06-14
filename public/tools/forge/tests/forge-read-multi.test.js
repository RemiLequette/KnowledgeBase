/**
 * forge-read-multi.test.js — unit + integration tests for forge_read multi-file (O53)
 *
 * forge_read({ paths: string[], query? })
 * Returns { results: [ { path, format, content } | { path, error } ] }
 * Results in input order. Individual errors do not abort the batch.
 */

import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------
// Unit tests — mock registries
// ---------------------------------------------------------------------------

import { initTool as initRead } from '../tool-handlers/forge-read.js';

function makeFormatRegistry(overrides = {}) {
  return {
    dispatch: vi.fn().mockResolvedValue(null), // native fallback by default
    ...overrides,
  };
}

function makeRootRegistry(files = {}) {
  return {
    read: vi.fn().mockImplementation(async (ref) => {
      const key = ref.path + ref.name + ref.extension;
      if (key in files) return files[key];
      throw new Error(`File not found: ${key}`);
    }),
  };
}

describe('forge_read — paths[] (unit)', () => {
  let tool;

  beforeEach(async () => {
    const rootRegistry   = makeRootRegistry({
      'a.md': '# A',
      'b.md': '# B',
    });
    const formatRegistry = makeFormatRegistry();
    tool = await initRead({}, { rootRegistry, formatRegistry });
  });

  it('returns results array with one entry per path', async () => {
    const result = await tool.execute({ paths: ['dev/a.md', 'dev/b.md'] });
    expect(result.results).toHaveLength(2);
    expect(result.results[0].path).toBe('dev/a.md');
    expect(result.results[1].path).toBe('dev/b.md');
  });

  it('each successful entry has format and content', async () => {
    const rootRegistry = makeRootRegistry({ 'a.md': '# A' });
    const tool2 = await initRead({}, { rootRegistry, formatRegistry: makeFormatRegistry() });
    const result = await tool2.execute({ paths: ['dev/a.md'] });
    expect(result.results[0].format).toBe('md');
    expect(result.results[0].content).toBe('# A');
    expect(result.results[0].error).toBeUndefined();
  });

  it('failed entry has error, does not abort batch', async () => {
    const rootRegistry = makeRootRegistry({ 'a.md': '# A' }); // b.md missing
    const tool2 = await initRead({}, { rootRegistry, formatRegistry: makeFormatRegistry() });
    const result = await tool2.execute({ paths: ['dev/a.md', 'dev/missing.md'] });
    expect(result.results).toHaveLength(2);
    expect(result.results[0].content).toBe('# A');
    expect(result.results[1].error).toBeDefined();
    expect(result.results[1].content).toBeUndefined();
  });

  it('preserves input order', async () => {
    const rootRegistry = makeRootRegistry({ 'a.md': 'AAA', 'b.md': 'BBB', 'c.md': 'CCC' });
    const tool2 = await initRead({}, { rootRegistry, formatRegistry: makeFormatRegistry() });
    const result = await tool2.execute({ paths: ['dev/c.md', 'dev/a.md', 'dev/b.md'] });
    expect(result.results.map(r => r.content)).toEqual(['CCC', 'AAA', 'BBB']);
  });

  it('throws when both path and paths are provided', async () => {
    await expect(tool.execute({ path: 'dev/a.md', paths: ['dev/b.md'] }))
      .rejects.toThrow();
  });

  it('throws when neither path nor paths is provided', async () => {
    await expect(tool.execute({})).rejects.toThrow('path');
  });

  it('single path still works (backward compat)', async () => {
    const rootRegistry = makeRootRegistry({ 'a.md': '# A' });
    const tool2 = await initRead({}, { rootRegistry, formatRegistry: makeFormatRegistry() });
    const result = await tool2.execute({ path: 'dev/a.md' });
    expect(result.format).toBe('md');
    expect(result.content).toBe('# A');
    expect(result.results).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Integration tests — real McpServer + real filesystem (sandbox)
// ---------------------------------------------------------------------------

import { McpServer }      from '../src/mcp-server.js';
import { RootRegistry }   from '../src/root-registry.js';
import { FormatRegistry } from '../src/format-registry.js';

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const FORGE_ROOT  = path.resolve(__dirname, '..');
const TOOLS_PATH  = path.join(FORGE_ROOT, 'forge-tools.json');
const CONFIG_PATH = path.join(FORGE_ROOT, 'forge.config.json');
const SANDBOX     = path.join(__dirname, 'fixtures', 'sandbox', 'read-multi');
const MCP_PREFIX  = 'development/with-claude/knowledgebase/public/tools/forge/tests/fixtures/sandbox/read-multi/';

function mcpPath(f) { return MCP_PREFIX + f; }
function disk(f)    { return path.join(SANDBOX, f); }

async function buildContext() {
  const forgeConfig    = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  const rootRegistry   = new RootRegistry();
  const formatRegistry = new FormatRegistry();
  await rootRegistry.load(forgeConfig.roots);
  const formatsPath = path.join(FORGE_ROOT, 'forge-formats.json');
  if (fs.existsSync(formatsPath)) await formatRegistry.load(formatsPath);
  return { rootRegistry, formatRegistry };
}

let server;

beforeAll(async () => {
  fs.mkdirSync(SANDBOX, { recursive: true });
  const context = await buildContext();
  server = new McpServer();
  await server.loadTools(TOOLS_PATH, context);
});

afterAll(() => {
  fs.rmSync(SANDBOX, { recursive: true, force: true });
});

beforeEach(() => {
  for (const entry of fs.readdirSync(SANDBOX)) {
    fs.rmSync(path.join(SANDBOX, entry), { recursive: true, force: true });
  }
});

describe('forge_read paths[] — integration', () => {
  it('reads two .md files in one call', async () => {
    fs.writeFileSync(disk('alpha.md'), '# Alpha', 'utf8');
    fs.writeFileSync(disk('beta.md'),  '# Beta',  'utf8');
    const result = await server.dispatch('forge_read', {
      paths: [mcpPath('alpha.md'), mcpPath('beta.md')],
    });
    expect(result.results).toHaveLength(2);
    expect(result.results[0]).toMatchObject({ path: mcpPath('alpha.md'), format: 'md', content: '# Alpha' });
    expect(result.results[1]).toMatchObject({ path: mcpPath('beta.md'),  format: 'md', content: '# Beta'  });
  });

  it('reads .md and .js files in same call', async () => {
    fs.writeFileSync(disk('script.js'), 'const x = 1;', 'utf8');
    fs.writeFileSync(disk('doc.md'),    '# Doc',        'utf8');
    const result = await server.dispatch('forge_read', {
      paths: [mcpPath('script.js'), mcpPath('doc.md')],
    });
    expect(result.results[0]).toMatchObject({ format: 'js', content: 'const x = 1;' });
    expect(result.results[1]).toMatchObject({ format: 'md', content: '# Doc' });
  });

  it('captures error for missing file without aborting batch', async () => {
    fs.writeFileSync(disk('exists.md'), 'present', 'utf8');
    const result = await server.dispatch('forge_read', {
      paths: [mcpPath('exists.md'), mcpPath('missing.md')],
    });
    expect(result.results[0].content).toBe('present');
    expect(result.results[1].error).toBeDefined();
  });

  it('preserves order across 3 files', async () => {
    fs.writeFileSync(disk('one.md'),   'ONE',   'utf8');
    fs.writeFileSync(disk('two.md'),   'TWO',   'utf8');
    fs.writeFileSync(disk('three.md'), 'THREE', 'utf8');
    const result = await server.dispatch('forge_read', {
      paths: [mcpPath('three.md'), mcpPath('one.md'), mcpPath('two.md')],
    });
    expect(result.results.map(r => r.content)).toEqual(['THREE', 'ONE', 'TWO']);
  });
});
