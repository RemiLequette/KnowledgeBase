/**
 * mvp1-integration.test.js — MVP-1 end-to-end integration tests
 *
 * Validates the full chain: McpServer.dispatch() → tool handler → RootRegistry
 * → file-root.js → filesystem, on real .md and .js dummy files in sandbox/.
 *
 * No mocks. Uses the real forge-tools.json and forge.config.json.
 * Mirrors the manual validation: create, read, write, delete via Forge
 * cross-checked against the filesystem via fs.
 *
 * References:
 *   - ROADMAP.md [MVP-1]
 *   - tests/startup.test.js (pattern for building real context)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { McpServer }      from '../src/mcp-server.js';
import { RootRegistry }   from '../src/root-registry.js';
import { FormatRegistry } from '../src/format-registry.js';

// ---------------------------------------------------------------------------
// Sandbox setup
// ---------------------------------------------------------------------------

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const FORGE_ROOT = path.resolve(__dirname, '..');
const TOOLS_PATH = path.join(FORGE_ROOT, 'forge-tools.json');
const CONFIG_PATH = path.join(FORGE_ROOT, 'forge.config.json');

const SANDBOX    = path.join(__dirname, 'fixtures', 'sandbox', 'mvp1');

// MCP path prefix for the sandbox inside the 'development' root.
// forge.config.json maps 'development' → C:/Users/RemiLequette/Development
// sandbox is at: knowledgebase/public/tools/forge/tests/fixtures/sandbox/mvp1/
const MCP_PREFIX = 'development/with-claude/knowledgebase/public/tools/forge/tests/fixtures/sandbox/mvp1/';

function mcpPath(filename) {
  return MCP_PREFIX + filename;
}

function sandboxPath(filename) {
  return path.join(SANDBOX, filename);
}

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
  // Clean sandbox between tests
  for (const entry of fs.readdirSync(SANDBOX)) {
    fs.rmSync(path.join(SANDBOX, entry), { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

async function dispatch(tool, input) {
  return server.dispatch(tool, input);
}

// ---------------------------------------------------------------------------
// forge_create — native fallback (.md and .js)
// ---------------------------------------------------------------------------

describe('forge_create — native fallback', () => {
  it('creates an empty .md file on disk', async () => {
    const result = await dispatch('forge_create', { path: mcpPath('dummy.md'), format: 'md' });
    expect(result.ok).toBeDefined();
    expect(fs.existsSync(sandboxPath('dummy.md'))).toBe(true);
    expect(fs.readFileSync(sandboxPath('dummy.md'), 'utf8')).toBe('');
  });

  it('creates an empty .js file on disk', async () => {
    const result = await dispatch('forge_create', { path: mcpPath('dummy.js'), format: 'js' });
    expect(result.ok).toBeDefined();
    expect(fs.existsSync(sandboxPath('dummy.js'))).toBe(true);
    expect(fs.readFileSync(sandboxPath('dummy.js'), 'utf8')).toBe('');
  });

  it('throws if file already exists', async () => {
    fs.writeFileSync(sandboxPath('exists.md'), '', 'utf8');
    await expect(dispatch('forge_create', { path: mcpPath('exists.md'), format: 'md' }))
      .rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// forge_read — native fallback (.md and .js)
// ---------------------------------------------------------------------------

describe('forge_read — native fallback', () => {
  it('reads .md content and returns format: "md"', async () => {
    fs.writeFileSync(sandboxPath('read.md'), '# Hello\n\nworld', 'utf8');
    const result = await dispatch('forge_read', { path: mcpPath('read.md') });
    expect(result.format).toBe('md');
    expect(result.content).toBe('# Hello\n\nworld');
  });

  it('reads .js content and returns format: "js"', async () => {
    fs.writeFileSync(sandboxPath('read.js'), 'console.log("hello");', 'utf8');
    const result = await dispatch('forge_read', { path: mcpPath('read.js') });
    expect(result.format).toBe('js');
    expect(result.content).toBe('console.log("hello");');
  });

  it('throws if file does not exist', async () => {
    await expect(dispatch('forge_read', { path: mcpPath('missing.md') }))
      .rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// forge_write — native fallback (.md and .js)
// ---------------------------------------------------------------------------

describe('forge_write — native fallback', () => {
  it('replaces .md content — verified on disk', async () => {
    fs.writeFileSync(sandboxPath('write.md'), 'old content', 'utf8');
    await dispatch('forge_write', { path: mcpPath('write.md'), payload: { content: 'new content' } });
    expect(fs.readFileSync(sandboxPath('write.md'), 'utf8')).toBe('new content');
  });

  it('replaces .js content — verified on disk', async () => {
    fs.writeFileSync(sandboxPath('write.js'), 'const x = 1;', 'utf8');
    await dispatch('forge_write', { path: mcpPath('write.js'), payload: { content: 'const x = 2;' } });
    expect(fs.readFileSync(sandboxPath('write.js'), 'utf8')).toBe('const x = 2;');
  });

  it('throws if file does not exist', async () => {
    await expect(dispatch('forge_write', { path: mcpPath('missing.md'), payload: { content: 'x' } }))
      .rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// forge_delete
// ---------------------------------------------------------------------------

describe('forge_delete', () => {
  it('deletes a .md file — absent on disk after', async () => {
    fs.writeFileSync(sandboxPath('delete.md'), 'bye', 'utf8');
    await dispatch('forge_delete', { path: mcpPath('delete.md') });
    expect(fs.existsSync(sandboxPath('delete.md'))).toBe(false);
  });

  it('throws if file does not exist', async () => {
    await expect(dispatch('forge_delete', { path: mcpPath('missing.md') }))
      .rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Full cycle — create → read → write → read → delete
// ---------------------------------------------------------------------------

describe('full cycle — .md', () => {
  it('create → read → write → read → delete', async () => {
    const p = mcpPath('cycle.md');
    const disk = sandboxPath('cycle.md');

    // create
    await dispatch('forge_create', { path: p, format: 'md' });
    expect(fs.existsSync(disk)).toBe(true);

    // read — empty file
    const r1 = await dispatch('forge_read', { path: p });
    expect(r1.format).toBe('md');
    expect(r1.content).toBe('');

    // write
    await dispatch('forge_write', { path: p, payload: { content: '# Cycle test\n' } });
    expect(fs.readFileSync(disk, 'utf8')).toBe('# Cycle test\n');

    // read again — content updated
    const r2 = await dispatch('forge_read', { path: p });
    expect(r2.content).toBe('# Cycle test\n');

    // delete
    await dispatch('forge_delete', { path: p });
    expect(fs.existsSync(disk)).toBe(false);
  });
});

describe('full cycle — .js', () => {
  it('create → read → write → read → delete', async () => {
    const p = mcpPath('cycle.js');
    const disk = sandboxPath('cycle.js');

    await dispatch('forge_create', { path: p, format: 'js' });
    expect(fs.existsSync(disk)).toBe(true);

    const r1 = await dispatch('forge_read', { path: p });
    expect(r1.format).toBe('js');
    expect(r1.content).toBe('');

    await dispatch('forge_write', { path: p, payload: { content: 'export const x = 42;\n' } });
    expect(fs.readFileSync(disk, 'utf8')).toBe('export const x = 42;\n');

    const r2 = await dispatch('forge_read', { path: p });
    expect(r2.content).toBe('export const x = 42;\n');

    await dispatch('forge_delete', { path: p });
    expect(fs.existsSync(disk)).toBe(false);
  });
});
