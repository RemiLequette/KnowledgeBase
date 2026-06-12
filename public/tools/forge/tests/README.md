# Forge — Test Suite

*Document type: Guide*

## Quick Start

Test plan for the Forge MCP server (`public/tools/forge/`).
Covers what is tested, where, and what is not yet covered.
Read at the start of any session involving Forge tests.

## Keywords
forge, tests, vitest, coverage, fixtures, gaps, plan

## Table of Contents

1. [Strategy](#strategy)
2. [Unit Tests](#unit-tests)
3. [Structure](#structure)
4. [Coverage](#coverage)
5. [Fixtures](#fixtures)
6. [Conventions](#conventions)
7. [Gaps](#gaps)
8. [Changelog](#changelog)

---

## Strategy
[up](#table-of-contents)

### Levels

Three levels of test, applied progressively.

**Unit** — one module in isolation. Dependencies are substituted (adapter) or mocked (handler). All current tests are at this level.

**Integration** — two or more real modules wired together, no mocks. Currently in the Gaps — blocked on `forge-formats.json` v1 (W5). Primary targets once W5 is delivered: `FormatRegistry.dispatch()` → `initSequence()` + `MdSyntaxAdapter` end-to-end, and `RootRegistry.load()` with real handler files on disk.

**End-to-end** — full MCP tool layer with a real config and a real filesystem. Not planned at this stage.

### Isolation axes

Two substitution patterns keep unit tests fast and failure-precise.

**Adapter substitution** — `ShimSyntaxAdapter` replaces `MdSyntaxAdapter` in all `sequence.js` tests. A failure points to sequence logic, not Markdown parsing.

**Mock handler** — `mock-handler.js` replaces real format handlers in `FormatRegistry` tests. `claimResult` in the fixture JSON is the single control point — no real parsing involved.

### External dependencies

Filesystem access is confined to `file-root.test.js`, which runs against an isolated sandbox created and destroyed per test run. All other tests are purely in-memory — no disk access, no network.

### Priority for new tests

1. Fill unit gaps — repeat section write, lazy key extraction, error message content (see Gaps)
2. Integration tests — after W5 delivers `forge-formats.json` v1
3. End-to-end — deferred

---

## Unit Tests
[up](#table-of-contents)

One table per test file. **✅ existing** — test is present and passing. **⬜ gap** — behaviour identified but not yet covered.

### sequence.test.js

| Test | Behaviour | Status |
|---|---|---|
| `claim()` returns true — format matches | Metadata format matches handler format name | ✅ |
| `claim()` returns false — format mismatch | Metadata declares a different format | ✅ |
| `claim()` returns false — no metadata block | Raw content has no `@@forge` header | ✅ |
| `read()` returns format name | Response includes `format` field with correct value | ✅ |
| `read()` returns each section as a field | All sections present in file appear as top-level fields | ✅ |
| `read()` optional section absent → undefined | Missing optional section is not present in response | ✅ |
| `read()` does not include metadata | Metadata block content is stripped from response | ✅ |
| `read()` lazy section returns key list | Lazy repeat section returns array of keys, not full content | ✅ |
| `read()` query returns only requested section | Dot-notation query filters response to one section | ✅ |
| `read()` query on lazy entry — full content | `changelog.key` returns full entry content, not just key | ⬜ |
| `read()` throws on unknown query path | Query for a non-existent section raises a navigation error | ⬜ |
| `write()` updates a section without touching others | Narrow write leaves untouched sections intact | ✅ |
| `write()` preserves metadata block | Metadata block survives a write operation | ✅ |
| `write()` repeat section — full replacement | Payload replaces a repeat section entirely | ⬜ |
| `write()` repeat section — empty array | Payload with empty array clears all occurrences | ⬜ |
| `write()` on unknown section — throws | Payload key absent from format grammar is rejected | ⬜ |
| `create()` writes skeleton with metadata block | Created file contains a valid metadata block | ✅ |
| `create()` skeleton contains mandatory sections | All non-optional sections present after create | ✅ |
| `describe()` returns description and example | Return value has both `description` and `example` fields | ✅ |
| `describe()` description matches format | `description` equals the format's declared description | ✅ |

### format-registry.test.js

| Test | Behaviour | Status |
|---|---|---|
| `load()` valid config — no error | Valid `forge-formats.json` loads without throwing | ✅ |
| `load()` registers formats by extension | `formatsForExtension()` returns correct count per extension | ✅ |
| `load()` unknown extension returns empty array | `formatsForExtension('py')` returns `[]` | ✅ |
| `load()` throws on duplicate format name | Two formats with same name on same extension is a build error | ✅ |
| `load()` throws if config file missing | Missing file path raises an error | ✅ |
| `load()` throws on format without handler | Format with no `handler` and no `extends` chain must fail | ⬜ |
| `dispatch()` returns first handler with `claim=true` | Claim loop stops at first matching handler | ✅ |
| `dispatch()` returns null — no handler claims | All handlers return false → null | ✅ |
| `dispatch()` returns null — unknown extension | Extension not in registry → null | ✅ |
| `dispatch()` respects declaration order | First handler in declaration order wins | ✅ |
| `getByName()` returns handler for known format | Named lookup succeeds for registered format | ✅ |
| `getByName()` works across extensions | Format on `.js` is found by name | ✅ |
| `getByName()` returns null for unknown name | Unregistered name → null | ✅ |
| `describe()` returns all extensions and formats | All registered extensions and format names present in output | ✅ |
| `load()` `optional` combined with explicit `min`/`max` — throws | `optional: true` alongside `min` or `max` is a build error | ⬜ |

### md-extension-handler.test.js

| Test | Behaviour | Status |
|---|---|---|
| `parseMetadata()` extracts format from valid block | `format` field parsed correctly | ✅ |
| `parseMetadata()` extracts all YAML fields | Additional fields (e.g. `version`) are present in result | ✅ |
| `parseMetadata()` returns null — no metadata block | Plain Markdown with no forge block → null | ✅ |
| `parseMetadata()` returns null — forge-end missing | Incomplete block (no closing marker) → null | ✅ |
| `serializeMetadata()` produces valid block string | Output contains `forge-start`, `forge-end`, format field | ✅ |
| `serializeMetadata()` round-trips with `parseMetadata()` | `parse(serialize(meta))` equals original meta | ✅ |
| `parseSections()` returns one section per `##` heading | Section count matches heading count in file | ✅ |
| `parseSections()` each section has correct name | Section names match heading text (lowercased) | ✅ |
| `parseSections()` each section carries trimmed content | Content matches expected text per section | ✅ |
| `parseSections()` partial file — only present sections returned | Missing sections are absent from result | ✅ |
| `parseSections()` strips metadata block | No section contains `forge-start` or `format:` | ✅ |
| `serializeSections()` reconstructs file with metadata + sections | Output contains forge block and all `##` headings | ✅ |
| `serializeSections()` round-trips with `parseSections()` | Names and content survive a serialize → parse cycle | ✅ |
| `serializeSections()` updated content reflected in output | Modified section content appears in serialized file | ✅ |
| `buildSkeleton()` generates metadata block with correct format | `parseMetadata()` on skeleton returns correct format name | ✅ |
| `buildSkeleton()` generates one heading per section | Each section name produces a `##` heading | ✅ |
| `buildSkeleton()` sections are empty | All sections have empty content in skeleton | ✅ |
| `buildSkeleton()` headings are capitalized — contract | Section name `why` produces `## Why` (capitalization is a contract, not an accident) | ⬜ |
| `serializeMetadata()` ignores unknown fields | Extra keys in meta object do not corrupt the block | ⬜ |

### root-registry.test.js

| Test | Behaviour | Status |
|---|---|---|
| `rootRefs()` empty when no roots loaded | Empty registry returns `[]` | ✅ |
| `rootRefs()` returns one ref per root | Ref count matches loaded root count | ✅ |
| `rootRefs()` each ref has correct shape | Each ref has `root`, `path`, `name`, `type` fields | ✅ |
| `read()` delegates to root handler | Handler `read()` is called with the urlRef | ✅ |
| `write()` delegates to root handler | Handler `write()` is called with urlRef and content | ✅ |
| `create()` delegates to root handler | Handler `create()` is called with the urlRef | ✅ |
| `delete()` delegates to root handler | Handler `delete()` is called with the urlRef | ✅ |
| `read()` throws for unknown root | Unknown root name raises an error | ✅ |
| `write()` throws for unknown root | Unknown root name raises an error | ✅ |
| `create()` throws for unknown root | Unknown root name raises an error | ✅ |
| `delete()` throws for unknown root | Unknown root name raises an error | ✅ |
| `list()` delegates to root handler | Handler `list()` is called and result returned | ✅ |
| `mkdir()` delegates to root handler | Handler `mkdir()` is called | ✅ |
| `rmdir()` delegates to root handler | Handler `rmdir()` is called | ✅ |
| `rndir()` delegates to root handler | Handler `rename()` is called | ✅ |
| `list()` throws for unknown root | Unknown root name raises an error | ✅ |
| `mkdir()` throws for unknown root | Unknown root name raises an error | ✅ |
| `mvdir()` same root — delegates to handler | `move()` called on the root handler | ✅ |
| `mvdir()` cross-root — throws | Moving across roots raises a specific error | ✅ |
| `load()` — dynamic handler import | `load()` resolves handler modules from disk and registers roots | ⬜ |

### content-handlers.test.js

| Test | Behaviour | Status |
|---|---|---|
| `forge_read` reads file via rootRegistry | `rootRegistry.read()` called | ✅ |
| `forge_read` dispatches claim and calls handler.read | `formatRegistry.dispatch()` + `handler.read()` called | ✅ |
| `forge_read` native fallback — no handler claims | Returns `{ format, content }` raw | ✅ |
| `forge_read` passes query to handler.read | `query` arg transmitted correctly | ✅ |
| `forge_read` throws when path missing | Missing `path` raises an error | ✅ |
| `forge_write` reads file then calls handler.write | Claim loop + `handler.write()` with payload | ✅ |
| `forge_write` native fallback — writes raw content | No handler → `rootRegistry.write()` called | ✅ |
| `forge_write` throws when path missing | Missing `path` raises an error | ✅ |
| `forge_write` throws when payload missing | Missing `payload` raises an error | ✅ |
| `forge_create` looks up format and calls handler.create | `formatRegistry.getByName()` + `handler.create()` | ✅ |
| `forge_create` throws for unknown format name | Unregistered format name raises an error | ✅ |
| `forge_create` throws when path missing | Missing `path` raises an error | ✅ |
| `forge_create` throws when format missing | Missing `format` raises an error | ✅ |
| `forge_delete` calls rootRegistry.delete | `rootRegistry.delete()` called with ref | ✅ |
| `forge_delete` throws when path missing | Missing `path` raises an error | ✅ |

### path-parser.test.js

| Test | Behaviour | Status |
|---|---|---|
| `parsePath()` file — root + path + name + extension | Full file path parses to correct ref fields | ✅ |
| `parsePath()` file — root level (no subdirectory) | File at root produces empty `path` | ✅ |
| `parsePath()` file — deeply nested | Multi-level path populates `path` correctly | ✅ |
| `parsePath()` file — no extension | File without extension produces empty `extension` | ✅ |
| `parsePath()` folder — trailing slash | Path ending with `/` produces folder ref | ✅ |
| `parsePath()` folder — root folder | `rootName/` produces empty `path` folder ref | ✅ |
| `parsePath()` folder — root name only | No slash → root-level folder ref | ✅ |
| `parsePath()` folder — hint forces folder | `hint='folder'` overrides missing trailing slash | ✅ |
| `parsePath()` folder — nested with trailing slash | Multi-level folder path parsed correctly | ✅ |
| `parsePath()` throws on empty string | Empty input raises an error | ✅ |
| `parsePath()` normalizes backslashes | Windows separators converted to forward slashes | ✅ |
| `serializePath()` file ref | Ref serializes to `root/path/name.ext` | ✅ |
| `serializePath()` file ref no extension | No extension → no trailing dot | ✅ |
| `serializePath()` folder ref | Folder ref serializes with trailing slash | ✅ |
| `serializePath()` root folder ref | Root folder produces `root/` | ✅ |
| `serializePath()` round-trip file | `serialize(parse(path))` equals original | ✅ |
| `serializePath()` round-trip folder | `serialize(parse(path))` equals original | ✅ |

### navigation-handlers.test.js

| Test | Behaviour | Status |
|---|---|---|
| `forge_ls` no path — returns root names | `rootRefs()` called, result lists root names | ✅ |
| `forge_ls` folder path — calls list() and returns entries | `list()` called, entries typed as folder/file | ✅ |
| `forge_ls` no rootRegistry — stub result | Missing context returns `not implemented` | ✅ |
| `forge_mkdir` calls mkdir with folder ref | `rootRegistry.mkdir()` called with correct ref | ✅ |
| `forge_mkdir` throws when path missing | Missing `path` raises an error | ✅ |
| `forge_mkdir` no rootRegistry — stub result | Missing context returns `not implemented` | ✅ |
| `forge_rmdir` calls rmdir with folder ref | `rootRegistry.rmdir()` called with correct ref | ✅ |
| `forge_rmdir` throws when path missing | Missing `path` raises an error | ✅ |
| `forge_move` same-root folder move | `rootRegistry.mvdir()` called | ✅ |
| `forge_move` throws on cross-root move | Different roots raises an error | ✅ |
| `forge_move` throws when path missing | Missing `path` raises an error | ✅ |
| `forge_move` throws when target missing | Missing `target` raises an error | ✅ |
| `forge_rename` calls rndir with ref and name | `rootRegistry.rndir()` called with correct args | ✅ |
| `forge_rename` throws when path missing | Missing `path` raises an error | ✅ |
| `forge_rename` throws when name missing | Missing `name` raises an error | ✅ |

### mcp-server.test.js

| Test | Behaviour | Status |
|---|---|---|
| `loadTools()` valid config — no error | Valid `forge-tools.json` loads without throwing | ✅ |
| `loadTools()` registers all declared tools | `toolNames()` count and names match config entries | ✅ |
| `loadTools()` throws if config file missing | Missing file path raises an error | ✅ |
| `loadTools()` throws if handler path cannot be resolved | Unresolvable handler path raises an error | ✅ |
| `dispatch()` calls the correct handler | Tool call is routed to the registered handler | ✅ |
| `dispatch()` passes input to handler | Input payload is transmitted to `execute()` | ✅ |
| `dispatch()` returns handler result | Handler return value is forwarded to caller | ✅ |
| `dispatch()` throws for unknown tool name | Unregistered tool name raises a clear error | ✅ |
| `dispatch()` propagates handler errors | Error thrown by handler propagates to caller | ✅ |

### startup.test.js

| Test | Behaviour | Status |
|---|---|---|
| loads all real tool handlers without error | Real `forge-tools.json` + real context loads without throwing | ✅ |
| registers all 9 tools declared in forge-tools.json | All 9 production tools registered after load | ✅ |
| `forge_ls` with no path returns configured roots | Real `forge_ls` dispatch returns roots from `forge.config.json` | ✅ |

### file-root.test.js

| Test | Behaviour | Status |
|---|---|---|
| `registerRoot()` — no error | Root registers without throwing | ✅ |
| `registerRoot()` — with or without trailing slash | Both URL forms accepted | ✅ |
| `create()` creates an empty file | File exists and is empty after create | ✅ |
| `create()` throws if file already exists | Duplicate create raises an error | ✅ |
| `read()` returns file content | Content matches what was written to disk | ✅ |
| `read()` throws if file missing | Missing file raises an error | ✅ |
| `write()` replaces file content | File content updated to new value | ✅ |
| `write()` throws if file missing | Missing file raises an error | ✅ |
| `delete()` removes the file | File is absent after delete | ✅ |
| `delete()` throws if file missing | Missing file raises an error | ✅ |
| `list()` empty folder | Returns `{ folders: [], artifacts: [] }` | ✅ |
| `list()` files listed as artifacts | File entries appear in `artifacts` with correct names | ✅ |
| `list()` subdirectories listed as folders | Directory entries appear in `folders` | ✅ |
| `list()` throws if folder missing | Missing folder raises an error | ✅ |
| `mkdir()` creates a folder | Directory exists after mkdir | ✅ |
| `mkdir()` throws if folder already exists | Duplicate mkdir raises an error | ✅ |
| `rmdir()` removes an empty folder | Directory absent after rmdir | ✅ |
| `rmdir()` throws if folder missing | Missing folder raises an error | ✅ |
| `rmdir()` throws if folder not empty | Non-empty folder raises an error | ✅ |
| `rename()` renames a folder in place | New name exists, old name absent | ✅ |
| `rename()` throws if target name taken | Existing name at destination raises an error | ✅ |
| `rename()` throws for invalid name | Name containing `/` raises an error | ✅ |
| `move()` moves a folder to new path | Destination exists, source absent | ✅ |
| `move()` throws if destination exists | Existing destination raises an error | ✅ |

---

## Structure
[up](#table-of-contents)

```
tests/
├── README.md                      ← this file
├── content-handlers.test.js      ← forge_read/write/create/delete tool handlers
├── file-root.test.js              ← filesystem root handler
├── format-registry.test.js        ← format registry
├── mcp-server.test.js             ← generic MCP server (loadTools + dispatch)
├── md-extension-handler.test.js   ← Markdown syntax adapter
├── navigation-handlers.test.js    ← forge_ls/mkdir/rmdir/move/rename tool handlers
├── path-parser.test.js            ← MCP path → RootRegistry ref parser
├── root-registry.test.js          ← root registry (IRootRegistry + folder ops)
├── sequence.test.js               ← generic sequence handler
├── startup.test.js                ← startup smoke test — real config + real handlers, no mocks
└── fixtures/
    ├── forge-tools-bad-handler.json  ← invalid tools config — handler path unresolvable
    ├── forge-tools-test.json         ← valid tools config (3 tools via mock-tool-handler.js)
    ├── forge-tools-throwing.json     ← valid tools config — execute() throws
    ├── formats-basic.json            ← valid registry config (3 formats: doc, todo, managed)
    ├── formats-duplicate.json        ← invalid config — duplicate format name, triggers error
    ├── formats-no-claim.json         ← valid config — all handlers return claim=false
    ├── md-doc-full.md                ← full Markdown artifact (metadata + 3 sections)
    ├── md-doc-partial.md             ← partial Markdown artifact (metadata + 1 section)
    ├── md-native.md                  ← plain Markdown, no metadata block
    ├── mock-handler.js               ← configurable initFormat() — claimResult controlled by config
    ├── mock-tool-handler.js          ← configurable initTool() — result and throw controlled by config
    ├── shim-syntax-adapter.js        ← minimal SyntaxAdapter for sequence.js isolation tests
    └── sandbox/                      ← runtime directory for file-root tests (created/destroyed per run)
```

Source modules under test:

```
src/
├── format-registry.js    ← FormatRegistry class
├── mcp-server.js         ← McpServer class (loadTools + dispatch)
├── root-registry.js      ← RootRegistry class
├── sequence.js           ← initSequence() — generic sequence handler
└── logger.js             ← (not tested directly)

handlers/
├── file-root.js          ← filesystem root handler
└── md-extension-handler.js  ← MdSyntaxAdapter — Markdown syntax adapter

tool-handlers/            ← MCP tool handlers
├── forge-ls.js           ← implemented (2.3)
├── forge-mkdir.js        ← implemented (2.3)
├── forge-rmdir.js        ← implemented (2.3)
├── forge-move.js         ← implemented (2.3)
├── forge-rename.js       ← implemented (2.3)
├── forge-read.js         ← implemented (2.4)
├── forge-write.js        ← implemented (2.4)
├── forge-create.js       ← implemented (2.4)
└── forge-delete.js       ← implemented (2.4)

src/
├── path-parser.js        ← MCP path string → RootRegistry ref
...
```

---

## Coverage
[up](#table-of-contents)

| Source module | Test file | What is tested |
|---|---|---|
| `handlers/file-root.js` | `file-root.test.js` | `registerRoot()`, `create()`, `read()`, `write()`, `delete()`, `list()`, `mkdir()`, `rmdir()`, `rename()`, `move()` |
| `src/format-registry.js` | `format-registry.test.js` | `load()` (valid, duplicate, missing file), `dispatch()` (claim loop, unknown ext, no claim), `getByName()`, `describe()` |
| `handlers/md-extension-handler.js` | `md-extension-handler.test.js` | `parseMetadata()`, `serializeMetadata()`, `parseSections()`, `serializeSections()`, `buildSkeleton()` |
| `src/root-registry.js` | `root-registry.test.js` | `rootRefs()`, `read/write/create/delete()` delegation, unknown root errors, `list/mkdir/rmdir/rndir()`, `mvdir()` same-root and cross-root |
| `src/mcp-server.js` | `mcp-server.test.js` | `loadTools()` (valid, missing file, bad handler), `toolNames()`, `dispatch()` (routing, input pass-through, result, unknown tool, handler error) |
| startup (integration) | `startup.test.js` | `McpServer.loadTools()` with real `forge-tools.json` + real `RootRegistry` + `FormatRegistry` — full startup path without MCP transport |
| `src/path-parser.js` | `path-parser.test.js` | `parsePath()` (file, folder, root, hint, backslash, empty), `serializePath()` (file, folder, round-trips) |
| `tool-handlers/forge-{ls,mkdir,rmdir,move,rename}.js` | `navigation-handlers.test.js` | execute() delegation to rootRegistry, input validation, missing context stub |
| `tool-handlers/forge-{read,write,create,delete}.js` | `content-handlers.test.js` | claim loop dispatch, handler delegation, native fallback, input validation |
| `src/sequence.js` | `sequence.test.js` | `claim()`, `read()` (basic, lazy, dot-notation query), `write()` (narrow update, metadata preserved), `create()` (skeleton), `describe()` |

---

## Fixtures
[up](#table-of-contents)

**`formats-basic.json`** — valid registry config. Three formats: `doc` (`.md`, claim=false), `todo` (`.md`, claim=true), `managed` (`.js`, claim=true). Used by most format-registry and dispatch tests.

**`formats-duplicate.json`** — two formats with the same name on the same extension. `load()` must throw.

**`formats-no-claim.json`** — one format with `claimResult=false`. `dispatch()` must return null.

**`md-doc-full.md`** — Markdown file with forge metadata block + three `##` sections (Why / What / How). Used by md-extension-handler tests.

**`md-doc-partial.md`** — Markdown file with metadata block + one section (Why only). Tests partial-parse behavior.

**`md-native.md`** — Plain Markdown with no forge metadata block. `parseMetadata()` must return null.

**`forge-tools-test.json`** — valid tools config. Three tools (`forge_read`, `forge_write`, `forge_ls`) all pointing to `mock-tool-handler.js`. Used by most mcp-server tests.

**`forge-tools-bad-handler.json`** — one tool pointing to `./nonexistent-handler.js`. `loadTools()` must throw.

**`forge-tools-throwing.json`** — one tool with `shouldThrow: true`. `execute()` throws `'mock-tool-error'`. Tests error propagation in `dispatch()`.

**`mock-handler.js`** — Implements `initFormat(formatJson)`. `claim()` returns `formatJson.claimResult` (default: false). Used in format registry fixtures to control dispatch order without real syntax parsing.

**`mock-tool-handler.js`** — Implements `initTool(toolJson)`. `execute()` returns `toolJson.result` (default: `{ ok: 'mock' }`) or throws if `toolJson.shouldThrow` is true. Used in tools config fixtures.

**`shim-syntax-adapter.js`** — Minimal `SyntaxAdapter` using a fictional `@@forge` / `@@section` syntax. Isolates `sequence.js` from Markdown parsing. All sequence tests run against this adapter.

**`sandbox/`** — Temporary filesystem directory for `file-root.test.js`. Created in `beforeAll`, wiped in `afterAll`. Each test starts with a clean sandbox via `beforeEach`.

---

## Conventions
[up](#table-of-contents)

**Isolation by adapter** — `sequence.js` is syntax-agnostic. Tests use `ShimSyntaxAdapter` so failures point to sequence logic, not Markdown parsing. Markdown parsing is covered independently in `md-extension-handler.test.js`.

**mock-handler.js controls claim** — format registry tests need predictable dispatch order. `claimResult` in the fixture JSON is the single control point — no real parsing involved.

**Sandbox lifecycle** — `file-root.test.js` creates a per-test-run sandbox directory. `beforeAll` creates it, `afterAll` destroys it, `beforeEach` empties it. Tests are fully isolated and leave no artifacts on disk.

**Mock tool handler controls execute** — mcp-server tests need predictable dispatch results. `result` and `shouldThrow` in the fixture JSON are the single control points — no real tool logic involved.

**No SDK wiring at the test boundary** — `McpServer` (loadTools + dispatch) is tested in isolation. `startMcpServer()` wires the SDK transport and is not tested at unit level. The startup path up to `sdkServer.connect()` is covered by `startup.test.js` (real config, real handlers, no mocks).

**All values are strings** — sequence payloads and read results use string values throughout, consistent with the forge.md convention.

---

## Gaps
[up](#table-of-contents)

The following areas are not yet covered by the test suite.

| Gap | Notes |
|---|---|
| `forge-formats.json` v1 | The real registry config does not exist yet (W5). Tests use fixture configs only. |
| `initFormat()` via `sequence.js` + `MdSyntaxAdapter` | Integration path: real Markdown file → `FormatRegistry.dispatch()` → `initSequence()` + `MdSyntaxAdapter`. Not tested end-to-end. |
| `forge_ls` file path — section listing | Section listing deferred to M3 format layer. Returns stub note for now. |
| `forge_write` native fallback — payload validation | Native write accepts any `payload.content`; no schema enforcement. |
| `RootRegistry.load()` | `load()` imports handlers dynamically — covered indirectly by `startup.test.js` (real handler files on disk). Direct unit test still absent. |
| `forge_write` on non-existent section | Behavior when payload names a section absent from the file is not explicitly covered. |
| `sequence.js` — repeat section write | `write()` replaces repeat sections in full. Edge cases (empty array, mixed update) not tested. |
| `sequence.js` — lazy key extraction | `read()` lazy mode returns first line as key when no `key` field is set. Edge cases not tested. |
| `md-extension-handler.js` — `buildSkeleton()` capitalization | Section names are capitalized in headings (`## Why`). Tested structurally but not as a contract. |
| Error messages | Error text is asserted to throw but message content is not verified in most cases. |

---

## Changelog

### Version 1.7 - startup.test.js — MCP server startup smoke test
**Date:** 2026-06-12
**Reason:** No test reproduced the MCP server crash (forge.js exits immediately at startup). Added `startup.test.js` — 3 integration tests that load the real `forge-tools.json`, build a real `RootRegistry` + `FormatRegistry`, and call `McpServer.loadTools()` without mocks. Covers the full startup path up to the SDK transport. All 3 pass — confirms crash is in `StdioServerTransport` wiring, not in tool loading.

**Modifications:**
- Unit Tests: `startup.test.js` table added (3 tests, all ✅)
- Structure: `startup.test.js` added to file tree
- Coverage: startup integration row added
- Gaps: `RootRegistry.load()` entry updated — covered indirectly by startup.test.js
- Conventions: SDK wiring note updated

---

### Version 1.6 - 2.4 content handlers
**Date:** 2026-06-12
**Reason:** Content tool handlers implemented (forge_read/write/create/delete). `content-handlers.test.js` added (15 tests, all ✅).

**Modifications:**
- Unit Tests: `content-handlers.test.js` table added (15 tests)
- Structure: test file added, `tool-handlers/` all entries marked implemented
- Coverage: content handlers row added
- Gaps: stubs entry removed; `startMcpServer()` entry removed (covered); native fallback note added

---

### Version 1.5 - 2.3 navigation handlers + path-parser
**Date:** 2026-06-12
**Reason:** Navigation tool handlers implemented (forge_ls/mkdir/rmdir/move/rename). `path-parser.js` added as shared MCP path → ref converter. Two new test files (17 + 15 tests, all ✅).

**Modifications:**
- Unit Tests: `path-parser.test.js` table added (17 tests), `navigation-handlers.test.js` table added (15 tests)
- Structure: both test files + `src/path-parser.js` + `tool-handlers/` status updated
- Coverage: `path-parser.js` + navigation handlers rows added
- Gaps: tool handlers entry updated — only content handlers (2.4) remain as stubs; `forge_ls` file path note added

---

### Version 1.4 - mcp-server.test.js added
**Date:** 2026-06-12
**Reason:** `McpServer` (`src/mcp-server.js`) added in M2 — 9 unit tests covering `loadTools()` and `dispatch()`. Three new fixtures (`forge-tools-test.json`, `forge-tools-bad-handler.json`, `forge-tools-throwing.json`) + `mock-tool-handler.js`.

**Modifications:**
- Unit Tests: `mcp-server.test.js` table added (9 tests, all ✅)
- Structure: `mcp-server.test.js` + 3 fixtures + `mock-tool-handler.js` + `tool-handlers/` added
- Coverage: `src/mcp-server.js` row added
- Fixtures: 3 new fixture descriptions + `mock-tool-handler.js` added
- Conventions: `mock-handler` note replaced by two notes (mock-tool-handler + no SDK wiring)
- Gaps: `mcp-tools.js` entry replaced by tool handlers + `startMcpServer()` entries

---

### Version 1.3 - Unit Tests section
**Date:** 2026-06-11
**Reason:** Unit test coverage was documented only as a summary table in Coverage. Added a detailed per-test table for all five test files — each test listed with its behaviour and status (existing / gap). Gaps previously listed in Gaps are now also visible inline.

**Modifications:**
- TOC: `Unit Tests` added as section 2; subsequent sections renumbered
- `## Unit Tests`: new section — five tables (sequence, format-registry, md-extension-handler, root-registry, file-root)

---

### Version 1.2 - Strategy section
**Date:** 2026-06-11
**Reason:** Test strategy was implicit — no documented levels, isolation axes, or priority order.

**Modifications:**
- TOC: Strategy added as section 1; subsequent sections renumbered
- Strategy: new section — levels (unit/integration/e2e), isolation axes (adapter substitution, mock handler), external dependencies rule, priority for new tests

---

### Version 1.1 - FAL removed
**Date:** 2026-06-11
**Reason:** FAL is a concept from Forge v1 — not present in the current codebase.

**Modifications:**
- Gaps: FAL parsing entry removed
- Gaps: mcp-tools.js entry — "FAL parsing" removed from description

---

### Version 1.0 - Creation
**Date:** 2026-06-11
**Reason:** No test plan existed. Session objective: document the current test suite before extending it.

**Content:**
- Structure: arborescence tests/ + src/
- Coverage: mapping source module → test file → what is tested
- Fixtures: role of each fixture file
- Conventions: isolation patterns (ShimAdapter, mock-handler, sandbox)
- Gaps: untested areas identified
