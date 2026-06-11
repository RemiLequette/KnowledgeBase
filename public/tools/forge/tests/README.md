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
2. [Structure](#structure)
3. [Coverage](#coverage)
4. [Fixtures](#fixtures)
5. [Conventions](#conventions)
6. [Gaps](#gaps)
7. [Changelog](#changelog)

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

## Structure
[up](#table-of-contents)

```
tests/
├── README.md                      ← this file
├── file-root.test.js              ← filesystem root handler
├── format-registry.test.js        ← format registry
├── md-extension-handler.test.js   ← Markdown syntax adapter
├── root-registry.test.js          ← root registry (IRootRegistry + folder ops)
├── sequence.test.js               ← generic sequence handler
└── fixtures/
    ├── formats-basic.json         ← valid registry config (3 formats: doc, todo, managed)
    ├── formats-duplicate.json     ← invalid config — duplicate format name, triggers error
    ├── formats-no-claim.json      ← valid config — all handlers return claim=false
    ├── md-doc-full.md             ← full Markdown artifact (metadata + 3 sections)
    ├── md-doc-partial.md          ← partial Markdown artifact (metadata + 1 section)
    ├── md-native.md               ← plain Markdown, no metadata block
    ├── mock-handler.js            ← configurable initFormat() — claimResult controlled by config
    ├── shim-syntax-adapter.js     ← minimal SyntaxAdapter for sequence.js isolation tests
    └── sandbox/                   ← runtime directory for file-root tests (created/destroyed per run)
```

Source modules under test:

```
src/
├── format-registry.js    ← FormatRegistry class
├── root-registry.js      ← RootRegistry class
├── sequence.js           ← initSequence() — generic sequence handler
└── logger.js             ← (not tested directly)

handlers/
├── file-root.js          ← filesystem root handler
└── md-extension-handler.js  ← MdSyntaxAdapter — Markdown syntax adapter
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

**`mock-handler.js`** — Implements `initFormat(formatJson)`. `claim()` returns `formatJson.claimResult` (default: false). Used in format registry fixtures to control dispatch order without real syntax parsing.

**`shim-syntax-adapter.js`** — Minimal `SyntaxAdapter` using a fictional `@@forge` / `@@section` syntax. Isolates `sequence.js` from Markdown parsing. All sequence tests run against this adapter.

**`sandbox/`** — Temporary filesystem directory for `file-root.test.js`. Created in `beforeAll`, wiped in `afterAll`. Each test starts with a clean sandbox via `beforeEach`.

---

## Conventions
[up](#table-of-contents)

**Isolation by adapter** — `sequence.js` is syntax-agnostic. Tests use `ShimSyntaxAdapter` so failures point to sequence logic, not Markdown parsing. Markdown parsing is covered independently in `md-extension-handler.test.js`.

**mock-handler.js controls claim** — format registry tests need predictable dispatch order. `claimResult` in the fixture JSON is the single control point — no real parsing involved.

**Sandbox lifecycle** — `file-root.test.js` creates a per-test-run sandbox directory. `beforeAll` creates it, `afterAll` destroys it, `beforeEach` empties it. Tests are fully isolated and leave no artifacts on disk.

**No mcp-tools at the test boundary** — tests import source modules directly. MCP tool wiring (`mcp-tools.js`) is not tested here; it is thin glue and is covered by integration-level testing (see Gaps).

**All values are strings** — sequence payloads and read results use string values throughout, consistent with the forge.md convention.

---

## Gaps
[up](#table-of-contents)

The following areas are not yet covered by the test suite.

| Gap | Notes |
|---|---|
| `forge-formats.json` v1 | The real registry config does not exist yet (W5). Tests use fixture configs only. |
| `initFormat()` via `sequence.js` + `MdSyntaxAdapter` | Integration path: real Markdown file → `FormatRegistry.dispatch()` → `initSequence()` + `MdSyntaxAdapter`. Not tested end-to-end. |
| `mcp-tools.js` | MCP tool layer not tested. Covers tool dispatch and error serialization. |
| `RootRegistry.load()` | `load()` imports handlers dynamically — not tested (requires real handler files on disk). |
| `forge_write` on non-existent section | Behavior when payload names a section absent from the file is not explicitly covered. |
| `sequence.js` — repeat section write | `write()` replaces repeat sections in full. Edge cases (empty array, mixed update) not tested. |
| `sequence.js` — lazy key extraction | `read()` lazy mode returns first line as key when no `key` field is set. Edge cases not tested. |
| `md-extension-handler.js` — `buildSkeleton()` capitalization | Section names are capitalized in headings (`## Why`). Tested structurally but not as a contract. |
| Error messages | Error text is asserted to throw but message content is not verified in most cases. |

---

## Changelog

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
