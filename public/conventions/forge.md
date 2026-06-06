# Forge Convention

Convention for the Forge MCP server — structured, typed access layer for all projects.

*Document type: Convention*

## Quick Start

Forge is a single shared MCP server that replaces direct filesystem access with a typed, structured artifact layer.

Forge navigates a hierarchy of roots, folders, and artifacts identified by FALs (Forge Artifact Locators). A FAL is a wrapper around a URL — it adds type and block addressing on top of any underlying resource location.

Two static registries govern Forge: the root registry (folder navigation, one handler per root) and the type registry (artifact operations, one handler per type). Both are defined in the MCP configuration and cannot be changed at runtime.

Within an artifact, content is accessed via named blocks — never by line number. Block arguments are always full paths from the root block. Block content is always plain text. Order is significant — both in folder listings and in block listings.

## Keywords
forge, MCP, artifact, FAL, type, handler, blocks, filesystem, structured-access, URL, roots, registry, claim, type-discovery

## Table of Contents

1. [Why Forge exists](#why-forge-exists)
2. [Key concepts](#key-concepts)
3. [Forge Artifact Locator FAL](#forge-artifact-locator-fal)
4. [Blocks](#blocks)
5. [Root handler](#root-handler)
6. [Type discovery](#type-discovery)
7. [Type handlers](#type-handlers)
8. [Roots and configuration](#roots-and-configuration)
9. [MCP tools](#mcp-tools)
10. [Roadmap](#roadmap)
11. [Index](#index)

## Why Forge exists
[up](#table-of-contents)

Direct filesystem access (`filesystem` MCP) has six fundamental limitations when used by an AI Assistant:

**1. Raw access, no structure** — reads a file as a stream of lines. No understanding of sections, headings, or hierarchy. Reading one section of a large document requires loading the entire file.

**2. Tight coupling to internal structure** — any operation requires reasoning about physical layout — line numbers, delimiters, encoding. When structure changes, logic breaks. MCPs using replace or regex are brittle.

**3. No expressed intent** — `filesystem.read_file("Plan.md")` says nothing about why the file is being read. `forge_read("forge://kb/public/Plan.doc")` expresses intent — auditable, testable, reusable.

**4. No validation or constraints** — `filesystem` writes anything anywhere. A typed handler validates format and enforces structure.

**5. Token cost proportional to file size** — a 2000-line file loads 2000 lines even when one section is needed. Block access loads only what is requested and avoids boilerplate or changelogs.

**6. Conventions are advisory, not enforced** — adherence is best-effort. A Forge handler encodes the convention in its interface. Conformance becomes automatic, not hoped for.

Forge addresses all six by replacing raw file access with a structured, typed, convention-enforcing artifact layer.

**The end state:** `filesystem` and `edit-file-lines` MCP are turned off. Forge is the only artifact access path.

## Key concepts
[up](#table-of-contents)

**Root** — a named entry point in the hierarchy, defined in the MCP configuration with a name, a base URL, and a root handler. The name is used in absolute FALs. The base URL is the only place a physical path appears.

**Folder** — a node in the hierarchy under a root. A folder FAL wraps a URL identified as a folder by the root handler.

**Artifact** — any non-folder resource managed by Forge. An artifact FAL wraps a URL identified as non-folder by the root handler, then typed by the type registry. An artifact may have a block structure.

**Type** — the semantic kind of an artifact. Determines which handler manages it. Types form a name hierarchy used for discovery ordering — `md-doc-convention` is more specific than `md-doc`, which is more specific than `md`.

**Block** — a named unit of content within an artifact. Always accessed by full path from the root block, never by position or line number. Order among sibling blocks is significant. Block content is always plain text. A block may have both content of its own and child blocks — the content always precedes the children.

**Handler** — a JavaScript module. Root handlers manage folder navigation; type handlers manage artifact and block operations.

## Forge Artifact Locator FAL
[up](#table-of-contents)

A FAL is the unique locator of a folder, artifact, or block in Forge. It wraps a URL with type information and an optional block path. It is the primary interface between humans, AI Assistants, and Forge.

### FAL syntax

```
forge://<root-name>/[<folder>/]*[<artifact-name>.<type-name>[#<block-name>[#<block-name>]*]]
```

- `forge://<root-name>/` — mandatory, identifies the root
- `[<folder>/]*` — zero or more folder names
- `<artifact-name>.<type-name>` — artifact name and its type
- `[#<block-name>]*` — optional block path, `#`-separated, full path from root block

A FAL ending with `/` and no artifact part is a **folder FAL**.

Names containing spaces, `/`, `#`, or other ambiguous characters must be quoted with double quotes. Literal double quotes in a name are doubled.

**Examples:**

```
forge://development/                                                     ← root
forge://development/big-project/                                         ← folder
forge://development/big-project/TODO.doc-todolist                        ← artifact
forge://development/big-project/TODO.doc-todolist#W1                     ← block
forge://kb/public/TODO.doc-todolist#section:Normale#item:W1              ← nested block
forge://kb/public/INDEX.doc#section:Session-Bootstrap                    ← nested block
```

### Root registry

Defined in the MCP configuration. Cannot be changed at runtime.

Each root entry:
- `name` — used in FALs
- `url` — base URL of the root (the only place a physical path appears)
- `handler` — URL of the root handler JavaScript module

### Type registry

Defined in the MCP configuration as a URL pointing to a separate JSON file. Cannot be changed at runtime. Keeping the type registry in a separate file allows it to be shared across projects and maintained independently of each local configuration.

Each type entry in the registry JSON:
- `name` — short identifier or dash-separated hierarchy (`md`, `md-doc`, `md-doc-convention`)
- `version` — handler version, used to detect staleness against the convention it implements
- `handler` — URL of the type handler JavaScript module

**Type registry JSON example (`types.json`):**
```json
{
  "md":              { "version": "1.0", "handler": "file:///...handlers/md.js" },
  "md-doc":          { "version": "1.0", "handler": "file:///...handlers/md-doc.js" },
  "doc-todolist":    { "version": "2.5", "handler": "file:///...handlers/doc-todolist.js" }
}
```

## Blocks
[up](#table-of-contents)

Blocks are the named units of content within an artifact. They are the only unit of access — there is no "read the whole artifact" operation outside of the anonymous root block.

**Key principles:**
- Blocks are always accessed by full path from the root block, never by position or line number.
- Order among sibling blocks is significant and preserved.
- A block may have content of its own and child blocks. The content always precedes the children.
- `readBlock` returns only the block's own content, not its children.
- Block content is always plain text.

**The anonymous block `""`** is always present at the root of the block hierarchy. It is the entry point for the full managed content of the artifact. Boilerplate managed by the handler (TOC, index, etc.) surrounds this block — invisible on read, recomputed on write.

**Block hierarchy example — `doc-todolist`:**
```
""                               (anonymous root)
  section:High-priority          (## High priority)
    item:O1                      (- [ ] [O1] ...)
    item:O2
  section:Normale
    item:W1
  changelog
    entry:"Version 2.5"
```

**Block hierarchy example — `doc`:**
```
""                               (anonymous root)
  quick-start                    (## Quick Start)
  section:Why-Forge-exists       (## Why Forge exists)
  section:Key-concepts
  changelog
    entry:"Version 4.0"
```

**Block path examples in FAL:**
```
forge://kb/public/TODO.doc-todolist#section:Normale#item:W1
forge://kb/public/INDEX.doc#section:Session-Bootstrap
forge://kb/public/CHANGELOG.doc#changelog#entry:"Version 2.0"
```

## Root handler
[up](#table-of-contents)

A root handler is a JavaScript module that manages folder navigation within a root. It operates on URLs — it receives URLs and returns URLs. It has no knowledge of Forge internals or types.

**Interface:**
```js
export async function list(url)              // list one level of folder contents
export async function mkdir(url)             // create a folder
export async function rename(url, name)      // rename a folder
export async function move(url, targetUrl)   // move a folder within the same root
export async function rmdir(url)             // delete a folder
```

**`list(url)` contract:**

Returns an ordered array of `{ url, isFolder }` entries. Order is significant and preserved.

- `isFolder: true` → Forge wraps the URL as a folder FAL.
- `isFolder: false` → Forge passes the URL to type discovery.

**Exceptions:**
- `rmdir` on a non-empty folder → error. An `undefined` artifact inside cannot be deleted, so the folder cannot be destroyed.
- Any operation on a URL outside the root → error.
- Move across roots → not supported.

## Type discovery
[up](#table-of-contents)

When the root handler returns a non-folder URL, Forge runs type discovery in two phases.

**Phase 1 — claim:**

Forge calls `claim(url)` on all registered type handlers. Within a type hierarchy, Forge respects the order from most specific to least specific (`md-doc-convention` before `md-doc` before `md`) and **stops as soon as one handler claims the URL** — more general handlers in the same hierarchy are not called. Hierarchies that are independent of each other are all evaluated.

Claim logic is entirely the handler's responsibility. Forge does not impose any mechanism — a handler may inspect the URL extension, the filename, or the file content (shebang). Examples:

- `md` — claims any `.md` file unconditionally. Called last among `md-*` types.
- `md-doc` — claims `.md` files containing a specific shebang (e.g. `*Document type:*`). Placed above `md` in the hierarchy, so it is called first and stops the chain if it claims.
- `doc-todolist` — claims files named exactly `TODO.md`. No shebang needed.

If two independent handlers could both claim the same URL (e.g. two handlers both matching `.md` with no shebang, at unrelated hierarchy positions), one solution is to introduce a shebang to distinguish them; another is to place one inside the hierarchy of the other.

**Phase 2 — outcome:**

- Exactly 1 claim → artifact typed, handler assigned.
- 0 claims → artifact assigned the built-in `undefined` type. It exists in the hierarchy (it can be listed) but no operation is possible on it. It cannot be read, written, moved, or deleted. A folder containing an `undefined` artifact cannot be deleted.
- >1 claims → error. Forge reports all claiming handlers.

## Type handlers
[up](#table-of-contents)

A type handler is a JavaScript module that manages artifacts and their block structure for a specific type. It is the executable form of a convention — conformance becomes automatic through the handler interface.

**Interface:**
```js
export const type = 'md-doc';
export const version = '1.0';

// Type discovery
export async function claim(url)

// Artifact CRUD
export async function createArtifact(url)
export async function deleteArtifact(url)
export async function moveArtifact(url, targetUrl)       // within the same root only
export async function renameArtifact(url, name)

// Block operations — block arguments are always full paths from the root block ""
export async function listBlocks(url, block="")          // list one level of children under block
export async function readBlock(url, block)              // read the block's own content (not its children)
export async function writeBlock(url, block, content)    // replace the block's own content
export async function insertBlock(url, name, after, firstChild=false)
                                                         // insert a new named block
                                                         // firstChild=true: insert as first child of after
                                                         // firstChild=false: insert as sibling after after
                                                         // after="" + firstChild=false → error
export async function appendBlock(url, block, content)   // append text to a block's own content
export async function deleteBlock(url, block)            // delete a block and its children
```

**`listBlocks(url, block="")` contract:**

Returns an ordered list of full block paths (direct children of `block` only — one level). Paths are complete from the root block and directly reusable as arguments to any block operation. Default `block=""` lists the top-level children of the artifact.

**`insertBlock` rules:**
- `name` — full path of the new block from the root block.
- `after` — full path of an existing block.
- `firstChild=true` — inserts as the first child of `after`.
- `firstChild=false` — inserts as a sibling immediately after `after`.
- `after=""` with `firstChild=false` → error (cannot insert a sibling of the root block).

**`writeBlock` with children:** allowed. The written content becomes the block's own content, preceding its children. Children are not affected.

**Handler versioning:** each handler declares a `version`. When the convention it implements is updated, the handler becomes stale. `forge_types_check` reports stale handlers.

**Exceptions:**
- Any block operation on a non-existent block → error.
- `deleteArtifact` on an `undefined` artifact → error.
- `moveArtifact` across roots → error.

## Roots and configuration
[up](#table-of-contents)

Forge is a **single shared process** across all projects. There is no per-project instance. Each project lives under a named root.

**Configuration file:** `public/tools/forge/forge.config.json`

```json
{
  "roots": [
    {
      "name": "development",
      "url": "file:///C:/Users/RemiLequette/Development",
      "handler": "file:///C:/Users/RemiLequette/Development/with-claude/knowledgebase/public/tools/forge/handlers/file-root.js"
    },
    {
      "name": "dropbox",
      "url": "file:///C:/Users/RemiLequette/Dropbox",
      "handler": "file:///C:/Users/RemiLequette/Development/with-claude/knowledgebase/public/tools/forge/handlers/file-root.js"
    }
  ],
  "types": "file:///C:/Users/RemiLequette/Development/with-claude/knowledgebase/public/tools/forge/types.json"
}
```

The `types` field points to a separate JSON file containing the type registry. This file is shared across all projects and maintained independently of each local configuration.

Root names are short, lowercase, no spaces. URLs are the only place physical paths appear.

**Claude Desktop configuration** (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "forge": {
      "command": "node",
      "args": ["C:\\Users\\RemiLequette\\Development\\with-claude\\knowledgebase\\public\\tools\\forge\\forge.js"]
    }
  }
}
```

**Installation:**
```
cd public/tools/forge
npm install
```

`node_modules/` is gitignored — `npm install` is required after every clone or pull.

**Log file:** `forge.log` is written alongside `forge.js`. It is gitignored.

## MCP tools
[up](#table-of-contents)

All tools accept FALs. Folder FALs end with `/`. Block paths use `#`. See the FAL section for syntax and quoting rules.

**Implemented:**

| Tool | Arguments | Description |
|---|---|---|
| `forge_ping` | — | Connectivity check — returns `pong` and server version |
| `forge_ls` | `fal?, base?` | List one level. No arg: list roots. Folder FAL: list folders and artifacts with their types. Artifact FAL + block: list direct child blocks (full paths). |
| `forge_read` | `fal, block?` | Read a block's own content. Defaults to `""` — full managed content of the artifact. |

**Planned — artifacts:**

| Tool | Arguments | Description |
|---|---|---|
| `forge_create` | `fal` | Create a new artifact |
| `forge_delete` | `fal` | Delete an artifact |
| `forge_move` | `fal, target` | Move an artifact within the same root |
| `forge_rename` | `fal, name` | Rename an artifact |

**Planned — blocks:**

| Tool | Arguments | Description |
|---|---|---|
| `forge_write` | `fal, block, content` | Replace a block's own content |
| `forge_append` | `fal, block, content` | Append text to a block's own content |
| `forge_insert` | `fal, name, after, firstChild?` | Insert a new named block |
| `forge_delete_block` | `fal, block` | Delete a block and its children |

**Planned — folders:**

| Tool | Arguments | Description |
|---|---|---|
| `forge_mkdir` | `fal` | Create a folder |
| `forge_rmdir` | `fal` | Delete a folder — error if not empty |
| `forge_mvdir` | `fal, target` | Move a folder within the same root |
| `forge_rndir` | `fal, name` | Rename a folder |

**Planned — registry:**

| Tool | Arguments | Description |
|---|---|---|
| `forge_types_list` | — | List all registered types |
| `forge_types_get` | `type` | Get a type definition and handler version |
| `forge_types_check` | — | Report handlers whose version is behind their convention |

## Roadmap
[up](#table-of-contents)

**Near term:**
- Implement type discovery with `claim()` in all handlers
- Register first real types: `md`, `md-doc`, `doc-todolist`
- Implement artifact CRUD: `forge_create`, `forge_delete`, `forge_move`, `forge_rename`
- Implement block CRUD: `forge_write`, `forge_append`, `forge_insert`, `forge_delete_block`
- Implement folder CRUD: `forge_mkdir`, `forge_rmdir`, `forge_mvdir`, `forge_rndir`
- Registry viewer — HTML tool browsing roots, types, and artifacts via Forge

**Medium term:**
- Absorb `local-server` — single process for MCP interface and static HTTP layer
- `md-doc` tool absorbed as handler logic for `md-doc` type

**Long term:**
- `type-doc` — declarative type descriptor (extension, shebang, block structure) that generates a handler automatically. Makes adding a new type a configuration task, not a coding task.
- `filesystem` MCP disabled in all project instructions

## Index

| Term | Occurrences |
|------|-------------|

## Changelog

### Version 4.0 - Handler interfaces, block model, config fully specified
**Date:** 2026-06-06
**Reason:** Full revision following design review session — block separator unified to `#`, handler URLs in both registries, type registry externalised to a separate JSON file, block model clarified (order significant, content before children, readBlock returns own content only), listBlocks returns one level of full paths, insertBlock signature redesigned (after + firstChild), flat conflict explanation rewritten as two-phase discovery, configuration file updated with complete root and type examples.

**Modifications:**
- `## Quick Start`: block separator `#` noted, order significance noted, block arguments as full paths noted
- `## Forge Artifact Locator FAL`: block separator unified to `#` in grammar and all examples
- `## Forge Artifact Locator FAL — Type registry`: externalised to URL pointing to `types.json`; handler fields changed from relative paths to URLs
- `## Blocks`: block principles expanded — order significant, content before children, readBlock own content only; all examples updated to `#` separator
- `## Root handler`: unchanged
- `## Type discovery`: rewritten as two explicit phases — Phase 1 (claim, hierarchy stops at first match) and Phase 2 (outcome: 1/0/>1); flat conflict replaced by concrete explanation with solutions
- `## Type handlers`: `listBlocks(url, block="")` — one level, returns full paths, default `""`; `readBlock` — own content only; `insertBlock` — redesigned with `after` + `firstChild` flag, rules and error case documented; `writeBlock` with children — allowed, content precedes children
- `## Roots and configuration`: config updated — root entries include handler URL; `types` field is a URL to external `types.json`; full example with two roots
- `## MCP tools`: `forge_ls` updated to cover artifact FAL + block; `forge_insert` updated with new signature

---

### Version 3.0 - Root handler, type handlers, type discovery rewritten
**Date:** 2026-06-06
**Reason:** Simplification of the design — handler interfaces fully specified, root handler and type handler separated into distinct sections, type discovery mechanism precisely described, block anonymous `""` introduced, MCP tools reorganised by concern, Roadmap updated.

**Modifications:**
- `## Handlers`: removed — replaced by `## Root handler`, `## Type discovery`, `## Type handlers`
- `## Root handler`: new — `list()` contract with `{url, isFolder}`, folder CRUD interface, exceptions
- `## Type discovery`: new — claim order by name hierarchy, handler responsibility, 0/1/>1 outcomes
- `## Type handlers`: new — full interface, anonymous block `""`, handler versioning, exceptions
- `## MCP tools`: rewritten — tools split by concern, planned list updated
- `## Versioning`: removed — handler versioning folded into `## Type handlers`
- `## Roadmap`: updated

---

### Version 2.0 - FAL, key concepts, type model, support model
**Date:** 2026-06-06
**Reason:** Realignment session — FAL introduced as primary addressing concept, registry of artifacts removed, support model clarified, type inheritance documented, handler identify() introduced, roots named.

---

### Version 1.0 - Creation
**Date:** 2026-06-06
**Reason:** Forge designed and proto implemented in session "death to filesystem".
