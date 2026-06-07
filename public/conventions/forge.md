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
8. [Registry](#registry)
9. [Roots and configuration](#roots-and-configuration)
10. [MCP tools](#mcp-tools)
11. [Roadmap](#roadmap)
12. [Index](#index)

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

**Handler** — a JavaScript module. Root handlers manage folder navigation; type handlers manage artifact and block operations. Forge never calls handlers directly — all access goes through the registries.

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

### FAL as a capsule

An artifact FAL encodes two pieces of information that the type registry needs:

- **type** — extracted from the extension (after the last `.`) — used to look up the handler in the hashmap
- **URL** — reconstructed by the handler via `falToURL()` — the physical resource location

Neither piece is stored separately. The FAL is self-contained. This is why artifact FALs must carry the real type name — without it, the type registry cannot dispatch to the correct handler.

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
- `isFolder: false` → Forge passes the URL to the type registry for discovery.

**Exceptions:**
- `rmdir` on a non-empty folder → error. An `undefined` artifact inside cannot be deleted, so the folder cannot be destroyed.
- Any operation on a URL outside the root → error.
- Move across roots → not supported.

## Type discovery
[up](#table-of-contents)

When the root handler returns a non-folder URL, Forge passes it to the type registry for discovery. The type registry runs discovery in two phases.

**Phase 1 — claim:**

The type registry calls `claim(url)` on all registered type handlers. Within a type hierarchy, the registry respects the order from most specific to least specific (`md-doc-convention` before `md-doc` before `md`) and **stops as soon as one handler claims the URL** — more general handlers in the same hierarchy are not called. Hierarchies that are independent of each other are all evaluated.

The hierarchy order is derived from the type names — a type name is split on `-` and longer names (more segments) are more specific. No explicit `extends` declaration is needed.

Claim logic is entirely the handler's responsibility. A handler may inspect the URL extension, the filename, or the file content (shebang). Examples:

- `md` — claims any `.md` file unconditionally. Called last among `md-*` types.
- `md-doc` — claims `.md` files containing a specific shebang (e.g. `*Document type:*`). Placed above `md` in the hierarchy, so it is called first and stops the chain if it claims.
- `doc-todolist` — claims files named exactly `TODO.md`. No shebang needed.

If two independent handlers could both claim the same URL (e.g. two handlers both matching `.md` with no shebang, at unrelated hierarchy positions), one solution is to introduce a shebang to distinguish them; another is to place one inside the hierarchy of the other.

**Phase 2 — outcome:**

- Exactly 1 claim → artifact typed; handler calls `urlToFAL(url)` to produce the artifact FAL.
- 0 claims → artifact assigned the built-in `undefined` type. It exists in the hierarchy (it can be listed) but no operation is possible on it. It cannot be read, written, moved, or deleted. A folder containing an `undefined` artifact cannot be deleted.
- >1 claims → error. Forge reports all claiming handlers.

## Type handlers
[up](#table-of-contents)

A type handler is a JavaScript module that manages artifacts and their block structure for a specific type. It is the executable form of a convention — conformance becomes automatic through the handler interface.

Forge never calls a type handler directly. All calls go through the type registry.

**Interface:**
```js
export const type = 'md-doc';
export const version = '1.0';

// Type discovery
export async function claim(url)                         // return true if this handler manages this URL
export async function urlToFAL(url)                      // url physique → artifact FAL name (stem.type)
export async function falToURL(falName, baseUrl)         // artifact FAL name → url physique

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

**`urlToFAL(url)` and `falToURL(falName, baseUrl)`:**

These two functions are the bidirectional mapping between the physical URL and the FAL name. They are called by the type registry — never by Forge directly.

- `urlToFAL("file:///path/TODO.md")` → `"TODO.doc-todolist"`
- `falToURL("TODO.doc-todolist", "file:///path/")` → `"file:///path/TODO.md"`

The FAL name is the artifact name with its type extension — the stem may differ from the physical filename. The handler is the only place that knows this mapping.

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

## Registry
[up](#table-of-contents)

The registry layer is the only interface between Forge and the handlers. Forge never calls a handler directly — it calls a registry, which dispatches to the appropriate handler internally.

There are two registries with complementary responsibilities. Both work with URLs as their common currency.

### Type registry

The type registry manages all artifact operations. It is loaded at startup from the types JSON file. It exposes a FAL-only API to Forge — types are hidden inside the registry and encoded in the FAL.

**Internal structure:**

At startup, the type registry builds a hashmap: `typeName → handler module`. The type hierarchy order (for `claim()` dispatch) is derived from the type names — names are split on `-` and sorted by descending length (more segments = more specific). No explicit ordering configuration is needed.

**API exposed to Forge:**

```js
// Discovery — url physique → FAL (called by Forge during forge_ls)
typeRegistry.discover(url)                          → fal

// Artifact operations — all take a FAL, dispatch to handler via type extraction + falToURL()
typeRegistry.read(fal, block?)                      → content
typeRegistry.write(fal, block, content)
typeRegistry.listBlocks(fal, block?)                → string[]
typeRegistry.createArtifact(fal)
typeRegistry.deleteArtifact(fal)
typeRegistry.moveArtifact(fal, targetFal)
typeRegistry.renameArtifact(fal, name)
typeRegistry.insertBlock(fal, name, after, firstChild?)
typeRegistry.appendBlock(fal, block, content)
typeRegistry.deleteBlock(fal, block)
```

**Dispatch mechanism** (same for all artifact operations):
1. Extract type from FAL extension (after last `.`)
2. Look up handler in hashmap — O(1)
3. Call `handler.falToURL(falName, baseUrl)` to recover the physical URL
4. Delegate to handler

**`discover(url)` mechanism:**
1. Call `claim(url)` on handlers, most specific first (derived from type name length)
2. Stop at first claim
3. Call `handler.urlToFAL(url)` to produce the FAL name
4. Return the complete FAL

### Root registry

The root registry manages folder navigation. It is loaded at startup from the roots array in the config. Each root has exactly one handler — no dispatch needed.

Folder FALs are derived directly from URLs by Forge (strip the base URL, prepend `forge://<root>/`) — the root registry does not manage FAL encoding.

**API exposed to Forge:**

```js
rootRegistry.list(url)                              → { folders: url[], artifacts: url[] }
rootRegistry.mkdir(url)
rootRegistry.rmdir(url)
rootRegistry.mvdir(url, targetUrl)
rootRegistry.rndir(url, name)
```

**Forge responsibilities for folders:**

Forge translates between folder FALs and URLs before calling the root registry:
- FAL → URL: strip `forge://<root>/`, prepend root base URL
- URL → FAL: strip root base URL, prepend `forge://<root>/`

### Sequence diagrams

**`forge_ls` — folder listing:**

```mermaid
sequenceDiagram
    participant MCP
    participant Forge
    participant RootReg as Root Registry
    participant RootH as Root Handler
    participant TypeReg as Type Registry
    participant TypeH as Type Handler

    MCP->>Forge: forge_ls(folderFal)
    Forge->>Forge: FAL → url
    Forge->>RootReg: list(url)
    RootReg->>RootH: list(url)
    RootH-->>RootReg: [{url, isFolder}, ...]
    RootReg-->>Forge: [{url, isFolder}, ...]

    loop each entry
        alt isFolder = true
            Forge->>Forge: url → folder FAL
        else isFolder = false
            Forge->>TypeReg: discover(url)
            TypeReg->>TypeH: claim(url)
            TypeH-->>TypeReg: true
            TypeReg->>TypeH: urlToFAL(url)
            TypeH-->>TypeReg: FAL name
            TypeReg-->>Forge: artifact FAL
        end
    end

    Forge-->>MCP: [folder FALs..., artifact FALs...]
```

**`forge_read` — artifact read:**

```mermaid
sequenceDiagram
    participant MCP
    participant Forge
    participant TypeReg as Type Registry
    participant TypeH as Type Handler

    MCP->>Forge: forge_read(fal, block?)
    Forge->>TypeReg: read(fal, block?)
    TypeReg->>TypeReg: extract type from FAL extension
    TypeReg->>TypeReg: lookup handler in hashmap
    TypeReg->>TypeH: falToURL(falName, baseUrl)
    TypeH-->>TypeReg: url
    TypeReg->>TypeH: readBlock(url, block)
    TypeH-->>TypeReg: content
    TypeReg-->>Forge: content
    Forge-->>MCP: content
```

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

Forge implements each tool by translating the MCP call into one or two registry calls — no additional logic.

**Implemented:**

| Tool | Arguments | Description |
|---|---|---|
| `forge_ping` | — | Connectivity check — returns `pong` and server version |
| `forge_ls` | `fal?` | List one level. No arg: list roots. Folder FAL: list folders and artifacts with their FALs. |
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
- Refactor `forge.js` — introduce type registry and root registry objects; Forge calls only registries
- Add `urlToFAL()` and `falToURL()` to all type handlers
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

### Version 5.0 - Registry API and sequence diagrams
**Date:** 2026-06-06
**Reason:** Design session — registry layer fully specified as the only interface between Forge and handlers. FAL as a capsule encoding type + URL. Type registry and root registry APIs documented. Sequence diagrams added for forge_ls and forge_read. urlToFAL/falToURL added to type handler interface.

**Modifications:**
- `## Key concepts`: Handler definition updated — Forge never calls handlers directly
- `## Forge Artifact Locator FAL`: new sub-section `FAL as a capsule` — explains type + URL encoding
- `## Type discovery`: hierarchy order rule clarified — derived from type name length, no explicit config needed; Phase 2 outcome updated — urlToFAL() called on claim
- `## Type handlers`: `urlToFAL()` and `falToURL()` added to interface; note added — Forge never calls handlers directly; `urlToFAL`/`falToURL` contract documented
- `## Registry`: new section — type registry API, root registry API, dispatch mechanism, sequence diagrams (forge_ls with alt isFolder branch, forge_read)
- `## MCP tools`: note added — Forge translates MCP calls into registry calls, no additional logic; forge_ls description updated
- `## Roadmap`: near term updated — refactor forge.js with registry objects as first step

---

### Version 4.0 - Handler interfaces, block model, config fully specified
**Date:** 2026-06-06
**Reason:** Full revision following design review session — block separator unified to `#`, handler URLs in both registries, type registry externalised to a separate JSON file, block model clarified (order significant, content before children, readBlock returns own content only), listBlocks returns one level of full paths, insertBlock signature redesigned (after + firstChild), flat conflict explanation rewritten as two-phase discovery, configuration file updated with complete root and type examples.

---

### Version 3.0 - Root handler, type handlers, type discovery rewritten
**Date:** 2026-06-06
**Reason:** Simplification of the design — handler interfaces fully specified, root handler and type handler separated into distinct sections, type discovery mechanism precisely described, block anonymous `""` introduced, MCP tools reorganised by concern, Roadmap updated.

---

### Version 2.0 - FAL, key concepts, type model, support model
**Date:** 2026-06-06
**Reason:** Realignment session — FAL introduced as primary addressing concept, registry of artifacts removed, support model clarified, type inheritance documented, handler identify() introduced, roots named.

---

### Version 1.0 - Creation
**Date:** 2026-06-06
**Reason:** Forge designed and proto implemented in session "death to filesystem".
