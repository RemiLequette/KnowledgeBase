import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MdSyntaxAdapter } from '../handlers/md-extension-handler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES  = path.join(__dirname, 'fixtures');

function fixture(name) {
  return fs.readFileSync(path.join(FIXTURES, name), 'utf8');
}

const adapter = new MdSyntaxAdapter();

// ---------------------------------------------------------------------------
// Grammar fixtures — minimal grammars for section parsing tests
// ---------------------------------------------------------------------------

const grammarWhyWhatHow = {
  sections: [
    { name: 'why',  format: 'text' },
    { name: 'what', format: 'text' },
    { name: 'how',  format: 'text' },
  ]
};

// ---------------------------------------------------------------------------
// parseMetadata()
// ---------------------------------------------------------------------------

describe('parseMetadata()', () => {
  it('extracts format from a valid metadata block', () => {
    const raw  = fixture('md-doc-full.md');
    const meta = adapter.parseMetadata(raw);
    expect(meta).not.toBeNull();
    expect(meta.format).toBe('doc');
  });

  it('extracts all YAML fields from metadata block', () => {
    const raw  = fixture('md-doc-full.md');
    const meta = adapter.parseMetadata(raw);
    expect(meta.version).toBe('1.0');
  });

  it('returns null when no metadata block is present', () => {
    const raw  = fixture('md-native.md');
    const meta = adapter.parseMetadata(raw);
    expect(meta).toBeNull();
  });

  it('returns null when forge-start is present but forge-end is missing', () => {
    const raw  = '[//]: # (forge-start)\nformat: doc\n';
    const meta = adapter.parseMetadata(raw);
    expect(meta).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// serializeMetadata()
// ---------------------------------------------------------------------------

describe('serializeMetadata()', () => {
  it('produces a valid metadata block string', () => {
    const block = adapter.serializeMetadata({ format: 'doc', version: '1.0' });
    expect(block).toContain('forge-start');
    expect(block).toContain('forge-end');
    expect(block).toContain('format: doc');
  });

  it('round-trips: parseMetadata(serializeMetadata(meta)) equals meta', () => {
    const meta   = { format: 'todo', version: '2.0' };
    const block  = adapter.serializeMetadata(meta);
    const parsed = adapter.parseMetadata(block + '\n## Section\nContent');
    expect(parsed.format).toBe('todo');
    expect(parsed.version).toBe('2.0');
  });
});

// ---------------------------------------------------------------------------
// parseSections()
// ---------------------------------------------------------------------------

describe('parseSections()', () => {
  it('returns one Section per ## heading found', () => {
    const raw      = fixture('md-doc-full.md');
    const sections = adapter.parseSections(raw, grammarWhyWhatHow);
    expect(sections).toHaveLength(3);
  });

  it('each section has the correct name', () => {
    const raw      = fixture('md-doc-full.md');
    const sections = adapter.parseSections(raw, grammarWhyWhatHow);
    expect(sections.map(s => s.name)).toEqual(['why', 'what', 'how']);
  });

  it('each section carries its raw content (trimmed)', () => {
    const raw      = fixture('md-doc-full.md');
    const sections = adapter.parseSections(raw, grammarWhyWhatHow);
    expect(sections[0].content.trim()).toBe('Why content here.');
    expect(sections[1].content.trim()).toBe('What content here.');
    expect(sections[2].content.trim()).toBe('How content here.');
  });

  it('returns only sections present when file is partial', () => {
    const raw      = fixture('md-doc-partial.md');
    const sections = adapter.parseSections(raw, grammarWhyWhatHow);
    expect(sections).toHaveLength(1);
    expect(sections[0].name).toBe('why');
  });

  it('strips the metadata block — metadata content is not in any section', () => {
    const raw      = fixture('md-doc-full.md');
    const sections = adapter.parseSections(raw, grammarWhyWhatHow);
    for (const s of sections) {
      expect(s.content).not.toContain('forge-start');
      expect(s.content).not.toContain('format:');
    }
  });
});

// ---------------------------------------------------------------------------
// serializeSections()
// ---------------------------------------------------------------------------

describe('serializeSections()', () => {
  it('reconstructs a file with metadata block + sections', () => {
    const raw      = fixture('md-doc-full.md');
    const sections = adapter.parseSections(raw, grammarWhyWhatHow);
    const output   = adapter.serializeSections(sections, raw);
    expect(output).toContain('forge-start');
    expect(output).toContain('## Why');
    expect(output).toContain('## What');
    expect(output).toContain('## How');
  });

  it('round-trips: parseSections(serializeSections(sections)) equals original sections', () => {
    const raw       = fixture('md-doc-full.md');
    const sections  = adapter.parseSections(raw, grammarWhyWhatHow);
    const output    = adapter.serializeSections(sections, raw);
    const sections2 = adapter.parseSections(output, grammarWhyWhatHow);
    expect(sections2.map(s => s.name)).toEqual(sections.map(s => s.name));
    expect(sections2.map(s => s.content.trim())).toEqual(sections.map(s => s.content.trim()));
  });

  it('updated section content is reflected in output', () => {
    const raw      = fixture('md-doc-full.md');
    const sections = adapter.parseSections(raw, grammarWhyWhatHow);
    sections[0]    = { ...sections[0], content: 'Updated why content.' };
    const output   = adapter.serializeSections(sections, raw);
    expect(output).toContain('Updated why content.');
    expect(output).not.toContain('Why content here.');
  });
});

// ---------------------------------------------------------------------------
// buildSkeleton()
// ---------------------------------------------------------------------------

describe('buildSkeleton()', () => {
  it('generates a metadata block with the correct format name', () => {
    const skeleton = adapter.buildSkeleton({ name: 'doc', sections: grammarWhyWhatHow.sections });
    const meta     = adapter.parseMetadata(skeleton);
    expect(meta).not.toBeNull();
    expect(meta.format).toBe('doc');
  });

  it('generates one ## heading per section', () => {
    const skeleton = adapter.buildSkeleton({ name: 'doc', sections: grammarWhyWhatHow.sections });
    expect(skeleton).toContain('## Why');
    expect(skeleton).toContain('## What');
    expect(skeleton).toContain('## How');
  });

  it('sections are empty in the skeleton', () => {
    const skeleton = adapter.buildSkeleton({ name: 'doc', sections: grammarWhyWhatHow.sections });
    const sections = adapter.parseSections(skeleton, grammarWhyWhatHow);
    for (const s of sections) {
      expect(s.content.trim()).toBe('');
    }
  });
});
