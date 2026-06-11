# Forge — Convention

Convention for the Forge MCP server — structured, typed content access for all projects.

*Document type: Convention*
*Status: Draft*

## Quick Start

Forge is the single access layer for all file operations — navigation and content.

Nine tools: `forge_ls`, `forge_mkdir`, `forge_rmdir`, `forge_move`, `forge_rename` for navigation; `forge_read`, `forge_write`, `forge_create`, `forge_delete` for content.

## Keywords
forge, MCP, format, registry, metadata-block, read-wide-write-narrow, lazy, family, rootRegistry

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

Every extension has a **native format** — full file read/write, no imposed structure. If no metadata block is found, the file is treated as native. Declared formats beyond native are registered in the **format registry** (see Architecture).

### Metadata block

Every non-native file carries a metadata block at the very top — the format's self-declaration. It is **never transmitted to the LLM** in any `forge_read` response.

The metadata block syntax depends on the extension — it must respect the file's syntax conventions:

```
.md   →  [//]: # (forge-start)
          format: todo
          ... format metadata ...
         [//]: # (forge-end)

.js   →  /* forge-start
          format: managed
          ... format metadata ...
          forge-end */

.json →  first key: { "__forge__": { "format": "schema", ... } }
```

The metadata block contains:
- `format` — mandatory; identifies the format of this file
- Any additional metadata the format needs — version, checksums, etc. — entirely managed by Forge; only `format` is read at dispatch

`forge_create(path, format)` writes the metadata block with the format declaration and any format-specific metadata.

### Format grammar

A format is declared in the format registry. Every format has a `type` — either `primitive` or `sequence`.

