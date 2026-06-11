# Forge — Convention

Convention for the Forge MCP server — structured, typed content access for all projects.

*Document type: Convention*
*Status: Draft*

## Quick Start

Forge is the single access layer for all file operations — navigation and content.

Nine tools: `forge_ls`, `forge_mkdir`, `forge_rmdir`, `forge_move`, `forge_rename` for navigation; `forge_read`, `forge_write`, `forge_create`, `forge_delete` for content.

## Keywords
forge, MCP, format, registry, metadata-block, read-wide-write-narrow, lazy, claim, native, sequence, syntax-adapter, rootRegistry

## Table of Contents

1. [Why Forge exists](#why-forge-exists)
2. [What — Principles and tools](#what--principles-and-tools)
3. [How — Architecture](#how--architecture)
4. [MCP Specs](#mcp-specs)
5. [Changelog](#changelog)

---

## Why Forge exists
[up](#table-of-contents)

Project methodologies, documentation conventions, and engineering best practices were invented to compensate for human cognitive limits — working memory loss, forgotten rules, attention errors. LLMs share exactly the same cognitive weaknesses, at massive scale and without any internal executive control layer.

Forge is that missing control layer. It does not reason. It enforces.

The division of responsibility is strict: the LLM is responsible for **content** — reasoning, deciding, drafting meaningful text. Forge is responsible for **form and structure** — validating conformance against a grammar, masking boilerplate, and handling mechanical operations that should never consume LLM attention: updating a TOC, inserting a changelog entry with the correct date, renumbering an index.

Standard file access covers navigation well — listing folders, finding files, reading metadata. What it cannot do is access **content** with any understanding of what that content represents.

Two fundamental limitations remain:

**1. No structure, high access cost** — a file is an opaque sequence of lines. Reading one section means loading the file. Writing one section means reasoning about line numbers or brittle regex. The real cost is not file size — it is the number of round trips required to extract what is needed.

Forge addresses this with a single principle: **read wide, write narrow**. One call loads all useful context. One call writes only what changed. "Wide" is not naive — boilerplate is stripped automatically, and large rarely-needed sections (changelogs, history) are deferred to on-demand access via a query parameter.

**2. No semantics** — filesystem does not know what it is manipulating. A file is a path and bytes. There is no difference between a changelog, a backlog item, and a configuration block. Without semantics, there is no validation, no expressed intent, and no way to enforce conventions.

Forge assigns a **format** to every artifact — not from its extension, but from what its content represents. With that format comes validation, structure enforcement, and mechanical operations that would otherwise consume LLM tokens for no reason.

**The end state:** Forge is the only file access path.

---

## What — Principles and tools
[up](#table-of-contents)

### Design principles

**Minimal friction** — Forge should be obvious to use for an LLM that has never seen it. This drives every design decision:
- Navigation follows familiar conventions — same concepts, zero learning
- Familiar file extensions — `.md`, `.js`, `.json` — the LLM already knows what they are
- Nine tools — five for navigation (`forge_ls`, `forge_mkdir`, `forge_rmdir`, `forge_move`, `forge_rename`), four for content (`forge_read`, `forge_write`, `forge_create`, `forge_delete`)
- JSON payload — universal format, naturally readable and writable by any LLM
- Natural language descriptions — a format describes itself in the `forge_read` response
- No imposed protocol — no mandatory call sequence before reading or writing

**Read wide, write narrow** — one call loads all useful context; one call writes only what changed. Three mechanisms reduce read cost without multiplying round trips:
- **Strip boilerplate** — TOC, Keywords, separators, Index — structural elements Forge knows; never transmitted
- **Lazy sections** — large rarely-needed sections (changelog, history) return headers only by default; full content on explicit query
- **Targeted query** — any section, lazy or not, is addressable by dot-notation path

**Format over extension** — a file's extension declares its syntax (`.md` is Markdown, `.js` is JavaScript). A file's format declares its structure (`todo`, `doc`, `managed`). The format is stored in a metadata block at the top of the file, invisible to the LLM.

**Container or leaf, never both** — a section that has children is a **container**; it holds no content of its own. A section that has content is a **leaf**; it accepts no children. A section cannot change category after creation.

**All values are strings** — no typed primitives in the JSON payload. `"effort": "M"`, `"done": "true"`. Forge interprets; the LLM works with natural text.

**Forbid or constrain, never ignore** — when a document violates its grammar, Forge applies one of two responses:
- **Forbid** (hard rule) — the write is rejected immediately. The required structure is absent. Example: a `doc` file missing its mandatory `## Why` section.
- **Constrain** (soft rule) — the write is accepted only if the LLM explicitly provides a deviation node documenting the justification. The constraint shifts from preventing the action to requiring an auditable trace of the decision.

Ignoring violations silently is never an option — it defeats the purpose of having a grammar.

### Formats

A **format** defines the structure of a file's content.

The file extension constrains what formats are valid for that file — a format must respect the syntax rules of its extension:
- `.md` — formats must remain human-readable Markdown
- `.js` — formats must remain loadable by Node without breaking. For code files, Forge does not parse the internal language syntax — it validates only a standardized comment envelope (`@mcp_metadata`) declaring the script's objective, maintainer, and dependencies.
- `.json` — formats must remain valid JSON
- Any other extension — treated as native format automatically

Every extension has a **native format** — full file read/write, no imposed structure. Native is the fallback: if no registered format handler claims the file, it is treated as native. Declared formats beyond native are registered in the **format registry** (see Architecture).

### Metadata block

Every non-native file carries a metadata block at the very top — the format's self-declaration. It is **never transmitted to the LLM** in any `forge_read` response.

The metadata block syntax depends on the extension — it must respect the file's syntax conventions:

```
.md   →  [//]: # (forge-start)
          format: todo
          version: 1.0
         [//]: # (forge-end)

.js   →  /* forge-start
          format: managed
          version: 1.0
          forge-end */

.json →  { "__forge__": { "format": "schema", "version": "1.0" }, ... }
```

The metadata block content is YAML (key: value pairs). It contains:
- `format` — mandatory; identifies the format of this file
- Any additional metadata the format needs — version, checksums, etc. — entirely managed by Forge; only `format` is read at dispatch

`forge_create(path, format)` writes the metadata block and the format skeleton.

### Format grammar

A format is declared in the format registry. Every format has a `type` — either `primitive` or `sequence`.

**Primitive formats** are terminals — they carry no structure, only a type annotation. The handler of the parent format is responsible for reading and writing primitive values. Each handler manages its own serialization — there is no shared primitive encoding.

```json
{ "text":    { "type": "primitive" } },
{ "integer": { "type": "primitive" } },
{ "date":    { "type": "primitive" } },
{ "boolean": { "type": "primitive" } }
```

All primitive values are serialized as strings in the JSON payload — `"effort": "M"`, `"done": "true"`. Forge interprets; the LLM works with natural text.

**Sequence formats** declare an ordered list of named sections. Each section references another format by name — recursion (direct or indirect) is allowed.

```json
{
  "type": "sequence",
  "extension": "<ext>",
  "handler": "<handler-path>",
  "description": "Human-readable description for the LLM.",
  "sections": [
    { "name": "<section-name>", "format": "<format-name>", ...annotations }
  ]
}
```

- `extension` — mandatory for sequence formats; identifies the file extension this format applies to (e.g. `"md"`, `"js"`). The registry uses this to group handlers by extension.
- `handler` — path to the handler module (relative to `forge-formats.json`). The module exports `initFormat(formatJson)` → run handler.

**Section annotations:**

| Annotation | Type | Default | Meaning |
|------------|------|---------|---------|
| `optional` | boolean | `false` | Section may be absent |
| `repeat` | boolean | `false` | Zero or more occurrences of this section |
| `key` | string | — | Field name used as identifier for each occurrence (repeat only) |
| `lazy` | boolean | `false` | Read returns key list only; full content on explicit query |
| `min` | integer | — | Minimum occurrences (repeat only) |
| `max` | integer | — | Maximum occurrences (repeat only) |
| `pattern` | string | — | Validation pattern for primitive values |

`lazy` + `key` on a repeat section: `forge_read` returns the list of key values only. Each occurrence is accessible via dot-notation: `forge_read(path, "changelog.2026-06-11")`.

**Example — `doc` format:**

```json
{
  "doc": {
    "type": "sequence",
    "extension": "md",
    "handler": "./handlers/md-sequence.js",
    "description": "A structured Markdown document — Why, What, How.",
    "sections": [
      { "name": "why",       "format": "text" },
      { "name": "what",      "format": "text" },
      { "name": "how",       "format": "text" },
      { "name": "changelog", "format": "changelog", "optional": true, "lazy": true }
    ]
  }
}
```

### forge_write payload

`forge_write` sends a partial JSON matching the structure returned by `forge_read`. What is not sent is not touched — there is no `write` annotation in the grammar because write is always narrow by construction.

Implicit update — send the new value directly:
```json
{ "why": "Updated content..." }
```

Explicit actions for structural operations — `_action` prefix distinguishes meta-instructions from content:
```json
{
  "entry": {
    "_action": "insert",
    "_position": 0,
    "_value": { "version": "2026-06-11", "reason": "...", "changes": "..." }
  },
  "old-section": { "_action": "delete" },
  "items": { "_action": "reorder", "_order": ["2026-06-11", "2026-06-10"] }
}
```

Actions: `update` (implicit), `insert`, `delete`, `reorder`.

`_position` for insert: 0 = first, omit = append.

`forge_create` is a write on an empty file — same structure, scope is the full skeleton. No payload required.

### Targeted query — dot notation

`forge_read(path, query)` addresses any section in the tree, lazy or not:

```
forge_read(path)                         → full response (lazy sections: key list only)
forge_read(path, "changelog")            → changelog key list (lazy)
forge_read(path, "changelog.2026-06-11") → one changelog entry (full content)
forge_read(path, "why")                  → one named section
```

The format declares what is lazy. The query mechanism is the same regardless.

---

## How — Architecture
[up](#table-of-contents)

### Build time and run time

In Forge, *build time* refers to initialization — the phase when configuration is loaded, registries are populated, and handlers are instantiated. This happens once, when the Forge module is first loaded.

*Run time* refers to execution — the phase when a tool call arrives and Forge dispatches it to the appropriate handler.

The distinction matters because some decisions are made once at build time (which formats exist, what patterns to use) and others are made per-request at run time (which artifact to open, which section to read or write).

### Registries

A registry combines two things:

- **Configuration** — static, declared at build time: structural descriptions and pattern factories
- **Handlers** — implementation, instantiated at build time, invoked at run time

Forge maintains two registries:

| Registry | Purpose | Used by |
|----------|---------|---------|
| Root registry | Knows where artifacts live | All tools — every storage access goes through it |
| Format registry | Knows how artifacts are structured | Content tools — `forge_read`, `forge_write`, `forge_create`, `forge_delete` |

The two registries are independent. A root defines a location; a format defines a shape. An artifact has a root (where it is) and a format (what it contains).

### Overview

```
LLM
  ↓ forge_ls / forge_mkdir / forge_rmdir / forge_move / forge_rename
  ↓ forge_read / forge_write / forge_create / forge_delete
Forge (MCP server)
  ├── navigation → rootRegistry (folder operations)
  └── content   → dispatch by claim → Format Registry → handler → rootRegistry
rootRegistry
  ↓
Filesystem
```

Forge never calls the filesystem directly. All storage access goes through `rootRegistry`. Navigation tools bypass the format registry entirely — they delegate straight to `rootRegistry`.

### Format registry

The format registry is populated at build time from `forge-formats.json`.

**Structure at run time:**
```
extension
  ├── <format-name> → runHandler   ← { claim, read, write, create, describe }
  └── <format-name> → runHandler
  (native is not stored — it is the registry fallback)
```

**Build time — loading `forge-formats.json`:**

For each format entry in `formats`:
1. Import the handler module at `entry.handler`
2. Call `handler.initFormat(formatJson)` → `runHandler`
3. Register `runHandler` under `entry.extension → entry.name`

**Build time constraint — name uniqueness per extension:**
Two formats under the same extension must have different names. A duplicate name is a build error — Forge refuses to start.

**`forge-formats.json` structure:**

```json
{
  "primitives": {
    "text":    { "type": "primitive" },
    "integer": { "type": "primitive" },
    "date":    { "type": "primitive" },
    "boolean": { "type": "primitive" }
  },
  "formats": {
    "doc": {
      "type": "sequence",
      "extension": "md",
      "handler": "./handlers/md-sequence.js",
      "description": "A structured Markdown document.",
      "sections": [ ... ]
    }
  }
}
```

### Handler interface

A handler module exports a build function `initFormat` that returns a run handler.

**Build function** — `initFormat(formatJson)` — called once per format at build time:
```js
export async function initFormat(formatJson)
  // → runHandler
```

**Run handler** — object returned by `initFormat`, used at run time:
```js
{
  async claim(rawContent)                  → boolean,
  async read(path, rootRegistry, query?)   → object,
  async write(path, rootRegistry, payload) → void,
  async create(path, rootRegistry)         → void,
  describe()                               → { description, example }
}
```

`claim(rawContent)` — reads the metadata block from the raw file content and returns `true` if this handler recognizes the file. The registry never reads the metadata block directly — claim is the sole recognition mechanism.

### Sequence handler

The sequence format grammar (sections, repeat, lazy, query, write narrow) is extension-independent. Rather than duplicating this logic in every extension-specific handler (`md-sequence.js`, `json-sequence.js`), a shared `sequence.js` module implements the generic traversal and delegates all syntax concerns to a **SyntaxAdapter**.

```
sequence.js          ← generic grammar logic (sections, repeat, lazy, query, write narrow)
    ↑ receives SyntaxAdapter at init
md-sequence.js       ← initFormat() creates a SyntaxAdapter for .md and passes it to sequence.js
json-sequence.js     ← initFormat() creates a SyntaxAdapter for .json and passes it to sequence.js
```

**SyntaxAdapter interface** — what each extension-specific handler provides:

```js
{
  // Metadata block
  parseMetadata(rawContent)              → { format, ...meta } | null,
  serializeMetadata(meta)                → string,   // returns the block as a string

  // Sections
  parseSections(rawContent, grammar)     → Section[],
  serializeSections(sections, rawContent) → string,

  // Skeleton generation for forge_create
  buildSkeleton(formatJson)              → string,
}
```

`parseMetadata` returns `null` if no metadata block is found (native signal).

`Section` is an internal structure used by `sequence.js` — not exposed to the LLM. It carries the section name, raw content, and child sections if any.

**Wiring — build time only.** `md-sequence.js` exports `initFormat(formatJson)` which:
1. Constructs an `MdSyntaxAdapter` instance at build time — handles `[//]: # (forge-start/end)` blocks and `##` heading separators
2. Calls `sequence.initSequence(formatJson, adapter)` → returns a run handler with a closure on the adapter

The adapter is instantiated once in `initFormat` and captured by the run handler's closure. It is never passed at run time — all run-time calls (`claim`, `read`, `write`, `create`) use the adapter transparently through the closure.

This pattern means `sequence.js` is never imported directly by the format registry — only extension-specific handlers are referenced in `forge-formats.json`.

### Native format

Native is the fallback format — it applies when no registered handler claims the file. It is hard-coded in the registry, not declared in `forge-formats.json`.

A native file has no metadata block. `forge_read` returns the full raw content as a single `content` field. `forge_write` replaces the full content. There is no structure, no sections, no query support.

```js
// forge_read on a native file
{ "format": "md", "content": "# Hello\n..." }
```

### rootRegistry interface

The only storage interface a handler ever calls. Filesystem details are entirely hidden.

```js
rootRegistry.read(path)            // → raw string content
rootRegistry.write(path, content)  // → void; error if file does not exist
rootRegistry.create(path)          // → void; error if already exists
rootRegistry.delete(path)          // → void
rootRegistry.exists(path)          // → boolean
```

Paths are standard filesystem paths — no special syntax. The rootRegistry resolves them against configured roots.

### Dispatch flow

**On `forge_read(path, query?)`:**
1. Read raw file via `rootRegistry.read(path)`
2. Determine file extension from path
3. Call `claim(rawContent)` on each registered handler for that extension, in declaration order
4. First handler returning `true` → handler retained
5. No handler claims the file → native fallback
6. Call `handler.read(path, rootRegistry, query)` (or native read)
7. Return JSON to LLM

**On `forge_write(path, payload)`:**
1. Read raw file → run claim loop (same as read) → retain handler
2. Call `handler.write(path, rootRegistry, payload)`

**On `forge_create(path, format)`:**
1. Look up format by name in registry → get handler
2. Call `handler.create(path, rootRegistry)`
3. Handler writes metadata block + skeleton

**On `forge_delete(path)`:**
1. `rootRegistry.delete(path)`
2. No handler involved — file deletion is format-agnostic

### Accessing the registry

The format registry is itself a Forge artifact — readable via `forge_read`:

```
forge_read("forge://registry")
→ {
    "format": "registry",
    "extensions": {
      "md": { "formats": { "doc": {...}, "todo": {...} } },
      "js": { "formats": { "managed": {...} } }
    }
  }
```

Each format entry includes `description` and `example` from `handler.describe()`. The LLM reads the registry to choose a format before calling `forge_create`.

---

## MCP Specs
[up](#table-of-contents)

### forge_read

**Description:** Read a file's content as structured JSON. Strips boilerplate. Large rarely-needed sections (changelog, history) return headers only by default — use the `query` parameter to load their content. Returns `format` field identifying the file's format; native files return `format: "<extension>"`.

**Input schema:**
```json
{
  "type": "object",
  "properties": {
    "path": {
      "type": "string",
      "description": "File path. Standard filesystem path or forge:// URI."
    },
    "query": {
      "type": "string",
      "description": "Optional. Dot-notation path to a specific section. Examples: 'changelog', 'changelog.20260112', 'sections.key-concepts'. If omitted, returns full content with lazy sections as headers only."
    }
  },
  "required": ["path"]
}
```

**Output schema:**
```json
{
  "type": "object",
  "properties": {
    "format": {
      "type": "string",
      "description": "Format of the file. Native files return the extension name."
    }
  },
  "additionalProperties": true,
  "description": "Structured JSON representation of the file content. Shape depends on the format — read forge://registry for format descriptions and examples."
}
```

---

### forge_write

**Description:** Write changes to an existing file. Send only what changed — the rest is untouched. Use `_action` to insert, delete, or reorder sections and records. Omitting `_action` on a value performs an implicit update.

**Input schema:**
```json
{
  "type": "object",
  "properties": {
    "path": {
      "type": "string",
      "description": "File path. The file must already exist — use forge_create first."
    },
    "payload": {
      "type": "object",
      "description": "Partial JSON matching the structure returned by forge_read. Only included fields are modified. Use '_action' key for structural operations: 'insert', 'delete', 'reorder'. Use '_position' (integer, 0=first) with insert. Use '_value' with insert to provide the new content. Use '_order' (array of ids) with reorder."
    }
  },
  "required": ["path", "payload"]
}
```

**Output schema:**
```json
{
  "type": "object",
  "properties": {
    "ok": { "type": "string", "description": "Confirmation message." }
  }
}
```

---

### forge_create

**Description:** Create a new file with the specified format. Writes the metadata block and an empty skeleton. After creation, use forge_write to populate content. To know available formats, read forge://registry.

**Input schema:**
```json
{
  "type": "object",
  "properties": {
    "path": {
      "type": "string",
      "description": "File path. Error if the file already exists."
    },
    "format": {
      "type": "string",
      "description": "Format name from the registry. Examples: 'todo', 'doc', 'managed'. Use the native format name (extension) for unstructured files."
    }
  },
  "required": ["path", "format"]
}
```

**Output schema:**
```json
{
  "type": "object",
  "properties": {
    "ok": { "type": "string", "description": "Confirmation message." },
    "path": { "type": "string", "description": "Path of the created file." }
  }
}
```

---

### forge_delete

**Description:** Delete a file. Irreversible. To delete folders, use `forge_rmdir`.

**Input schema:**
```json
{
  "type": "object",
  "properties": {
    "path": {
      "type": "string",
      "description": "File path. Error if the file does not exist."
    }
  },
  "required": ["path"]
}
```

**Output schema:**
```json
{
  "type": "object",
  "properties": {
    "ok": { "type": "string", "description": "Confirmation message." }
  }
}
```

---

### forge_ls

**Description:** List roots, folder contents, or a file's sections. No argument: list roots. Folder path: list subfolders and files. File path: list top-level sections as returned by the format handler.

**Input schema:**
```json
{
  "type": "object",
  "properties": {
    "path": {
      "type": "string",
      "description": "Optional. Omit to list roots. Folder path (ending with /) to list its contents. File path to list its sections."
    }
  },
  "required": []
}
```

**Output schema:**
```json
{
  "type": "object",
  "description": "No path: { roots: string[] }. Folder: { entries: [{ name, type: 'folder'|'file', path }] }. File: { sections: [{ name, lazy?: true }] }."
}
```

---

### forge_mkdir

**Description:** Create a folder. Error if it already exists.

**Input schema:**
```json
{
  "type": "object",
  "properties": {
    "path": { "type": "string", "description": "Folder path. Must end with /." }
  },
  "required": ["path"]
}
```

---

### forge_rmdir

**Description:** Delete a folder. Error if not empty.

**Input schema:**
```json
{
  "type": "object",
  "properties": {
    "path": { "type": "string", "description": "Folder path. Must end with /." }
  },
  "required": ["path"]
}
```

---

### forge_move

**Description:** Move a file or folder to a new path. Error if destination already exists. Moving across roots is not supported.

**Input schema:**
```json
{
  "type": "object",
  "properties": {
    "path":   { "type": "string", "description": "Source path — file or folder." },
    "target": { "type": "string", "description": "Destination path. Must be within the same root." }
  },
  "required": ["path", "target"]
}
```

---

### forge_rename

**Description:** Rename a file or folder in place.

**Input schema:**
```json
{
  "type": "object",
  "properties": {
    "path": { "type": "string", "description": "Path of the file or folder to rename." },
    "name": { "type": "string", "description": "New name (not a full path — name only)." }
  },
  "required": ["path", "name"]
}
```

---

## Changelog

### Version 0.8 - SyntaxAdapter build-time wiring clarified
**Date:** 2026-06-11
**Reason:** Spec did not explicitly state that the SyntaxAdapter is instantiated at build time and captured by closure — leaving ambiguity about whether it could be passed at run time.

**Changes:**
- How / Sequence handler: `Wiring — build time only` paragraph added — adapter instantiated once in initFormat, captured by run handler closure, never passed at run time

---

### Version 0.7 - Sequence handler + SyntaxAdapter
**Date:** 2026-06-11
**Reason:** Gap identified during TDD session — sequence grammar logic would be duplicated across every extension-specific handler. Resolved with shared sequence.js + SyntaxAdapter injection pattern.

**Changes:**
- Keywords: `sequence` and `syntax-adapter` added
- How / Handler interface: simplified — family handler removed, description tightened
- How / Sequence handler: new section — sequence.js generic module, SyntaxAdapter interface, md-sequence.js wiring pattern
- How / Native format: unchanged

---

### Version 0.6 - Claim-based dispatch + extension in formats + native fallback
**Date:** 2026-06-11
**Reason:** Gap identified during TDD session — spec described handler dispatch via direct metadata block read by the registry, but did not define how handlers recognize their files, how extension is declared per format, or what native means architecturally. Resolved with claim-based dispatch.

**Changes:**
- Keywords: `family` removed, `claim` and `native` added
- What / Formats: last sentence updated — native is the fallback when no handler claims the file
- What / Metadata block: content clarified as YAML key-value pairs
- What / Format grammar: `extension` and `handler` fields added to sequence format declaration; example updated to `doc` with explicit `extension` and `handler` path; primitive serialization note added
- How / Format registry: fully rewritten — build time from `forge-formats.json`, name uniqueness constraint; family references removed
- How / Handler interface: family handler removed; run handler updated — `claim` added
- How / Native format: new section
- How / Dispatch flow: rewritten — claim loop replaces direct metadata block read
- How / Accessing the registry: `families` → `extensions` in example response

---

### Version 0.5 - Format grammar
**Date:** 2026-06-11

---

### Version 0.4 - Philosophical postulate + forbid/constrain principle + code envelope
**Date:** 2026-06-11

---

### Version 0.3 - kind removed; leaf/container vocabulary
**Date:** 2026-06-11

---

### Version 0.2 - Navigation tools added; Forge as single access layer
**Date:** 2026-06-10

---

### Version 0.1 - Initial draft
**Date:** 2026-06-09
