import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

import * as fileRoot from '../handlers/file-root.js';

// ---------------------------------------------------------------------------
// Sandbox
// ---------------------------------------------------------------------------

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const SANDBOX    = path.join(__dirname, 'fixtures', 'sandbox', 'file-root');

function url(rel) {
  return pathToFileURL(path.join(SANDBOX, rel)).href;
}

/** Build a file UrlRef from a relative path inside the sandbox. */
function fileRef(rel) {
  const full = path.join(SANDBOX, rel);
  const ext  = path.extname(rel);
  const name = path.basename(rel, ext);
  const dir  = path.relative(SANDBOX, path.dirname(full)).replace(/\\/g, '/');
  return {
    root:      'test',
    path:      dir ? dir + '/' : '',
    name,
    extension: ext,
    _url:      pathToFileURL(full).href,
  };
}

/** Build a folder UrlRef from a relative path inside the sandbox. */
function folderRef(rel) {
  const full = path.join(SANDBOX, rel);
  return {
    root:      'test',
    path:      rel ? rel.replace(/\\/g, '/').replace(/\/?$/, '/') : '',
    name:      '',
    extension: '',
    _url:      pathToFileURL(full).href + '/',
  };
}

beforeAll(() => {
  fs.mkdirSync(SANDBOX, { recursive: true });
});

afterAll(() => {
  fs.rmSync(SANDBOX, { recursive: true, force: true });
});

