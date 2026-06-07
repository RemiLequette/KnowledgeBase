/**
 * server-core.test.js
 *
 * A priori tests for tools/lib/server-core.js
 * Written from spec (conventions/local-server.md) before the implementation.
 *
 * Args: none
 */

const assert = require('assert');
const path   = require('path');
const fs     = require('fs');

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

const FIXTURES = path.resolve(__dirname, 'fixtures');
const SANDBOX  = path.resolve(__dirname, 'sandbox');

// Load module under test — will fail until server-core.js is written (expected)
let core;
try {
  core = require('../lib/server-core');
} catch (e) {
  console.log('ERROR:MODULE_NOT_FOUND:server-core.js not found — run tests again after writing the implementation');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

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
// Sandbox setup helpers
// ---------------------------------------------------------------------------

function resetSandbox() {
  if (fs.existsSync(SANDBOX)) fs.rmSync(SANDBOX, { recursive: true });
  fs.mkdirSync(SANDBOX, { recursive: true });
}

function sandboxPath(...parts) {
  return path.join(SANDBOX, ...parts);
}

// ---------------------------------------------------------------------------
// safePath — path traversal prevention
// ---------------------------------------------------------------------------

// @convention conventions/local-server.md [section Security]
test('safePath: returns resolved path when inside an allowed root', () => {
  const roots = [FIXTURES];
  const result = core.safePath(path.join(FIXTURES, 'sample.json'), roots);
  assert.strictEqual(result, path.resolve(FIXTURES, 'sample.json'));
});

// @convention conventions/local-server.md [section Security]
test('safePath: returns null when path is outside all allowed roots', () => {
  const roots = [FIXTURES];
  const result = core.safePath(path.resolve(FIXTURES, '..', '..', 'secret.txt'), roots);
  assert.strictEqual(result, null);
});

// @convention conventions/local-server.md [section Security]
test('safePath: returns null when path traverses out via ../', () => {
  const roots = [FIXTURES];
  const result = core.safePath(FIXTURES + path.sep + '..' + path.sep + 'outside.txt', roots);
  assert.strictEqual(result, null);
});

// @convention conventions/local-server.md [section Security]
test('safePath: accepts path inside second allowed root', () => {
  const roots = [FIXTURES, SANDBOX];
  resetSandbox();
  const result = core.safePath(path.join(SANDBOX, 'file.json'), roots);
  assert.ok(result !== null);
});

// @convention conventions/local-server.md [section Security]
test('safePath: returns null when no allowed roots provided', () => {
  const result = core.safePath(path.join(FIXTURES, 'sample.json'), []);
  assert.strictEqual(result, null);
});

// ---------------------------------------------------------------------------
// readFile
// ---------------------------------------------------------------------------

// @convention conventions/local-server.md [section API Contract]
test('readFile: returns content and status 200 for existing file', () => {
  const roots = [FIXTURES];
  const result = core.readFile(path.join(FIXTURES, 'sample.json'), roots);
  assert.strictEqual(result.status, 200);
  assert.ok(result.content.includes('"hello"'));
});

// @convention conventions/local-server.md [section API Contract]
test('readFile: returns status 404 for missing file', () => {
  const roots = [FIXTURES];
  const result = core.readFile(path.join(FIXTURES, 'does-not-exist.json'), roots);
  assert.strictEqual(result.status, 404);
});

// @convention conventions/local-server.md [section API Contract]
test('readFile: returns status 403 for path outside allowed roots', () => {
  const roots = [FIXTURES];
  const result = core.readFile(path.resolve(FIXTURES, '..', 'outside.json'), roots);
  assert.strictEqual(result.status, 403);
});

// @convention conventions/local-server.md [section API Contract]
test('readFile: returns content of nested file', () => {
  const roots = [FIXTURES];
  const result = core.readFile(path.join(FIXTURES, 'subdir', 'nested.json'), roots);
  assert.strictEqual(result.status, 200);
  assert.ok(result.content.includes('"nested"'));
});

// ---------------------------------------------------------------------------
// writeFile
// ---------------------------------------------------------------------------

// @convention conventions/local-server.md [section API Contract]
test('writeFile: creates file and returns status 200', () => {
  resetSandbox();
  const roots = [SANDBOX];
  const target = sandboxPath('output.json');
  const result = core.writeFile(target, '{"written":true}', roots);
  assert.strictEqual(result.status, 200);
  assert.ok(fs.existsSync(target));
  assert.ok(fs.readFileSync(target, 'utf8').includes('"written"'));
});

// @convention conventions/local-server.md [section API Contract]
test('writeFile: creates intermediate directories if needed', () => {
  resetSandbox();
  const roots = [SANDBOX];
  const target = sandboxPath('deep', 'nested', 'file.json');
  const result = core.writeFile(target, '{"deep":true}', roots);
  assert.strictEqual(result.status, 200);
  assert.ok(fs.existsSync(target));
});

// @convention conventions/local-server.md [section API Contract]
test('writeFile: overwrites existing file', () => {
  resetSandbox();
  const roots = [SANDBOX];
  const target = sandboxPath('overwrite.json');
  core.writeFile(target, '{"v":1}', roots);
  core.writeFile(target, '{"v":2}', roots);
  const content = fs.readFileSync(target, 'utf8');
  assert.ok(content.includes('"v":2'));
  assert.ok(!content.includes('"v":1'));
});

// @convention conventions/local-server.md [section API Contract]
test('writeFile: returns status 403 for path outside allowed roots', () => {
  resetSandbox();
  const roots = [SANDBOX];
  const result = core.writeFile(path.resolve(SANDBOX, '..', 'outside.json'), '{}', roots);
  assert.strictEqual(result.status, 403);
});

// @convention conventions/local-server.md [section What the server does not do]
test('writeFile: writes non-JSON body as-is (no validation)', () => {
  resetSandbox();
  const roots = [SANDBOX];
  const target = sandboxPath('raw.txt');
  const result = core.writeFile(target, 'not json at all', roots);
  assert.strictEqual(result.status, 200);
  assert.strictEqual(fs.readFileSync(target, 'utf8'), 'not json at all');
});

// ---------------------------------------------------------------------------
// deleteFile
// ---------------------------------------------------------------------------

// @convention conventions/local-server.md [section API Contract]
test('deleteFile: deletes existing file and returns status 200', () => {
  resetSandbox();
  const roots = [SANDBOX];
  const target = sandboxPath('todelete.json');
  fs.writeFileSync(target, '{}');
  const result = core.deleteFile(target, roots);
  assert.strictEqual(result.status, 200);
  assert.ok(!fs.existsSync(target));
});

// @convention conventions/local-server.md [section API Contract]
test('deleteFile: returns status 200 even when file does not exist (idempotent)', () => {
  resetSandbox();
  const roots = [SANDBOX];
  const result = core.deleteFile(sandboxPath('nonexistent.json'), roots);
  assert.strictEqual(result.status, 200);
});

// @convention conventions/local-server.md [section API Contract]
test('deleteFile: returns status 403 for path outside allowed roots', () => {
  const roots = [SANDBOX];
  const result = core.deleteFile(path.resolve(SANDBOX, '..', 'outside.json'), roots);
  assert.strictEqual(result.status, 403);
});

// ---------------------------------------------------------------------------
// listDir
// ---------------------------------------------------------------------------

// @convention conventions/local-server.md [section API Contract]
test('listDir: returns entries for existing directory', () => {
  const roots = [FIXTURES];
  const result = core.listDir(FIXTURES, roots);
  assert.strictEqual(result.status, 200);
  assert.ok(Array.isArray(result.entries));
});

// @convention conventions/local-server.md [section API Contract]
test('listDir: entries include files with type "file"', () => {
  const roots = [FIXTURES];
  const result = core.listDir(FIXTURES, roots);
  const sample = result.entries.find(e => e.name === 'sample.json');
  assert.ok(sample, 'sample.json not found in entries');
  assert.strictEqual(sample.type, 'file');
});

// @convention conventions/local-server.md [section API Contract]
test('listDir: entries include subdirectories with type "dir"', () => {
  const roots = [FIXTURES];
  const result = core.listDir(FIXTURES, roots);
  const subdir = result.entries.find(e => e.name === 'subdir');
  assert.ok(subdir, 'subdir not found in entries');
  assert.strictEqual(subdir.type, 'dir');
});

// @convention conventions/local-server.md [section API Contract]
test('listDir: entries are sorted alphabetically by name', () => {
  const roots = [FIXTURES];
  const result = core.listDir(FIXTURES, roots);
  const names = result.entries.map(e => e.name);
  const sorted = [...names].sort();
  assert.deepStrictEqual(names, sorted);
});

// @convention conventions/local-server.md [section API Contract]
test('listDir: returns status 404 for non-existent directory', () => {
  const roots = [FIXTURES];
  const result = core.listDir(path.join(FIXTURES, 'no-such-dir'), roots);
  assert.strictEqual(result.status, 404);
});

// @convention conventions/local-server.md [section API Contract]
test('listDir: returns status 403 for path outside allowed roots', () => {
  const roots = [FIXTURES];
  const result = core.listDir(path.resolve(FIXTURES, '..', '..'), roots);
  assert.strictEqual(result.status, 403);
});

// @convention conventions/local-server.md [section API Contract]
test('listDir: returns empty entries array for empty directory', () => {
  resetSandbox();
  const roots = [SANDBOX];
  const result = core.listDir(SANDBOX, roots);
  assert.strictEqual(result.status, 200);
  assert.deepStrictEqual(result.entries, []);
});

// ---------------------------------------------------------------------------
// parseAllowedRoots — CLI argument parsing
// ---------------------------------------------------------------------------

// @convention conventions/local-server.md [section Startup]
test('parseAllowedRoots: extracts path arguments, skips --port and its value', () => {
  const args = ['C:/Users/Remi/Dropbox', '--port', '3000', 'D:/Projects'];
  const roots = core.parseAllowedRoots(args);
  assert.deepStrictEqual(roots, ['C:/Users/Remi/Dropbox', 'D:/Projects']);
});

// @convention conventions/local-server.md [section Startup]
test('parseAllowedRoots: returns empty array when no path arguments given', () => {
  const roots = core.parseAllowedRoots(['--port', '8080']);
  assert.deepStrictEqual(roots, []);
});

// @convention conventions/local-server.md [section Startup]
test('parsePort: returns provided port as number', () => {
  const port = core.parsePort(['--port', '8080', 'C:/roots']);
  assert.strictEqual(port, 8080);
});

// @convention conventions/local-server.md [section Startup]
test('parsePort: returns default 3000 when --port not provided', () => {
  const port = core.parsePort(['C:/roots']);
  assert.strictEqual(port, 3000);
});

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------

console.log('');
if (failed === 0) {
  console.log('OK');
} else {
  console.log('FAIL: ' + failed + ' test(s) failed');
}

process.exit(failed > 0 ? 1 : 0);
