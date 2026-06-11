import { describe, it, expect, beforeEach } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { FormatRegistry } from '../src/format-registry.js';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES   = path.join(__dirname, 'fixtures');

function fixturePath(name) {
  return path.join(FIXTURES, name);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function loadRegistry(jsonFile) {
  const registry = new FormatRegistry();
  await registry.load(fixturePath(jsonFile));
  return registry;
}

// ---------------------------------------------------------------------------
// load() — build time
// ---------------------------------------------------------------------------

describe('load()', () => {
  it('loads without error for a valid config', async () => {
    await expect(loadRegistry('formats-basic.json')).resolves.toBeDefined();
  });

  it('registers formats grouped by extension', async () => {
    const registry = await loadRegistry('formats-basic.json');
    expect(registry.formatsForExtension('md')).toHaveLength(2);
    expect(registry.formatsForExtension('js')).toHaveLength(1);
  });

  it('returns empty array for unknown extension', async () => {
    const registry = await loadRegistry('formats-basic.json');
    expect(registry.formatsForExtension('py')).toHaveLength(0);
  });

  it('throws on duplicate format name within same extension', async () => {
    await expect(loadRegistry('formats-duplicate.json')).rejects.toThrow();
  });

  it('throws if config file does not exist', async () => {
    await expect(loadRegistry('missing.json')).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// dispatch() — claim loop
// ---------------------------------------------------------------------------

describe('dispatch()', () => {
  let registry;

  beforeEach(async () => {
    registry = await loadRegistry('formats-basic.json');
  });

  it('returns the first handler whose claim() returns true', async () => {
    // For .md: doc.claimResult=false, todo.claimResult=true → todo wins
    const handler = await registry.dispatch('md', 'any content');
    expect(handler).toBeDefined();
    const result = await handler.read('', null);
    expect(result.format).toBe('todo');
  });

  it('returns null when no handler claims the file (all claim false)', async () => {
    const reg = new FormatRegistry();
    await reg.load(fixturePath('formats-no-claim.json'));
    const handler = await reg.dispatch('md', 'any content');
    expect(handler).toBeNull();
  });

  it('returns null for unknown extension', async () => {
    const handler = await registry.dispatch('py', 'any content');
    expect(handler).toBeNull();
  });

  it('calls claim() in declaration order and stops at first true', async () => {
    // doc is first (claimResult=false), todo is second (claimResult=true) → todo wins
    const handler = await registry.dispatch('md', '');
    const result  = await handler.read('', null);
    expect(result.format).toBe('todo');
  });
});

// ---------------------------------------------------------------------------
// getByName() — forge_create lookup
// ---------------------------------------------------------------------------

describe('getByName()', () => {
  let registry;

  beforeEach(async () => {
    registry = await loadRegistry('formats-basic.json');
  });

  it('returns the handler for a known format name', async () => {
    const handler = registry.getByName('doc');
    expect(handler).toBeDefined();
  });

  it('returns the handler for a format on a different extension', async () => {
    const handler = registry.getByName('managed');
    expect(handler).toBeDefined();
  });

  it('returns null for unknown format name', () => {
    const handler = registry.getByName('unknown');
    expect(handler).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// describe() — registry listing
// ---------------------------------------------------------------------------

describe('describe()', () => {
  it('returns all extensions with their format names', async () => {
    const registry = await loadRegistry('formats-basic.json');
    const result   = registry.describe();
    expect(result.extensions).toHaveProperty('md');
    expect(result.extensions).toHaveProperty('js');
    expect(Object.keys(result.extensions.md.formats)).toContain('doc');
    expect(Object.keys(result.extensions.md.formats)).toContain('todo');
    expect(Object.keys(result.extensions.js.formats)).toContain('managed');
  });
});