beforeEach(() => {
  for (const entry of fs.readdirSync(SANDBOX)) {
    fs.rmSync(path.join(SANDBOX, entry), { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// registerRoot()
// ---------------------------------------------------------------------------

describe('registerRoot()', () => {
  it('registers a root without error', () => {
    expect(() => fileRoot.registerRoot('test', url(''))).not.toThrow();
  });

  it('accepts url with or without trailing slash', () => {
    const base = url('');
    const withSlash    = base.endsWith('/') ? base : base + '/';
    const withoutSlash = base.endsWith('/') ? base.slice(0, -1) : base;
    expect(() => fileRoot.registerRoot('r1', withoutSlash)).not.toThrow();
    expect(() => fileRoot.registerRoot('r2', withSlash)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// create()
// ---------------------------------------------------------------------------

describe('create()', () => {
  it('creates an empty file', async () => {
    const ref = fileRef('hello.md');
    await fileRoot.create(ref);
    expect(fs.existsSync(fileURLToPath(ref._url))).toBe(true);
    expect(fs.readFileSync(fileURLToPath(ref._url), 'utf8')).toBe('');
  });

  it('throws if the file already exists', async () => {
    const ref = fileRef('exists.md');
    await fileRoot.create(ref);
    await expect(fileRoot.create(ref)).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// read()
// ---------------------------------------------------------------------------

describe('read()', () => {
  it('returns file content', async () => {
    const ref = fileRef('read-me.md');
    fs.writeFileSync(fileURLToPath(ref._url), 'hello world', 'utf8');
    const content = await fileRoot.read(ref);
    expect(content).toBe('hello world');
  });

  it('throws if the file does not exist', async () => {
    await expect(fileRoot.read(fileRef('missing.md'))).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// write()
// ---------------------------------------------------------------------------

describe('write()', () => {
  it('replaces file content', async () => {
    const ref = fileRef('write-me.md');
    fs.writeFileSync(fileURLToPath(ref._url), 'old', 'utf8');
    await fileRoot.write(ref, 'new content');
    expect(fs.readFileSync(fileURLToPath(ref._url), 'utf8')).toBe('new content');
  });

  it('throws if the file does not exist', async () => {
    await expect(fileRoot.write(fileRef('missing.md'), 'x')).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// delete()
// ---------------------------------------------------------------------------

describe('delete()', () => {
  it('removes the file', async () => {
    const ref = fileRef('bye.md');
    fs.writeFileSync(fileURLToPath(ref._url), '', 'utf8');
    await fileRoot.delete(ref);
    expect(fs.existsSync(fileURLToPath(ref._url))).toBe(false);
  });

  it('throws if the file does not exist', async () => {
    await expect(fileRoot.delete(fileRef('missing.md'))).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// list()
// ---------------------------------------------------------------------------

describe('list()', () => {
  it('returns empty arrays for an empty folder', async () => {
    const result = await fileRoot.list(folderRef(''));
    expect(result).toEqual({ folders: [], artifacts: [] });
  });

  it('lists files as artifacts', async () => {
    fs.writeFileSync(path.join(SANDBOX, 'a.md'), '', 'utf8');
    fs.writeFileSync(path.join(SANDBOX, 'b.md'), '', 'utf8');
    const { artifacts, folders } = await fileRoot.list(folderRef(''));
    expect(folders).toHaveLength(0);
    expect(artifacts).toHaveLength(2);
    expect(artifacts.map(r => r.name).sort()).toEqual(['a', 'b']);
  });

  it('lists subdirectories as folders', async () => {
    fs.mkdirSync(path.join(SANDBOX, 'sub'));
    const { folders, artifacts } = await fileRoot.list(folderRef(''));
    expect(artifacts).toHaveLength(0);
    expect(folders).toHaveLength(1);
    expect(folders[0].path).toContain('sub');
  });

  it('throws if the folder does not exist', async () => {
    await expect(fileRoot.list(folderRef('missing'))).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// mkdir()
// ---------------------------------------------------------------------------

describe('mkdir()', () => {
  it('creates a folder', async () => {
    const ref = folderRef('newdir');
    await fileRoot.mkdir(ref);
    expect(fs.statSync(path.join(SANDBOX, 'newdir')).isDirectory()).toBe(true);
  });

  it('throws if the folder already exists', async () => {
    const ref = folderRef('existing');
    fs.mkdirSync(path.join(SANDBOX, 'existing'));
    await expect(fileRoot.mkdir(ref)).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// rmdir()
// ---------------------------------------------------------------------------

describe('rmdir()', () => {
  it('removes an empty folder', async () => {
    fs.mkdirSync(path.join(SANDBOX, 'empty'));
    await fileRoot.rmdir(folderRef('empty'));
    expect(fs.existsSync(path.join(SANDBOX, 'empty'))).toBe(false);
  });

  it('throws if the folder does not exist', async () => {
    await expect(fileRoot.rmdir(folderRef('missing'))).rejects.toThrow();
  });

  it('throws if the folder is not empty', async () => {
    fs.mkdirSync(path.join(SANDBOX, 'notempty'));
    fs.writeFileSync(path.join(SANDBOX, 'notempty', 'file.md'), '', 'utf8');
    await expect(fileRoot.rmdir(folderRef('notempty'))).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// rename()
// ---------------------------------------------------------------------------

describe('rename()', () => {
  it('renames a folder in place', async () => {
    fs.mkdirSync(path.join(SANDBOX, 'old-name'));
    await fileRoot.rename(folderRef('old-name'), 'new-name');
    expect(fs.existsSync(path.join(SANDBOX, 'new-name'))).toBe(true);
    expect(fs.existsSync(path.join(SANDBOX, 'old-name'))).toBe(false);
  });

  it('throws if target name already exists', async () => {
    fs.mkdirSync(path.join(SANDBOX, 'src'));
    fs.mkdirSync(path.join(SANDBOX, 'taken'));
    await expect(fileRoot.rename(folderRef('src'), 'taken')).rejects.toThrow();
  });

  it('throws for invalid name (contains slash)', async () => {
    fs.mkdirSync(path.join(SANDBOX, 'valid'));
    await expect(fileRoot.rename(folderRef('valid'), 'a/b')).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// move()
// ---------------------------------------------------------------------------

describe('move()', () => {
  it('moves a folder to a new path', async () => {
    fs.mkdirSync(path.join(SANDBOX, 'src'));
    await fileRoot.move(folderRef('src'), folderRef('dst'));
    expect(fs.existsSync(path.join(SANDBOX, 'dst'))).toBe(true);
    expect(fs.existsSync(path.join(SANDBOX, 'src'))).toBe(false);
  });

  it('throws if destination already exists', async () => {
    fs.mkdirSync(path.join(SANDBOX, 'from'));
    fs.mkdirSync(path.join(SANDBOX, 'to'));
    await expect(fileRoot.move(folderRef('from'), folderRef('to'))).rejects.toThrow();
  });
});
