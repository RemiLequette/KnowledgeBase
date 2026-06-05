# Tools Convention

## Quick Start

Convention for script-based tools — applies both to shared KB tools (`tools/` in the knowledge base) and to project-specific tools (`tools/` in any project).
Load when creating a new tool anywhere, invoking an existing one, auditing tool conformance, or working on the shared library.
Does not cover project-specific business logic — only tool structure, interface, module design, invocation patterns, and the full development lifecycle (scope → spec → code → tests → doc → catalogue).

## Keywords
tools, scripts, node, commonjs, modules, lib, automation, cross-project, token-efficiency, interface, commands-mcp, output, tests, regression, convention

## Table of Contents

1. [Rationale](#rationale)
2. [Structure](#structure)
3. [Shared Library](#shared-library)
4. [Module Design Rules](#module-design-rules)
5. [Standard Interface](#standard-interface)
6. [Script Self-Documentation](#script-self-documentation)
7. [Invocation](#invocation)
8. [Output](#output)
9. [Tests](#tests)
10. [Catalogue](#catalogue)
11. [Adding a Tool](#adding-a-tool)
12. [Index](#index)

## Rationale
[up](#table-of-contents)

Tools — scripts, HTML pages, or any deterministic artifact — exist for two reasons:

- **Token efficiency** — mechanical tasks consume AI context without requiring reasoning
- **Reliability** — a deterministic process does not hallucinate, drift, or vary between runs

This principle applies to any tool form, not only Node.js scripts.

**Use a tool when:**
- The task is mechanical (formatting, extraction, filtering, listing, indexing)
- The output is deterministic — no judgment required
- The task recurs

**Use AI when:**
- The task requires interpretation, synthesis, or judgment
- Occasional imperfection is acceptable

**Do not use AI when:**
- The task is one-off and simpler to do inline
- Reliability and repeatability matter more than flexibility

## Structure
[up](#table-of-contents)

```
tools/
  lib/
    md-parser.js     # parse and access sections of a Markdown document
    fs-scan.js       # directory scan, file reading, path utilities
  md-doc.js          # read, create, and update Markdown documents
  tests/
    fixtures/        # reference files, never modified
    sandbox/         # working copies for tests that write, gitignored
    md-parser.test.js
    md-doc.test.js
```

**Rules:**
- Tools are flat in `tools/` — no subdirectories for tools themselves
- Shared code lives in `tools/lib/` — never inline shared logic in a tool script
- No `package.json`, no npm dependencies — Node stdlib + `lib/` only
- Tool name: `kebab-case.js`, action-first (`index-`, `extract-`, `show-`, `diff-`, `audit-`)
- Library module name: `kebab-case.js`, domain-first (`md-parser`, `fs-scan`)

## Shared Library
[up](#table-of-contents)

`tools/lib/` contains reusable modules shared across tools.
Tools `require` them with a relative path: `const md = require('./lib/md-parser')`.

### Current modules

| Module | Responsibility |
|--------|---------------|
| `md-parser.js` | Parse a Markdown file into a structured doc object; access sections by name |
| `md-renderer.js` | Render a parsed doc object to HTML — TOC, section anchors, back-to-top links. Depends on `marked` (npm). |
| `fs-scan.js` | Scan directory trees for `.md` files; read files safely; resolve paths |
| `server-core.js` | Pure filesystem logic for the local server — safePath, readFile, writeFile, deleteFile, listDir, parseAllowedRoots, parsePort |

### Why a shared library

- Tools stay thin — they orchestrate, they do not parse
- Convention changes (e.g. new required section) are fixed in one place
- Tools are readable without understanding Markdown parsing internals

## Module Design Rules
[up](#table-of-contents)

These apply to every file in `tools/lib/`.

### Single responsibility
One module = one domain. `md-parser.js` parses Markdown. `fs-scan.js` handles the filesystem.
Never mix concerns in one module.

### Stable interface, hidden implementation
Consumers depend on exported function signatures, not on internals.
Rename or refactor internals freely — never change a function signature without updating all callers.

### No side effects at require time
A `require('./lib/md-parser')` must do nothing — no file reads, no console output, no global state.
All work happens inside function calls.

### Pure functions where possible
Same input → same output. No hidden state, no mutation of arguments.
When a function must have side effects (file write), name it explicitly: `writeReport()`, not `process()`.

### Explicit errors
Throw with a descriptive message. Never return `null` or `undefined` silently on error.
```js
// Good
if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);

// Bad
if (!fs.existsSync(filePath)) return null;
```

### Explicit naming
Function names describe what they return or do.
```js
// Good
getKeywords(doc)      // returns string[]
isConformant(doc)     // returns bool
getSection(doc, name) // returns string | null

// Bad
get(d, 'kw')
check(doc)
```

### JSDoc on every export
One line minimum. Parameters and return type when non-obvious.
```js
/** Returns the Keywords section as an array of trimmed strings, or [] if absent. */
function getKeywords(doc) { ... }
```

### CommonJS modules
Use `require` / `module.exports`. No ESM (`import`/`export`) — tools run directly with `node`, no bundler.
```js
module.exports = { parseFile, getSection, getKeywords, isConformant, getIssues };
```

## Standard Interface
[up](#table-of-contents)

Every tool follows this contract:

```
node tools/<script>.js <required_args...>
```

**Arguments:**
- Positional only — no flags, no named options

**stdout:** Machine-readable data only — no progress lines, no status messages.
First line is always a status line:
- `OK` — success; subsequent lines are data (empty if none)
- `ERROR:<code>:<message>` — failure; no data follows

Error codes:
- `MISSING_ARG` — required argument missing
- `FILE_NOT_FOUND` — file path does not exist
- `FILE_ALREADY_EXISTS` — file already exists (e.g. on create)
- `SECTION_NOT_FOUND` — named section absent from document
- `PROTECTED_SECTION` — named section is mandatory and cannot be deleted
- `NOT_CONFORMANT` — target file fails conformance check
- `WRITE_ERROR` — file could not be written

**stderr:** Not used — stdout/stderr cannot be separated by the invoker.

**Exit codes:**
- `0` — always, including applicative errors (status is in stdout)
- `1` — reserved for unhandled crashes only

**Script header (required):**
```js
/**
 * <script-name>.js
 *
 * <One-line description of what it does.>
 *
 * Args: <arg1> <arg2>
 */
```

## Script Self-Documentation
[up](#table-of-contents)

### WHY — the auto-regenerable script

A script is never a source of truth — it duplicates logic that is already specified in conventions, guides, and specifications. This is intentional and valuable: **a well-documented script is auto-regenerable**.

If the header comments reference exactly the documents used to design the script, and capture the rare information not yet present in those documents, then anyone (or an AI assistant) can reconstruct the script from scratch by reading only those sources. The script becomes a live proof of its own specifications.

Corollary: **when a comment contains information absent from the referenced documents, it signals a documentation debt** — those documents should be updated. The script points to its own gaps.

### Required header block

Every script must open with a header block that includes:

```js
/**
 * <script-name>.js
 *
 * <One-line description of what it does — purely technical, no business logic.>
 *
 * References (documents used to design this script):
 *   - <path/to/convention-or-spec.md> [section if relevant]
 *   - ...
 *
 * Not yet in references (document debt — update the refs to absorb these):
 *   - <any rule or constraint captured here because it is absent from the docs above>
 *
 * Args: <arg1> <arg2>
 */
```

**Rules:**
- `References` lists every convention, guide, or specification consulted — not the full path if obvious, but enough to find it
- `Not yet in references` is the debt register — information that lives only here, not in any doc. Every entry is a candidate for a doc update. If empty, write `none`.
- The one-line description is **purely technical** — it says what the script does mechanically, never why the business needs it

### Separation of concerns — technical vs business

> **A script does not know about business logic.**

A script that copies, transforms, or injects data has no opinion about the meaning of that data. It does not know what a "completed meeting" means, whether a status is valid, or what the publication rules are. Those decisions belong to the operator.

Concretely: **no conditional logic based on data content** (checking a status value, validating a business state, applying a publication rule) belongs in a script. If such logic exists, it is a violation of this principle and should be removed.

This principle must appear explicitly in the script header under `Not yet in references` until it is absorbed into the relevant specification.

## Invocation
[up](#table-of-contents)

Tools are invoked via the `commands` MCP with `node` whitelisted at `safe` level.

```
commands:execute_command
  command: node
  args: ["tools/<script>.js", "<arg1>", "<arg2>"]
```

**Rules:**
- Always pass absolute paths for file/directory arguments
- Always parse stdout: first line is `OK` or `ERROR:<code>:<message>`
- On `OK`: consume remaining lines as data
- On `ERROR`: read the code to decide whether to correct and retry, or abort
- Never assume success without reading stdout

## Output
[up](#table-of-contents)

- All output goes to stdout, after the `OK` status line
- No output files unless the tool's explicit purpose is to write a file (e.g. `create`, `update`)
- No hardcoded paths inside scripts — paths always passed as arguments
- Output format: plain text lines for lists, JSON for structured data

## Tests
[up](#table-of-contents)

### Structure

```
tools/
  tests/
    fixtures/        # reference files, never modified by tests
    sandbox/         # working copies for tests that write, gitignored
    <subject>.test.js
    ...
```

**fixtures/** — static reference files checked into the repo. Tests that only read point here directly.

**sandbox/** — working copies. Before any test that writes, copy the fixture to sandbox. The sandbox is gitignored (except `.gitignore` and `README.md`). Bug files (files that triggered a bug) are stored in `fixtures/` with a descriptive name.

### Framework

Node stdlib only — `assert` native module. No npm dependencies.

### Test types

- **A priori** — written from the spec, before the code. Tests fail first, code makes them pass.
- **Regression** — added on each bug fix, before touching the code. The test proves the bug, then proves the fix.

### Mandatory workflow

**New tool:**
1. Write tests from the spec
2. Run — all must fail
3. Write the code
4. Run — all must pass

**Bug fix:**
1. Drop the problematic file in `fixtures/` with a descriptive name
2. Write a regression test that fails
3. Fix the code
4. Run — regression test must pass, no other test must break

**Tool modification:**
1. Update or add tests to reflect the new spec
2. Run — changed tests must fail
3. Modify the code
4. Run — all must pass

**Principle: a test that has never failed proves nothing.**

### Test file interface

Same stdout protocol as tools:
- `PASS: <test name>` — test passed
- `FAIL: <test name> -- <reason>` — test failed
- Exit code `0` if all tests pass, `1` if at least one fails

```js
// Standard test runner pattern
const assert = require('assert');
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

// ... tests ...

process.exit(failed > 0 ? 1 : 0);
```

### Naming

- Test file: `<subject>.test.js` — one file per lib module or tool
- Test name: describes the behaviour, not the implementation
  - Good: `getSection returns null when section is absent`
  - Bad: `test getSection null`

### Convention reference

Each test must carry a `@convention` comment on the line immediately before the `test(` call.

When the test enforces a rule from a convention file:
```js
// @convention conventions/documentation.md [section Quick Start Rule]
test('toMarkdown: throws when document has no title', () => {
```

When no convention applies (edge case, purely technical behaviour):
```js
// @convention none — edge case, no specific convention applies
test('parseText: empty string produces null title and no sections', () => {
```

The comment is machine-extractable — it enables auditing which tests cover which conventions.

### Regression tests

When a bug is fixed, add a test named after the bug:
```js
test('regression: setSection inserts before Index when Changelog is absent', () => { ... });
```

## Catalogue
[up](#table-of-contents)

| Script | Description | Args |
|--------|-------------|------|
| `md-doc.js` | Read, create, and update Markdown documents conforming to documentation convention | See below |
| `md-to-html.js` | Convert a Markdown document to a standalone HTML file with neutral CSS and generated TOC | `<source.md> <output.html>` |
| `local-server.js` | Shared local HTTP server — serves static files and exposes `/file`, `/dir`, `/ping` API for all projects | `<root1> [<root2> ...] [--port <port>]` |

**md-doc.js commands:**

| Command | Args | Effect |
|---------|------|--------|
| `create` | `<file> <json-input>` | Create a new conformant document. Fails if file exists. json-input is `{ title, "Quick Start", ... }`. |
| `update` | `<file> <json-input>` | Update elements in place. Creates backup. Creates section if absent (inserted before `## Index` by default). Supports `__positions` key for insert position control — see below. |
| `check` | `<file>` | Verify conformance. stdout lines after OK are issues (empty = conformant). |
| `restore` | `<file>` | Restore file from `.bak` backup and delete the backup. |
| `delete` | `<file> <section-name>` | Remove a named section from the document. Creates backup. Returns `ERROR:SECTION_NOT_FOUND` if absent. Returns `ERROR:PROTECTED_SECTION` if the section is mandatory (`Quick Start`, `Keywords`, `Index`, `Changelog`). |

**`update` — `__positions` key**

When inserting a new section (absent from the document), the optional `__positions` key controls where it is inserted.

```json
{
  "New Section": "content",
  "__positions": {
    "New Section": "after:Language"
  }
}
```

Valid position values:

| Value | Effect |
|-------|--------|
| `"beginning"` | Before all existing sections |
| `"before:<section>"` | Immediately before the named section |
| `"after:<section>"` | Immediately after the named section |

Rules:
- `__positions` is optional — omitting it preserves current behaviour (insert before `## Index`)
- Position is ignored when the section already exists (update in place, no move)
- If the reference section (`before:X` / `after:X`) is absent from the document → `ERROR:SECTION_NOT_FOUND`

## Adding a Tool
[up](#table-of-contents)

### Step 1 — Decide the scope

Is this tool useful beyond the current project? → **KB tool** — place in `knowledgebase/tools/`.
Is this tool specific to one project? → **Project tool** — place in `<project>/tools/`.
When in doubt, start as a project tool. Promote to KB only when a second project needs it.

Both types follow the same rules below.

### Step 2 — Write the spec first

Before writing any code, document the tool:
- **Why** it exists — what problem it solves, what triggers its use
- **What** it does — inputs, outputs, behavior, edge cases
- **How** it works — data flow, error handling, dependencies

For a **KB tool**: add a spec section in this document or a dedicated `.md` in `tools/`.
For a **project tool**: add a spec section in the project's `Methode.md` or a dedicated `tools/<name>.md`.

Follow `conventions/documentation.md` and `conventions/documentation-style.md` (type: *process spec*) when writing a doc file.
After writing or updating any `.md`, run `node tools/md-doc.js update <file>` to regenerate TOC and Index — never write them by hand.

### Step 3 — Write the script

Follow `## Standard Interface` and `## Script Self-Documentation` above.
Use `lib/md-parser.js` and `lib/fs-scan.js` — do not re-implement parsing or file scanning.
The script header must reference the spec written in Step 2.

### Step 4 — Write tests first

Write a priori tests in `tools/tests/<script>.test.js` before running the code.
See `## Tests` for the mandatory TDD workflow.

### Step 5 — Update the catalogue

For a **KB tool**: add a row to `## Catalogue` in this document, then run `node tools/md-doc.js update <this file>`.
For a **project tool**: add an entry in the project's own tool spec or `Methode.md`, then run `node tools/md-doc.js update <that file>`.

### Step 6 — Update INDEX.md if needed

If a new keyword category emerges, update `knowledgebase/public/INDEX.md`.

## Index

| Terme | Occurrences |
|-------|-------------|

## Changelog

### Version 2.3 - Adding a Tool lifecycle + KB vs project scope
**Date:** 2026-06-05
**Reason:** Three gaps addressed: (1) `Adding a Tool` was a flat 5-step list with no spec phase, no doc phase, and no reference to documentation conventions; (2) the convention implied KB-only scope; (3) `md-doc update` was never mentioned for doc files.

**Changes:**
- `## Quick Start`: rewritten — scope extended to project tools; lifecycle (scope → spec → code → tests → doc → catalogue) made explicit
- `## Adding a Tool`: rewritten as 6 structured steps — Step 1 (KB vs project decision), Step 2 (spec first, with WWH, doc conventions, and `md-doc update` rule), Step 3 (script), Step 4 (tests), Step 5 (catalogue update with `md-doc update`), Step 6 (INDEX.md)


### Version 2.2 - Script Self-Documentation
**Date:** 2026-06-05
**Reason:** Two principles formalized as a new section.

1. **Auto-regenerable script** — a script whose header references all documents used to design it, plus a debt register for information not yet in those documents, can be reconstructed from sources alone. The debt register is a signal to update the referenced docs.
2. **Technical/business separation** — a script is a mechanical operator (copy, inject, transform). It contains no conditional logic based on data content or business state. Those decisions belong to the operator.

**Changes:**
- TOC: new entry `Script Self-Documentation` at position 6 (Invocation and following shifted)
- New section `## Script Self-Documentation` added before `## Invocation`: WHY, required header block format, rules, separation of concerns principle


### Version 2.1 - Rationale generalized
**Date:** 2026-06-04
**Reason:** The tool-vs-AI principle applies to any deterministic artifact (scripts, HTML pages, etc.), not only Node.js scripts. Reliability added as a second explicit argument alongside token efficiency.

**Changes:**
- `## Rationale`: rewritten — scope generalized beyond Node.js scripts; reliability argument added; Use/Do-not-use rules restructured into three blocks (Use a tool / Use AI / Do not use AI)


### Version 2.0 - local-server.js added
**Date:** 2026-06-04
**Reason:** New shared local development server — generic HTTP server for all projects. Includes `lib/server-core.js` (pure logic) and `local-server.js` (HTTP wrapper).

**Changes:**
- `## Shared Library`: `server-core.js` added to module table
- `## Catalogue`: `local-server.js` added with args


### Version 1.9 - md-renderer.js in Shared Library + md-to-html.js in Catalogue
**Date:** 2026-06-04
**Reason:** `md-renderer.js` existed in `lib/` but was not documented. New tool `md-to-html.js` added — converts a Markdown document to a standalone print-ready HTML file.

**Changes:**
- `## Shared Library`: `md-renderer.js` added to module table
- `## Catalogue`: `md-to-html.js` added


### Version 1.8 - read and dump removed from Catalogue
**Date:** 2026-05-31
**Reason:** read and dump commands removed — documentation files are read directly via filesystem MCP in full. md-doc is a write tool only.

**Changes:**
- Catalogue: `read` and `dump` rows removed


### Version 1.7 - update position control documented
**Date:** 2026-05-31
**Reason:** New `__positions` key added to `update` command for insert position control.

**Changes:**
- Catalogue: `update` description updated to mention `__positions`
- Catalogue: `__positions` block added with format, valid values, and rules


### Version 1.6 - delete command added to Catalogue
**Date:** 2026-05-31
**Reason:** New `delete` command added to md-doc.js — removes a named section from a document.

**Changes:**
- Catalogue: `delete` command added with args and error codes


### Version 1.5 - Convention reference comment
**Date:** 2026-05-31
**Reason:** Added `### Convention reference` subsection in `## Tests` — each test must carry a `@convention` comment referencing the convention it enforces, or `@convention none` for purely technical tests.

**Changes:**
- `### Convention reference` added under `## Tests`

### Version 1.4 - Clarifications post-review
**Date:** 2026-05-30
**Raison:** Corrections identifiées après relecture en vue d'une future session sans mémoire de la session courante.

**Modifications:**
- Structure: mise à jour avec les fichiers réels (md-doc.js, tests/, fixtures/, sandbox/)
- Tests: fixtures/ et sandbox/ documentés avec leurs rôles respectifs
- Catalogue: md-doc.js détaillé avec tableau de commandes lisible
- Changelog ajouté dans md-parser.js (v1.0 et v1.1)
- Bug fix md-doc.js: setElement ne lève plus d'erreur si title est vide — laisse le titre existant inchangé

### Version 1.3 - Tests
**Date:** 2026-05-30
**Raison:** Add testing convention — structure, framework, mandatory TDD workflow, fixtures/sandbox separation, regression pattern.

**Modifications:**
- New section: Tests (structure, framework, types, mandatory workflow, naming, regression)
- Test types redefined: a priori written before code, regression written before fix
- Mandatory workflow for new tools, bug fixes, and modifications
- Principle: a test that has never failed proves nothing
- TOC updated
- Adding a Tool: step 3 now requires writing tests before code
- Keywords updated

### Version 1.2 - Machine-readable interface
**Date:** 2026-05-30
**Raison:** Tools are invoked by Claude only — no human reads the terminal. Redesigned stdout protocol, error handling, and output rules accordingly.

**Modifications:**
- Standard Interface: stdout is machine-readable; first line always `OK` or `ERROR:<code>:<message>`; exit code 0 always
- Invocation: rules rewritten for Claude as invoker
- Output: removed HTML, removed output_path argument, stdout-only
- Script header: removed Usage line

### Version 1.1 - Shared library and module design rules
**Date:** 2026-05-30
**Raison:** Introduction of `tools/lib/` shared library. Tools must not re-implement parsing or file scanning. Added module design rules (CommonJS, single responsibility, pure functions, explicit errors, JSDoc).

**Modifications:**
- New section: Shared Library (modules, rationale)
- New section: Module Design Rules (8 rules with examples)
- Structure: updated to show `lib/` subfolder
- TOC updated
- Keywords updated
- Adding a Tool: step 2 now requires using lib modules

### Version 1.0 - Creation
**Date:** 2026-05-30
**Raison:** Establish the tools convention — structure, interface, invocation, and catalogue for Node.js script-based tools.

**Contenu initial:**
- Rationale: when to use a tool vs inline
- Structure: flat folder, naming rules, no dependencies
- Standard interface: positional args, stdout/stderr/exit codes, header format
- Invocation: commands MCP, node whitelisted
- Output: caller-defined path, HTML or JSON
- Catalogue: kb-index-keywords.js
- Adding a tool: 3-step process
