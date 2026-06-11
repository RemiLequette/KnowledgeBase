import { describe, it, expect, beforeEach } from 'vitest';
import { ShimSyntaxAdapter } from './fixtures/shim-syntax-adapter.js';
import { initSequence } from '../src/sequence.js';

// ---------------------------------------------------------------------------
// Format fixtures
// ---------------------------------------------------------------------------

const docFormat = {
  name: 'doc',
  description: 'A structured document.',
  sections: [
    { name: 'why',  format: 'text' },
    { name: 'what', format: 'text' },
    { name: 'how',  format: 'text', optional: true },
  ]
};

const todoFormat = {
  name: 'todo',
  description: 'A backlog.',
  sections: [
    { name: 'items', format: 'text', repeat: true, key: 'id' },
  ]
};

const lazyFormat = {
  name: 'doc-lazy',
  description: 'A document with lazy changelog.',
  sections: [
    { name: 'why',       format: 'text' },
    { name: 'changelog', format: 'text', repeat: true, key: 'version', lazy: true },
  ]
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const adapter = new ShimSyntaxAdapter();

function makeHandler(format) {
  return initSequence(format, adapter);
}

/** Build a shim raw file from format name + section map. */
function buildRaw(formatName, sections) {
  const meta  = `@@forge format=${formatName}`;
  const parts = Object.entries(sections).map(([name, content]) =>
    `@@section ${name}\n${content}`
  );
  return meta + '\n' + parts.join('\n') + '\n';
}

/** Mock rootRegistry — holds one file in memory. */
function makeRootRegistry(path, content) {
  let stored = content;
  return {
    async read(_path)          { return stored; },
    async write(_path, data)   { stored = data; },
    async create(_path)        { stored = ''; },
    getStored()                { return stored; },
  };
}

// ---------------------------------------------------------------------------
// claim()
// ---------------------------------------------------------------------------

describe('claim()', () => {
  it('returns true when metadata format matches handler format', async () => {
    const handler = makeHandler(docFormat);
    const raw     = buildRaw('doc', { why: 'Why.', what: 'What.' });
    expect(await handler.claim(raw)).toBe(true);
  });

  it('returns false when metadata format does not match', async () => {
    const handler = makeHandler(docFormat);
    const raw     = buildRaw('todo', { items: 'item 1' });
    expect(await handler.claim(raw)).toBe(false);
  });

  it('returns false when no metadata block is present', async () => {
    const handler = makeHandler(docFormat);
    expect(await handler.claim('no metadata here')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// read() — basic
// ---------------------------------------------------------------------------

describe('read() — basic', () => {
  it('returns format name in response', async () => {
    const handler  = makeHandler(docFormat);
    const raw      = buildRaw('doc', { why: 'Why.', what: 'What.', how: 'How.' });
    const registry = makeRootRegistry('/file.shim', raw);
    const result   = await handler.read('/file.shim', registry);
    expect(result.format).toBe('doc');
  });

  it('returns each section as a field', async () => {
    const handler  = makeHandler(docFormat);
    const raw      = buildRaw('doc', { why: 'Why content.', what: 'What content.', how: 'How content.' });
    const registry = makeRootRegistry('/file.shim', raw);
    const result   = await handler.read('/file.shim', registry);
    expect(result.why).toBe('Why content.');
    expect(result.what).toBe('What content.');
    expect(result.how).toBe('How content.');
  });

  it('optional section absent → field is undefined', async () => {
    const handler  = makeHandler(docFormat);
    const raw      = buildRaw('doc', { why: 'Why.', what: 'What.' });
    const registry = makeRootRegistry('/file.shim', raw);
    const result   = await handler.read('/file.shim', registry);
    expect(result.how).toBeUndefined();
  });

  it('does not include metadata in response', async () => {
    const handler  = makeHandler(docFormat);
    const raw      = buildRaw('doc', { why: 'Why.', what: 'What.' });
    const registry = makeRootRegistry('/file.shim', raw);
    const result   = await handler.read('/file.shim', registry);
    expect(result).not.toHaveProperty('@@forge');
    expect(JSON.stringify(result)).not.toContain('@@forge');
  });
});

// ---------------------------------------------------------------------------
// read() — lazy sections
// ---------------------------------------------------------------------------

describe('read() — lazy sections', () => {
  it('lazy section returns key list only by default', async () => {
    const handler = makeHandler(lazyFormat);
    const raw     = buildRaw('doc-lazy', {
      why:           'Why content.',
      'changelog':   '1.0\nFirst release.',
    });
    const registry = makeRootRegistry('/file.shim', raw);
    const result   = await handler.read('/file.shim', registry);
    expect(result.why).toBe('Why content.');
    // changelog should be a list of keys, not full content
    expect(Array.isArray(result.changelog)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// read() — dot-notation query
// ---------------------------------------------------------------------------

describe('read() — query', () => {
  it('query returns only the requested section', async () => {
    const handler  = makeHandler(docFormat);
    const raw      = buildRaw('doc', { why: 'Why content.', what: 'What content.', how: 'How content.' });
    const registry = makeRootRegistry('/file.shim', raw);
    const result   = await handler.read('/file.shim', registry, 'why');
    expect(result.why).toBe('Why content.');
    expect(result.what).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// write() — implicit update
// ---------------------------------------------------------------------------

describe('write() — implicit update', () => {
  it('updates a section without touching others', async () => {
    const handler  = makeHandler(docFormat);
    const raw      = buildRaw('doc', { why: 'Old why.', what: 'Old what.', how: 'Old how.' });
    const registry = makeRootRegistry('/file.shim', raw);

    await handler.write('/file.shim', registry, { why: 'New why.' });

    const result = await handler.read('/file.shim', registry);
    expect(result.why).toBe('New why.');
    expect(result.what).toBe('Old what.');
    expect(result.how).toBe('Old how.');
  });

  it('write preserves metadata block', async () => {
    const handler  = makeHandler(docFormat);
    const raw      = buildRaw('doc', { why: 'Why.', what: 'What.' });
    const registry = makeRootRegistry('/file.shim', raw);

    await handler.write('/file.shim', registry, { why: 'Updated.' });

    const stored = registry.getStored();
    expect(stored).toContain('@@forge');
    expect(stored).toContain('format=doc');
  });
});

// ---------------------------------------------------------------------------
// create()
// ---------------------------------------------------------------------------

describe('create()', () => {
  it('writes a skeleton with metadata block', async () => {
    const handler  = makeHandler(docFormat);
    const registry = makeRootRegistry('/new.shim', '');

    await handler.create('/new.shim', registry);

    const stored = registry.getStored();
    expect(stored).toContain('@@forge');
    expect(stored).toContain('format=doc');
  });

  it('skeleton contains all non-optional sections', async () => {
    const handler  = makeHandler(docFormat);
    const registry = makeRootRegistry('/new.shim', '');

    await handler.create('/new.shim', registry);

    const result = await handler.read('/new.shim', registry);
    expect(result).toHaveProperty('why');
    expect(result).toHaveProperty('what');
  });
});

// ---------------------------------------------------------------------------
// describe()
// ---------------------------------------------------------------------------

describe('describe()', () => {
  it('returns description and example', () => {
    const handler = makeHandler(docFormat);
    const desc    = handler.describe();
    expect(desc).toHaveProperty('description');
    expect(desc).toHaveProperty('example');
  });

  it('description matches format description', () => {
    const handler = makeHandler(docFormat);
    expect(handler.describe().description).toBe(docFormat.description);
  });
});
