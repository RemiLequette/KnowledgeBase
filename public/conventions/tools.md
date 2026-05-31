# Tools Convention

## Quick Start

Convention for script-based tools in the `tools/` folder of the knowledge base.
Load when creating a new tool, invoking an existing one, auditing tool conformance, or working on the shared library.
Does not cover project-specific business logic — only tool structure, interface, module design, and invocation patterns.

## Keywords
tools, scripts, node, commonjs, modules, lib, automation, cross-project, token-efficiency, interface, commands-mcp, output, tests, regression, convention

## Table des matieres

1. [Rationale](#rationale)
2. [Structure](#structure)
3. [Shared Library](#shared-library)
4. [Module Design Rules](#module-design-rules)
5. [Standard Interface](#standard-interface)
6. [Invocation](#invocation)
7. [Output](#output)
8. [Tests](#tests)
9. [Catalogue](#catalogue)
10. [Adding a Tool](#adding-a-tool)

---

## Rationale
[up](#table-des-matieres)

Tools are Node.js scripts that handle mechanical, deterministic tasks (formatting, extraction, indexing, diffing).
They exist to avoid consuming Claude context tokens on work that does not require reasoning.

**Use a tool when:**
- The task is mechanical (formatting, extraction, listing, indexing)
- The output is deterministic — no judgment required
- The task recurs across multiple projects

**Do not use a tool when:**
- The task requires interpretation or synthesis
- The task is one-off and simpler to do inline

---

## Structure
[up](#table-des-matieres)

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

---

## Shared Library
[up](#table-des-matieres)

`tools/lib/` contains reusable modules shared across tools.
Tools `require` them with a relative path: `const md = require('./lib/md-parser')`.

### Current modules

| Module | Responsibility |
|--------|---------------|
| `md-parser.js` | Parse a Markdown file into a structured doc object; access sections by name |
| `fs-scan.js` | Scan directory trees for `.md` files; read files safely; resolve paths |

### Why a shared library

- Tools stay thin — they orchestrate, they do not parse
- Convention changes (e.g. new required section) are fixed in one place
- Tools are readable without understanding Markdown parsing internals

---

## Module Design Rules
[up](#table-des-matieres)

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

---

## Standard Interface
[up](#table-des-matieres)

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

---

## Invocation
[up](#table-des-matieres)

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

---

## Output
[up](#table-des-matieres)

- All output goes to stdout, after the `OK` status line
- No output files unless the tool's explicit purpose is to write a file (e.g. `create`, `update`)
- No hardcoded paths inside scripts — paths always passed as arguments
- Output format: plain text lines for lists, JSON for structured data

---

## Tests
[up](#table-des-matieres)

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

### Regression tests

When a bug is fixed, add a test named after the bug:
```js
test('regression: setSection inserts before Index when Changelog is absent', () => { ... });
```

---

## Catalogue
[up](#table-des-matieres)

| Script | Description | Args |
|--------|-------------|------|
| `md-doc.js` | Read, create, and update Markdown documents conforming to documentation convention | See below |

**md-doc.js commands:**

| Command | Args | Effect |
|---------|------|--------|
| `read` | `<file> <json-input> <json-output>` | Read selected elements (array of keys) into json-output. `title` is a valid key. Missing sections return `null`. |
| `dump` | `<file> <json-output>` | Read all elements (title + all sections) into json-output. |
| `create` | `<file> <json-input>` | Create a new conformant document. Fails if file exists. json-input is `{ title, "Quick Start", ... }`. |
| `update` | `<file> <json-input>` | Update elements in place. Creates backup. Creates section if absent (inserted before `## Index`). |
| `check` | `<file>` | Verify conformance. stdout lines after OK are issues (empty = conformant). |
| `restore` | `<file>` | Restore file from `.bak` backup and delete the backup. |

---

## Adding a Tool
[up](#table-des-matieres)

1. Write the script in `tools/`, following the standard interface
2. Use `lib/md-parser.js` and `lib/fs-scan.js` — do not re-implement parsing or file scanning
3. Write a priori tests in `tools/tests/<script>.test.js`
4. Add a row to the Catalogue table above
5. Update `INDEX.md` if a new keyword category emerges

---

## Index

| Terme | Occurrences |
|-------|-------------|

---

## Changelog

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
