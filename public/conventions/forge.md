# Forge — Convention

Convention for the Forge MCP server — structured, typed content access for all projects.

*Document type: Convention*
*Status: Draft*

## Quick Start

Forge is the single access layer for all file operations — navigation and content.

Nine tools: `forge_ls`, `forge_mkdir`, `forge_rmdir`, `forge_move`, `forge_rename` for navigation; `forge_read`, `forge_write`, `forge_create`, `forge_delete` for content.

## Keywords
forge, MCP, format, registry, metadata-block, read-wide-write-narrow, lazy, claim, native, sequence, syntax-adapter, rootRegistry, primitive, extends, fileNameExtension

## Table of Contents

1. [Why Forge exists](#why-forge-exists)
2. [What — Principles and tools](#what--principles-and-tools)
3. [How — Architecture](#how--architecture)
4. [MCP Specs](#mcp-specs)
5. [Changelog](#changelog)

> Subsections in What: Key Concepts · Format discovery · Formats · Format inheritance · Metadata block · Format grammar · forge_write payload · **Validation rules** · Targeted query

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

### Key Concepts

Consider `Journal.md`. To the filesystem, it is a sequence of lines. To Forge, it is an artifact — a file whose structure is known and whose content is addressable by name.

What Forge knows about `Journal.md` comes from its **format** — `journal`. A format is a structural declaration: which **sections** exist, which are mandatory, which repeat. A section is a logical unit in the document. It is either a **container** — organizing child sections, carrying no content of its own — or a **leaf** — carrying text, with no children. The `journal` format declares two sections: `header` (a leaf) and `changelog` (a container repeating `log-item` entries). That declaration lives in the **format registry**, the catalogue of all formats Forge knows.

To read and write concretely, each format relies on a **handler** — the code that parses the file, extracts its sections, and applies modifications. The generic handler `sequence.js` covers all structured formats. Grammar logic — sections, repeat, lazy — is separated from file syntax by a **SyntaxAdapter**. It is the `.md` adapter that knows a section starts with `## `, not `sequence.js`. One handler, multiple syntaxes.

One question remains: how does Forge identify that `Journal.md` is a `journal`? Through the **metadata block** — a few comment lines at the top of the file declaring the format. When Forge opens the file, it submits the raw content to each registered handler via its **claim** mechanism — the first handler that recognises the metadata block takes ownership. If none does, Forge applies the **native** format: raw read and write, no imposed structure.

Once the handler is determined, Forge does not transmit the file — it translates. The LLM receives a structured JSON representation, stripped of mechanical noise: no TOC, no separators, no index. What the handler recomputes automatically is never sent to the LLM. For a journal, this goes further: the changelog is **lazy** by default — Forge returns the dates and titles of entries, not their content. The LLM identifies the entry it needs and loads it alone via a **dot-notation query**: `changelog.2026-06-11`. It works on one topic at a time, without traversing the full history.

```json
// forge_read("Journal.md")
{
  "format": "journal",
  "description": "A journal file — dated entries recording decisions and progress.",
  "header": {
    "description": "Introductory text for the journal.",
    "content": "Knowledge Base — session log."
  },
  "changelog": {
    "description": "Dated entries. Load a specific entry with query 'changelog.<date>'.",
    "update": "Insert a new entry with _action: insert, _position: 0.",
    "entries": [
      { "date": "2026-06-11", "title": "Format grammar redesign" },
      { "date": "2026-06-10", "title": "Navigation tools added" },
      { "date": "2026-06-07", "title": "Sequence handler + SyntaxAdapter" }
    ]
  }
}
```

The LLM reads the entry list, identifies "Format grammar redesign" as the relevant entry, and loads it:

```json
// forge_read("Journal.md", "changelog.2026-06-11")
{
  "format": "journal",
  "changelog.2026-06-11": {
    "title": "Format grammar redesign",
    "date": "2026-06-11",
    "content": "Unified format grammar — primitive/extends/fileNameExtension..."
  }
}
```

It updates the header and inserts a new entry in a single write:

```json
// forge_write("Journal.md", payload)
{
  "header": { "content": "Knowledge Base — session log. Updated 2026-06-11." },
  "changelog": {
    "_action": "insert",
    "_position": 0,
    "_value": {
      "title": "Key Concepts section added to forge.md",
      "date": "2026-06-12",
      "content": "Narrative introduction replacing Design Principles."
    }
  }
}
```

The same principle governs writes: **read wide, write narrow**. One read loads all useful context in a single call; one write touches only what changed, leaving the rest untouched.

Not all formats are files. `log-item` and `changelog` are **reusable types** — composable structures shared across `journal`, `doc`, and other formats. Only **file formats** — those that declare an extension — are instantiable on disk. **Primitives** (`text`, `date`, `boolean`) are terminal values, managed by the format that contains them.

### Format discovery

Before calling `forge_create`, the LLM must know which format to use. The protocol is:

1. If the format is already known from context (previous read, explicit user instruction) — use it directly.
2. Otherwise — call `forge_read("forge://registry")` first. The registry lists all available formats with their `description` and `intent` fields. Choose the format whose `intent` matches the current need.
3. Never guess a format name. If no format fits, use the native format (extension name).

This protocol is enforced by the LLM's instructions, not by the server. Forge does not reject `forge_create` calls with unregistered format names — it is the LLM's responsibility to consult the registry.

### Formats

A **format** defines the structure of a file's content. All formats live in a single `formats` registry — no separate type hierarchy.

Three markers determine a format's role:

- `primitive: true` — terminal value; no handler, no structure. Managed entirely by the containing format's handler. Examples: `text`, `date`, `boolean`, `integer`.
- `extends` — this format inherits the structure and handler of another format. If no `handler` is declared, the handler is inherited from the nearest ancestor that declares one.
- `fileNameExtension` — this format is a **file format**: it can be instantiated as a file on disk. A format without `fileNameExtension` is a **reusable format** — it can be extended by other formats or used in their sections but never instantiated directly.

The file extension constrains what formats are valid for that file — a format must respect the syntax rules of its extension:
- `.md` — formats must remain human-readable Markdown
- `.js` — formats must remain loadable by Node without breaking. For code files, Forge does not parse the internal language syntax — it validates only a standardized comment envelope declaring the script's objective, maintainer, and dependencies. The objective of Forge is to support best practices, not code generation.
- `.json` — formats must remain valid JSON
- Any other extension — treated automatically as native format.

Every extension has a **native format** — full file read/write, no imposed structure. Native is the fallback: if no registered format handler claims the file, it is treated as native.

A format is a **section model** — it describes the structure of a section's content and the handler provides code to read, write, and initialize it. The distinction between file format and reusable type matters for two methods:

- `claim` — only file formats implement it. It is the recognition mechanism used by the registry to identify which handler owns a file.
- `create` — all formats implement it, but with different scope. A file format's `create` writes the metadata block then calls `create` on each mandatory section. A reusable type's `create` initializes its own content skeleton only.

### Format inheritance

Inheritance is a **build-time concept** — a mechanism for reusing format definitions. It is invisible at run time: once a handler is initialized, there is no hierarchy, no `extends` chain, no parent reference. The LLM sees a flat structure.

**Rule: handlers are declared only on formats that do not extend another format.** A format with `extends` always inherits its handler from an ancestor. Intermediate handlers — a format that both extends a parent and declares its own handler — are forbidden. This keeps the inheritance model simple and unambiguous. If a combination of formats needs distinct behaviour, it becomes a new root format with its own handler.

Resolution is the **handler's responsibility**, not the registry's. When `initFormat` is called with a format that has `extends`, the handler receives the raw format JSON — including the `extends` key. It is the handler's job to query the registry for the parent descriptor and merge the grammars. The registry passes the format JSON and the SyntaxAdapter; it does not pre-resolve the chain.

**How `sequence` resolves inheritance:**
1. On `initFormat`, inspect the format JSON. If `extends` is present, call `registry.getFormat(extends)` to retrieve the parent descriptor.
2. Merge sections: parent sections first, child sections follow.
3. Override: if the child declares a section with the same name as a parent section, the child declaration replaces the parent's entirely — all annotations included.
4. Recurse if the parent itself has `extends`, until a format with no `extends` is reached.
5. Produce a single flat grammar. Discard all `extends` references — the runHandler has no knowledge of the inheritance chain.

```json
// parent
"doc": {
  "extends": "sequence",
  "fileNameExtension": "md",
  "why":       { "extends": "text" },
  "what":      { "extends": "text" },
  "how":       { "extends": "text" },
  "changelog": { "extends": "changelog", "optional": true, "lazy": true }
}

// child — adds sections, overrides changelog
"decision-log": {
  "extends": "doc",
  "fileNameExtension": "md",
  "decision":  { "extends": "text" },
  "status":    { "extends": "text" },
  "changelog": { "extends": "changelog", "optional": true, "lazy": true, "min": 1 }
}

// flat grammar produced by sequence.initFormat for decision-log
// sections in order: why, what, how, changelog (child override), decision, status
// no trace of extends in the runHandler
```

### Metadata block

Every non-native file carries a metadata block at the very top — the format's self-declaration. It is **never transmitted to the LLM** in any `forge_read` response.

The metadata block syntax depends on the extension — it must respect the file's syntax conventions:

```
.md   ->  [//]: # (forge-start)
           format: todo
           version: 1.0
          [//]: # (forge-end)

.js   ->  /* forge-start
           format: managed
           version: 1.0
           forge-end */

.json ->  { "__forge__": { "format": "schema", "version": "1.0" }, ... }
```

The metadata block syntax is the sole responsibility of the SyntaxAdapter for the file's extension. For `.js` files, the block is a comment envelope (`/* forge-start ... forge-end */`) — there is no separate `@mcp_metadata` annotation. If a file carries no metadata block, it is treated as native: full read/write, no structure enforced.

The `format` key is mandatory. It is the only key read by `claim()` to identify the handler. All other keys are format-specific and managed entirely by the handler.

`forge_create(path, format)` writes the metadata block and the format skeleton.

### Format grammar

All formats are declared in a single `formats` object in `forge-formats.json`. Three properties determine a format's role: `primitive`, `extends`, `fileNameExtension`.

**`intent`** — optional string field on any format (including reusable types). Describes the semantic use case — when to choose this format over another. Exposed by the registry via `forge_read("forge://registry")` and by `handler.describe()`. Not used at run time — guidance only.

**Primitive formats** — `primitive: true`. Terminals with no structure and no handler. The containing format's handler is responsible for reading and writing their values. All primitive values are serialized as strings in the JSON payload — `"effort": "M"`, `"done": "true"`.

```json
"text":    { "primitive": true, "description": "Plain text value." },
"date":    { "primitive": true, "description": "ISO date string." },
"boolean": { "primitive": true, "description": "true or false as string." },
"integer": { "primitive": true, "description": "Integer as string." }
```

**`sequence`** — the root structured format. No `extends`, no `fileNameExtension`. Declares a handler; all other structured formats inherit it. Documents the built-in annotation set recognised by `sequence.js` in its `_annotations` block — annotations from other handlers are defined in their own format entry.

```json
"sequence": {
  "handler": "./handlers/sequence.js",
  "description": "Ordered set of named sections. Handler resolved with the SyntaxAdapter for the declared fileNameExtension.",
  "_annotations": {
    "repeat":  "Zero or more occurrences of this section. Default: false (exactly one).",
    "key":     "This section is the identifier for each occurrence in a repeat. Used by dot-notation queries and lazy lists.",
    "lazy":    "forge_read returns the list of key values only; full content loaded on explicit query. Requires key: true on at least one child.",
    "min":     "Minimum occurrences (repeat only). Default: 0 when repeat is true.",
    "max":     "Maximum occurrences (repeat only). No default (unbounded).",
    "optional":"Shorthand for min: 0, max: 1. Resolved to min/max at build time by initFormat. Cannot be combined with explicit min or max.",
    "pattern": "Validation pattern for primitive values (string). Applied by the handler on read and write."
  }
}
```

**Section annotations** — inline properties on section definitions, interpreted by the active handler. Unknown annotations are silently ignored. The `sequence` handler's annotation set is documented in its `_annotations` block above.

`lazy` + `key: true` on a repeat section: `forge_read` returns the list of key values only. Each occurrence is accessible via dot-notation: `forge_read(path, "changelog.2026-06-11")`.

**Reusable types** — formats with `extends` but no `fileNameExtension`. They compose structure without being instantiable as files. Recursion (direct or indirect) is allowed.

```json
"log-item": {
  "extends": "sequence",
  "lazy": true,
  "title":   { "extends": "text", "key": true },
  "date":    { "extends": "date" },
  "content": { "extends": "text", "lazy": true }
},
"changelog": {
  "extends": "sequence",
  "items": { "extends": "log-item", "repeat": true }
}
```

**File formats** — formats with `fileNameExtension`. Instantiable as files on disk. The registry injects the SyntaxAdapter for the declared extension when initializing the handler.

```json
"journal": {
  "extends": "sequence",
  "fileNameExtension": "md",
  "description": "A journal file — header and changelog entries.",
  "header":    { "extends": "text" },
  "changelog": { "extends": "changelog" }
},
"doc": {
  "extends": "sequence",
  "fileNameExtension": "md",
  "description": "A structured Markdown document — Why, What, How.",
  "why":       { "extends": "text" },
  "what":      { "extends": "text" },
  "how":       { "extends": "text" },
  "changelog": { "extends": "changelog", "optional": true, "lazy": true }
}
```

**Handler inheritance** — a handler is declared only on formats that have no `extends` (e.g. `sequence`). All other formats inherit it implicitly: when the registry loads `journal` or `doc`, it calls `sequence.initFormat` directly. `sequence.initFormat` is responsible for resolving the `extends` chain and producing a flat grammar.

### forge_write payload

`forge_write` sends a partial JSON matching the structure returned by `forge_read`. What is not sent is not touched — write is narrow by construction.

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

`forge_create` is a write on an empty file — same structure, scope is the full skeleton. Payload is optional and must contain only implicit update actions.

### Validation rules

Forge enforces two categories of validation: rules evaluated once at startup, and rules evaluated on every tool call.

#### Build time

All build-time rules run when `forge-formats.json` is loaded. Any failure is a critical exception — the server does not start.

**Format table**
- Uniqueness: two file formats cannot share the same name for the same `fileNameExtension`.
- Extension declared: a file format's `fileNameExtension` must be declared in the `extensions` block — build error otherwise. An extension not declared in `extensions` is native-only: no structured format can target it.
- Inheritance resolution: every format declaring `extends` must point to an existing format. Cycles (`A extends B extends A`) are forbidden.
- Handler resolution: every non-primitive format must have a handler — declared explicitly via `handler`, or inherited by walking the `extends` chain. If no handler is found, the build fails.

**Grammar — `key` and `repeat`**
- A section with `repeat: true` must contain at least one child section or property annotated `key: true`.
- A section annotated `key: true` cannot also be `lazy: true`. The key must always be accessible for indexing.

**Grammar — bounds**
- If both `min` and `max` are defined on a repeat section, `min ≤ max` must hold. Both must be non-negative integers.

**Grammar — patterns**
- Every `pattern` attribute defined on a primitive section must be a valid, compilable JavaScript regular expression.

#### Run time

Run-time rules are evaluated on every tool call. On failure, the tool returns a structured error without touching the filesystem.

**`forge_read`**
- Format match: the format declared in the metadata block of a non-native file must match the format validated by the `claim()` call.
- Query validity: if a `query` parameter is provided, the dot-notation path must resolve to an existing section or valid key in the format tree. A path pointing to a non-existent section raises a navigation error.

**`forge_create`**
- Format existence: the `format` parameter must be present in the file-format registry (i.e. it must have a `fileNameExtension`).
- Extension conformance: the extension of the `path` must match the `fileNameExtension` of the requested format.
- Payload validation: if an optional `payload` is provided, it must be validated by the format handler before any write. It must contain only implicit update actions — no explicit `_action` keys.

**`forge_write`**
- Schema conformance: every key in the payload must exist in the format specification. Unknown keys are rejected immediately.
- Primitive constraints: every value assigned to a primitive section (`text`, `integer`, `boolean`, `date`) must match its type, and validate any `pattern` defined at build time.
- `insert` action: requires `_value`. If `_position` is provided, it must be a non-negative integer not greater than the current element count.
- `reorder` action: requires `_order`, an array containing exactly the full set of existing keys — no duplicates, no omissions.
- Cardinality invariants: after the patch is applied in memory, every repeat section must satisfy its `min` and `max` bounds. A write that would violate a bound is rejected.

---

### Targeted query — dot notation

`forge_read(path, query)` addresses any section in the tree, lazy or not:

```
forge_read(path)                         -> full response (lazy sections: key list only)
forge_read(path, "changelog")            -> changelog key list (lazy)
forge_read(path, "changelog.2026-06-11") -> one changelog entry (full content)
forge_read(path, "why")                  -> one named section
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
  down forge_ls / forge_mkdir / forge_rmdir / forge_move / forge_rename
  down forge_read / forge_write / forge_create / forge_delete
Forge (MCP server)
  |-- navigation -> rootRegistry (folder operations)
  `-- content   -> dispatch by claim -> Format Registry -> handler -> rootRegistry
rootRegistry
  down
Filesystem
```

Forge never calls the filesystem directly. All storage access goes through `rootRegistry`. Navigation tools bypass the format registry entirely — they delegate straight to `rootRegistry`.

### Format registry

The format registry is populated at build time from `forge-formats.json`.

**`forge-formats.json` structure — `extensions` + `formats`:**

```json
{
  "extensions": {
    "md": { "syntaxAdapter": "./adapters/md-adapter.js" },
    "js": { "syntaxAdapter": "./adapters/js-adapter.js" }
  },
  "formats": {
    "sequence": { "handler": "./handlers/sequence.js", "description": "..." },
    "text":     { "primitive": true, "description": "..." },
    "date":     { "primitive": true, "description": "..." },
    "boolean":  { "primitive": true, "description": "..." },
    "integer":  { "primitive": true, "description": "..." },

    "log-item":  { "extends": "sequence", "...": "..." },
    "changelog": { "extends": "sequence", "...": "..." },

    "doc":     { "extends": "sequence", "fileNameExtension": "md", "...": "..." },
    "journal": { "extends": "sequence", "fileNameExtension": "md", "...": "..." }
  }
}
```

The `extensions` block declares which extensions are supported with structured formats. Each entry points to a SyntaxAdapter module. An extension not declared here has no SyntaxAdapter — only the native format applies to its files.

**Structure at run time:**
```
extension
  `-- <format-name> -> runHandler   <- { claim, read, write, create, describe }  (file formats only)
  (native is not stored — it is the registry fallback)
```

Only file formats (those with `fileNameExtension`) are registered at the top level of the registry. Reusable types are resolved internally during handler initialization — never registered directly.

**Build time — loading `forge-formats.json`:**

1. Load `extensions` block — for each entry, load the SyntaxAdapter module and instantiate it. Store adapters by extension name.
2. For each format entry in `formats`:
   - Skip primitives (`primitive: true`) — no handler to load.
   - Skip reusable types (no `fileNameExtension`) — stored as raw descriptors for inheritance resolution; not registered by extension.
   - Build error if format declares both `extends` and `handler`.
   - Build error if `fileNameExtension` is not declared in the `extensions` block.
   - Load the handler module (declared directly on the format or inherited via `extends` chain).
   - Inject the SyntaxAdapter for the declared extension.
   - Call `handler.initFormat(formatJson, adapter)` — the handler receives the raw format JSON, including `extends` if present, and resolves the inheritance chain itself by calling `registry.getFormat()`. Returns a runHandler.
   - Register `runHandler` under `extension → name`.

**Build time constraint — name uniqueness per extension:**
Two file formats under the same extension must have different names. A duplicate name is a build error — Forge refuses to start.

### Handler interface

A handler module exports a build function `initFormat` that returns a run handler.

**Build function** — `initFormat(formatJson)` — called once per format at build time:
```js
export async function initFormat(formatJson)
  // -> runHandler
```

**Run handler — base interface** — implemented by all formats:
```js
{
  async read(path, rootRegistry, query?)   -> object,
  async write(path, rootRegistry, payload) -> void,
  async create(path, rootRegistry)         -> void,
  describe()                               -> { description, example }
}
```

**Run handler — file format extension** — implemented only by file formats, in addition to the base interface:
```js
{
  async claim(rawContent)   -> boolean
}
```

`claim(rawContent)` — reads the metadata block from the raw file content and returns `true` if this handler recognizes the file. The registry never reads the metadata block directly — claim is the sole recognition mechanism. Plain formats do not implement `claim`.

### Sequence handler

`sequence.js` implements the generic grammar logic — sections, repeat, lazy, query, write narrow. It is extension-independent. All syntax concerns are delegated to a **SyntaxAdapter** injected at build time by the registry.

```
sequence.js   <- generic grammar logic (sections, repeat, lazy, query, write narrow)
                 receives SyntaxAdapter at initFormat
                 one instance per file format (doc, journal, ...)
```

There is no `md-sequence.js` or `json-sequence.js`. The registry injects the correct SyntaxAdapter when initializing each file format that extends `sequence`.

**SyntaxAdapter interface** — one per supported extension, instantiated by the registry at build time:

```js
{
  // Metadata block
  parseMetadata(rawContent)               -> { format, ...meta } | null,
  serializeMetadata(meta)                 -> string,

  // Sections
  parseSections(rawContent, grammar)      -> section[],
  serializeSections(sections, rawContent) -> string,

  // Skeleton generation for forge_create
  buildSkeleton(formatJson)               -> string,
}
```

`parseMetadata` returns `null` if no metadata block is found (native signal).

`section` is an internal structure used by `sequence.js` — not exposed to the LLM. It carries the section name, raw content, and child sections if any.

**Wiring — build time only.** The registry calls `sequence.initFormat(formatJson, adapter)` for each file format that inherits `sequence.js`. The adapter is instantiated once and captured by the run handler's closure — never passed at run time.

### Write safety

Write narrow means the SyntaxAdapter reconstructs the full file from structured sections on every `forge_write`. A serialization bug on an untouched section (especially a lazy one) would silently corrupt the file.

Before every `forge_write`, the server creates a temporary backup (`.bak`) of the original file. If validation of the final structure fails or an I/O error occurs during write, the server rolls back automatically from the backup and returns an error. The backup is deleted on success.

This is a server-side guarantee — no LLM action required.

### Native format

Native is the fallback format — it applies when no registered handler claims the file. It is hard-coded in the registry, not declared in `forge-formats.json`.

A native file has no metadata block. `forge_read` returns the full raw content as a single `content` section. `forge_write` replaces the full content. There is no structure, no sections, no query support.

```js
// forge_read on a native file
{ "format": "md", "content": "# Hello\n..." }
```

### rootRegistry interface

The only storage interface a handler ever calls. Filesystem details are entirely hidden.

```js
rootRegistry.read(path)            // -> raw string content
rootRegistry.write(path, content)  // -> void; error if file does not exist
rootRegistry.create(path)          // -> void; error if already exists
rootRegistry.delete(path)          // -> void
rootRegistry.exists(path)          // -> boolean
```

Paths are standard filesystem paths — no special syntax. The rootRegistry resolves them against configured roots.

### Dispatch flow

**On `forge_read(path, query?)`:**
1. Read raw file via `rootRegistry.read(path)`
2. Determine file extension from path
3. Call `claim(rawContent)` on each registered handler for that extension, in declaration order
4. First handler returning `true` — handler retained
5. No handler claims the file — native fallback
6. Call `handler.read(path, rootRegistry, query)` (or native read)
7. Return JSON to LLM

**On `forge_write(path, payload)`:**
1. Read raw file — run claim loop (same as read) — retain handler
2. Call `handler.write(path, rootRegistry, payload)`

**On `forge_create(path, format)`:**
1. Look up format by name in registry — get handler
2. Call `handler.create(path, rootRegistry)`
3. Handler writes metadata block + skeleton

**On `forge_delete(path)`:**
1. `rootRegistry.delete(path)`
2. No handler involved — file deletion is format-agnostic

### Accessing the registry

The format registry is itself a Forge artifact — readable via `forge_read`:

```
forge_read("forge://registry")
-> {
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

**Description:** Read a file's content as structured JSON. Strips boilerplate. Large rarely-needed sections (changelog, history) return headers only by default — use the `query` parameter to load their content. Returns `format` section identifying the file's format; native files return `format: "<extension>"`.

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
      "description": "Partial JSON matching the structure returned by forge_read. Only included sections are modified. Use '_action' key for structural operations: 'insert', 'delete', 'reorder'. Use '_position' (integer, 0=first) with insert. Use '_value' with insert to provide the new content. Use '_order' (array of ids) with reorder."
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
      "description": "Format name from the registry. Examples: 'todo', 'doc', 'managed'. Use the native format name (extension) for unstructured files. Consult forge_read('forge://registry') first if the format is not already known from context."
    },
    "payload": {
      "type": "object",
      "description": "Optional. Initial content to populate the skeleton. Must contain only implicit update actions matching the structure of the chosen format. Useful for formats with repeat sections that require at least one entry to be usable."
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

### Version 1.6 - extensions block + SyntaxAdapter declaration
**Date:** 2026-06-12
**Reason:** SyntaxAdapters were injected by the registry but their source was unspecified. Added `extensions` block to `forge-formats.json` — each extension declares its SyntaxAdapter module. Consequence: file formats must reference a declared extension (build error otherwise), and undeclared extensions are native-only.

**Changes:**
- How / Format registry / `forge-formats.json` structure: `extensions` block added to JSON example; explanatory paragraph added
- How / Format registry / Build time: step 1 added (load extensions + adapters); steps renumbered; reusable types skip rule made explicit; extension-declared build error added
- What / Validation rules / Build time / Format table: `Extension declared` rule added

---

### Version 1.5 - Format inheritance rewritten
**Date:** 2026-06-11
**Reason:** Previous version attributed inheritance resolution to the registry. Corrected: resolution is the handler's responsibility. Registry passes raw format JSON; handler (sequence) resolves the chain, merges grammars, and produces a flat runHandler. Rule added: handlers declared only on formats with no `extends`.

**Changes:**
- What / Format inheritance: fully rewritten — build-time concept, handler responsibility, no intermediate handlers rule, sequence resolution algorithm (5 steps), example updated
- How / Format registry / Build time: steps 2–5 rewritten — registry no longer resolves handler chain or merges grammar; passes raw JSON to handler; handler owns inheritance resolution
- What / Format grammar / Handler inheritance: rewritten — handler declared only on formats without `extends`; sequence.initFormat owns chain resolution

---

### Version 1.4 - Validation rules
**Date:** 2026-06-11
**Reason:** Build-time and run-time validation rules were implied by the architecture but never formally specified. Added as a standalone subsection in What — Principles and tools.

**Changes:**
- What: `### Validation rules` added — build time (format table, key/repeat, bounds, patterns) and run time (forge_read, forge_create, forge_write)
- Table of Contents: subsection guide added

---

### Version 1.3 - optional alias + annotations dans sequence + table supprimee
**Date:** 2026-06-11
**Reason:** `optional` est un alias de `min: 0, max: 1` — pas une annotation primitive. La table des annotations est deplacee dans le bloc `_annotations` de `sequence`, qui est leur source de verite. La table standalone est supprimee.

**Changes:**
- What / Format grammar / `sequence`: bloc `_annotations` enrichi — `optional` documente comme alias de `min: 0, max: 1`, incompatible avec `min`/`max` explicites
- What / Format grammar: table `section annotations` supprimee — remplacee par le paragraphe `Section annotations` qui renvoie au bloc `_annotations`
- How / Format registry / Build time: etape 3 ajoutee — resolution de la chaine `extends` et fusion de la grammaire ; etape 4 ajoutee — validation et resolution de `optional`

---

### Version 1.2 - Format inheritance rules
**Date:** 2026-06-11
**Reason:** Cas non couvert — un format etendant un format qui a deja des sections. Impact sur le registry (fusion a build time) et le handler (grammaire deja resolue a l'arrivee).

**Changes:**
- What: `### Format inheritance` ajoute — trois regles (ordre, override, handler), exemple `doc` -> `decision-log`

---

### Version 1.1 - Retours critiques integres
**Date:** 2026-06-11
**Reason:** Revue critique post-v1.0 — quatre angles morts identifies : decouverte de format, payload forge_create, securite des ecritures, nettoyages.

**Changes:**
- What: `### Format discovery` ajoute — protocole d'intention obligatoire avant forge_create
- What / Format grammar: champ `intent` documente
- How: `### Write safety` ajoute — backup `.bak` + rollback automatique avant chaque forge_write
- MCP Specs / forge_create: parametre `payload` optionnel ajoute au schema ; note de decouverte dans `format`
- What / Metadata block: clarification `.js` — `/* forge-start */` seul format ; comportement si absent
- How / SyntaxAdapter: `parsesections` / `serializesections` -> camelCase `parseSections` / `serializeSections`
- Changelog: v0.1-v0.9 condenses en entree `Design history`

---

### Version 1.0 - Unified format grammar — primitive/extends/fileNameExtension
**Date:** 2026-06-11
**Reason:** Format grammar redesigned. Single `formats` object replaces separate `primitives` + `types` sections. Three markers (`primitive: true`, `extends`, `fileNameExtension`) express all roles without a type hierarchy. `md-sequence.js` removed — registry injects SyntaxAdapter directly into `sequence.js`. `extension` renamed `fileNameExtension` to avoid confusion with `extends`. Handler inheritance through `extends` chain. Reusable types (no `fileNameExtension`) vs file formats (`fileNameExtension` present).

**Changes:**
- Keywords: `primitive`, `extends`, `fileNameExtension` added
- What / Formats: rewritten — three markers, file format vs reusable type, `claim` and `create` ownership
- What / Format grammar: fully rewritten — primitives, `sequence` root, reusable types, file formats, handler inheritance, section annotations, examples (`log-item`, `changelog`, `journal`, `doc`)
- How / Format registry: rewritten — single `formats` structure, build time steps updated
- How / Sequence handler: rewritten — no `md-sequence.js`, registry injects SyntaxAdapter, `Section` -> `section`

---

### Design history (v0.1-v0.9)
**Date:** 2026-06-09 - 2026-06-11
**Summary:** Nine iterations covering the architectural foundations: initial draft, navigation tools and single access layer, kind removed in favour of leaf/container vocabulary, philosophical postulate and Constrain Don't Forbid principle, format grammar first pass, claim-based dispatch and native fallback, sequence handler and SyntaxAdapter, build-time wiring clarification, file format vs reusable type distinction.