**Primitive formats** are terminals — they carry no structure, only a type annotation. The handler of the parent format is responsible for reading and writing primitive values.

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
  "handler": "<handler-name>",
  "description": "Human-readable description for the LLM.",
  "ordered": true,
  "sections": [
    { "name": "<section-name>", "format": "<format-name>", ...annotations }
  ]
}
```

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

**Example — `changelog` format:**

```json
{
  "changelog-entry": {
    "type": "sequence",
    "handler": "md-sequence",
    "description": "A single changelog entry.",
    "sections": [
      { "name": "version", "format": "date",    "pattern": "YYYY-MM-DD" },
      { "name": "reason",  "format": "text" },
      { "name": "changes", "format": "text" }
    ]
  },

  "changelog": {
    "type": "sequence",
    "handler": "md-changelog",
    "description": "Ordered list of changelog entries, newest first.",
    "ordered": true,
    "sections": [
      { "name": "entry", "format": "changelog-entry", "repeat": true, "key": "version", "lazy": true, "min": 1 }
    ]
  },

  "doc": {
    "type": "sequence",
    "handler": "md-doc",
    "description": "A structured document — Why, What, How.",
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
forge_read(path)                       → full response (lazy sections: key list only)
forge_read(path, "changelog")          → changelog key list (lazy)
forge_read(path, "changelog.2026-06-11") → one changelog entry (full content)
forge_read(path, "why")               → one named section
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
  └── content   → dispatch by format → Format Registry → handler → rootRegistry
rootRegistry
  ↓
Filesystem
```

Forge never calls the filesystem directly. All storage access goes through `rootRegistry`. Navigation tools bypass the format registry entirely — they delegate straight to `rootRegistry`.

### Format registry

The format registry is populated at build time and contains only formats at run time — families are a build-time concept that disappears after initialization.

**Structure at run time:**
```
extension
  ├── native            ← always present; no handler
  └── <format-name>
        └── runHandler  ← { read, write, create, describe }
```

**Config file** declares both families and direct formats. At build time, Forge reads the config and initializes all formats through two paths:

```
Config
  ├── family entry  → familyHandler.initFamily(familyJson)
  │                     → [ (formatName, buildHandler, formatJson?), ... ]
  │                           ↓ for each triplet
  │                     buildHandler.initFormat(formatJson)
  │                           ↓
  │                     runHandler   registered under formatName
  │
  └── format entry  → buildHandler.initFormat(formatJson)
                            ↓
                      runHandler   registered under formatName
```

After initialization, the registry maps `extension → { formatName → runHandler }`. Family entries leave no trace.

### Handler interface

A handler is a module. One module may implement any combination of three roles — family handler, build handler, and run handler — by exporting the corresponding methods.

**Family handler** — `initFamily(familyJson)` — called once per family declaration in the config:
```js
// Returns an array of triplets — one per format the family produces
export async function initFamily(familyJson)
  // → [ { format, handler, config? }, ... ]
  // handler = build handler for that format
  // config  = optional format-level JSON passed to initFormat
```

**Build handler** — `initFormat(formatJson)` — called once per format, whether from a family triplet or a direct config entry:
```js
// Returns the run handler for this format
export async function initFormat(formatJson)
  // → runHandler
```

**Run handler** — object returned by `initFormat`, used at run time for every tool call on this format:
```js
{
  async read(path, rootRegistry, query?)   → object,
  async write(path, rootRegistry, payload) → void,
  async create(path, rootRegistry)         → void,
  describe()                               → { description, example }
}
```

One module may export all three: `initFamily`, `initFormat`, and the run handler methods. The roles are interfaces, not separate modules.

### rootRegistry interface

The only storage interface a handler ever calls. Filesystem details are entirely hidden.

```js
rootRegistry.read(path)            // → raw string content
rootRegistry.write(path, content)  // → void; error if file does not exist
rootRegistry.create(path)          // → void; error if already exists
rootRegistry.delete(path)          // → void
rootRegistry.exists(path)          // → boolean
```

Paths are standard filesystem paths — no FAL, no special syntax. The rootRegistry resolves them against configured roots.

### Dispatch flow

On `forge_read(path, query?)`:
1. Read raw file via `rootRegistry.read(path)`
2. Extract metadata block using family pattern (regexp)
3. Read `format` field from metadata block → dispatch to handler
4. If no metadata block → native format → Forge handles directly (full content)
5. Call `handler.read(path, rootRegistry, query)`
6. Return JSON to LLM

On `forge_write(path, payload)`:
1. Read raw file → extract metadata block → dispatch to handler (same as read)
2. Call `handler.write(path, rootRegistry, payload)`

On `forge_create(path, format)`:
1. Look up format in registry → get handler
2. Call `handler.create(path, rootRegistry)`
3. Handler writes metadata block + skeleton

On `forge_delete(path)`:
1. `rootRegistry.delete(path)`
2. No handler involved — file deletion is format-agnostic

### Accessing the registry

The format registry is itself a Forge artifact — readable via `forge_read`:

```
forge_read("forge://registry")
→ {
    "format": "registry",
    "families": {
      "md":  { "formats": { "native": {...}, "todo": {...}, "doc": {...} } },
      "js":  { "formats": { "native": {...}, "managed": {...} } }
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

### Version 0.5 - Format grammar
**Date:** 2026-06-11
**Reason:** Format grammar designed and documented — primitive vs sequence, section annotations (optional, repeat, key, lazy, min, max, pattern), handler reference per format, forge_create as write on empty file.

**Changes:**
- What / Sections: replaced by `### Format grammar` — full grammar with property table and changelog example
- What / forge_write payload: rewritten — write is narrow by construction (no grammar annotation needed); forge_create described as write on empty file
- What / Targeted query: updated examples to match new grammar

---

### Version 0.4 - Philosophical postulate + forbid/constrain principle + code envelope
**Date:** 2026-06-11
**Reason:** Cadrage note from design session — three additions: (1) LLM/human cognitive parallel and division of responsibility as foundational Why; (2) Forbid vs Constrain governance principle in What; (3) clarification that `.js` formats validate a comment envelope, not internal syntax.

**Changes:**
- Why: opening paragraphs added — postulate (LLMs share human cognitive limits, Forge = missing control layer) and division of responsibility (LLM = content, Forge = form)
- Why: last sentence of point 2 simplified (mechanical operations list removed — covered by opening)
- What / Design principles: `Forbid or constrain, never ignore` added
- What / Formats: `.js` entry expanded — code envelope (`@mcp_metadata`) clarification

---

### Version 0.3 - kind removed; leaf/container vocabulary
**Date:** 2026-06-11
**Reason:** `kind` concept removed — superseded by the uniform format model. A leaf section's content type is simply its format (named reference or inline). `content section` renamed to `leaf` for consistency with container/leaf tree vocabulary.

**Changes:**
- What / Design principles: `Container or content` → `Container or leaf`
- What / Sections: rewritten — kind/catalogue replaced by format reference (named or inline); `content` → `leaf` throughout; examples relabelled

---

### Version 0.2 - Navigation tools added; Forge as single access layer
**Date:** 2026-06-10
**Reason:** Navigation absorbed into Forge — single access layer. Nine tools total.

**Changes:**
- Quick Start: rewritten — Forge is single access layer, nine tools listed
- Why Forge exists: "The end state" corrected — filesystem MCP disabled
- Minimal friction: tool list updated to nine
- How / Overview: diagram updated — navigation path bypasses format registry
- forge_delete: "use filesystem" replaced by "use forge_rmdir"
- MCP Specs: forge_ls, forge_mkdir, forge_rmdir, forge_move, forge_rename added

---

### Version 0.1 - Initial draft
**Date:** 2026-06-09
**Reason:** Redesign from first principles.

**Content:**
- Why: two fundamental limitations restated — access cost and no semantics; read wide write narrow principle
- What: minimal friction design, format/family model, metadata block, JSON payload structure, dot-notation query, forge_write actions
- How: format registry two-level structure, handler interface (initFormat/initFamily), rootRegistry, dispatch flow, registry as Forge artifact
- MCP Specs: forge_read, forge_write, forge_create, forge_delete
