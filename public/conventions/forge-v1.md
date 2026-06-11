# Forge Convention

Convention for the Forge MCP server — structured, typed access layer for all projects.

*Document type: Convention*

## Quick Start

Forge is a single shared MCP server that replaces direct filesystem access with a typed, structured artifact layer.

Forge navigates a hierarchy of roots, folders, and artifacts identified by FALs (Forge Artifact Locators). A FAL is the external string representation of an artifact address — parsed by Forge into an `ArtifactRef` at the MCP boundary, never passed as a string to internal components.

Two registries govern Forge: the root registry (folder navigation and storage access) and the type registry (artifact typing and block operations). Both are defined in the MCP configuration and cannot be changed at runtime.

Within an artifact, content is accessed via named blocks — never by line number. Block arguments are always full paths from the root block. Block content is always plain text. Order is significant — both in folder listings and in block listings.

Roots and types are organised into **namespaces**. The KB is the default namespace (no prefix). Projects and libraries declare additional namespaces, each with their own roots and types loaded recursively at startup.

## Keywords
forge, MCP, artifact, FAL, ArtifactRef, UrlRef, IRootRegistry, type, handler, blocks, filesystem, structured-access, roots, registry, claim, type-discovery, namespace, multiproject, RTFM, describe, brand, initType, initLibrary, descriptor, factory, library, reload

## Table of Contents

1. [Why Forge exists](#why-forge-exists)
2. [Key concepts](#key-concepts)
3. [Forge Artifact Locator FAL](#forge-artifact-locator-fal)
4. [Blocks](#blocks)
5. [Root registry](#root-registry)
6. [Type discovery](#type-discovery)
7. [Type handlers](#type-handlers)
8. [Registry](#registry)
9. [Namespaces](#namespaces)
10. [Roots and configuration](#roots-and-configuration)
11. [MCP tools](#mcp-tools)
12. [Roadmap](#roadmap)
13. [Index](#index)

## Why Forge exists
[up](#table-of-contents)

Direct filesystem access (`filesystem` MCP) has six fundamental limitations when used by an AI Assistant:

**1. Raw access, no structure** — reads a file as a stream of lines. No understanding of sections, headings, or hierarchy. Reading one section of a large document requires loading the entire file.

**2. Tight coupling to internal structure** — any operation requires reasoning about physical layout — line numbers, delimiters, encoding. When structure changes, logic breaks. MCPs using replace or regex are brittle.

**3. No expressed intent** — `filesystem.read_file("Plan.md")` says nothing about why the file is being read. `forge_read("forge://kb/public/Plan.doc.md")` expresses intent — auditable, testable, reusable.

**4. No validation or constraints** — `filesystem` writes anything anywhere. A typed handler validates format and enforces structure.

**5. Token cost proportional to file size** — a 2000-line file loads 2000 lines even when one section is needed. Block access loads only what is requested and avoids boilerplate or changelogs.

**6. Conventions are advisory, not enforced** — adherence is best-effort. A Forge handler encodes the convention in its interface. Conformance becomes automatic, not hoped for.

Forge addresses all six by replacing raw file access with a structured, typed, convention-enforcing artifact layer.

**The end state:** `filesystem` and `edit-file-lines` MCP are turned off. Forge is the only artifact access path.

## Key concepts
[up](#table-of-contents)

**Root** — a named entry point in the hierarchy, defined in a roots registry with a name, a base URL, and a root handler. The name is used in absolute FALs. The base URL is the only place a physical path appears. Roots belonging to a namespace carry the namespace prefix: `commwise:production`.

**Folder** — a node in the hierarchy under a root. A folder FAL wraps a URL identified as a folder by the root handler.

**Artifact** — any non-folder resource managed by Forge. An artifact FAL wraps a URL identified as non-folder by the root handler, then typed by the type registry. An artifact may have a block structure.

**Type** — the semantic kind of an artifact. Determined by the type handler that claims it during discovery. The root registry labels resources with an extension (storage metadata); the type registry interprets that label and the content to assign a type (semantics). Types form a dot-separated name hierarchy used for discovery ordering — `convention.doc.md` is more specific than `doc.md`, which is more specific than `md`. Read left to right: the rightmost segment is the base format, each additional segment to the left refines it. Types belonging to a namespace carry the namespace prefix: `commwise:layout`.

**Node** — a named structural unit within an artifact. A node contains other nodes or blocks — it holds no data of its own. Mirrors the role of a folder in the filesystem, one level down.

**Block** — a named unit of data within an artifact. A block holds plain text content and has no children. Always accessed by full path from the root, never by position or line number. Order among siblings is significant.

**ArtifactRef** — the internal decomposed form of an artifact FAL. Forge parses FAL strings into `ArtifactRef` at the MCP boundary and rebuilds FAL strings from `ArtifactRef` on output. Internal components never work with FAL strings directly.

```js
{ root, path, name, type }
// e.g. { root: "development", path: "kb/public/", name: "INDEX", type: "md" }
```

**UrlRef** — the internal decomposed form of a resource URL, managed exclusively by the root registry. URLs never leave the root registry — only `UrlRef` objects circulate between the root registry and other components. The root registry is the sole authority on URL syntax.

```js
{ root, path, name, extension }
// e.g. { root: "development", path: "kb/public/", name: "INDEX", extension: ".md" }
```

**IRootRegistry** — the interface the type registry and type handlers use to access storage. Implemented by the root registry. Exposes artifact CRUD operations on `UrlRef` objects. Storage details (filesystem, database, archive, binary addressing) are entirely hidden behind this interface — type handlers are storage-agnostic.

**Handler** — a JavaScript module. Root handlers implement `IRootRegistry` for a specific storage backend. Type handlers manage artifact structure and block operations for a specific type, using `IRootRegistry` to access storage. Forge never calls handlers directly — all access goes through the registries.

**Namespace** — a named scope grouping roots and types belonging to a project or library. The KB is the default namespace (no prefix). All other namespaces are declared in registry files and loaded recursively at startup. A namespace is portable — its registry files can be moved to the KB or another namespace without changing their internal structure.

**Descriptor** — an optional JSON object that configures a type handler at startup. Passed to the handler's `initType(entry)` function by the type registry. May be declared inline in the type registry entry or in a separate file referenced by `"descriptor": "file:///..."`. Allows a single generic handler (e.g. `structured-text.js`) to serve multiple types without code duplication.

**Library** — a factory module declared in the `libraries` section of a types registry file. Its `initLibrary(entry)` returns an array of type entries — each treated exactly as if it had been declared directly in `types`. Libraries enable sharing common logic across types (sub-block patterns, claim strategies) and generating families of types from a compact declaration (e.g. `["txt", "md", "js"]`). A library may itself call other libraries from within its `initLibrary`.

## Forge Artifact Locator FAL
[up](#table-of-contents)

A FAL is the unique locator of a folder, artifact, or block in Forge. It is the external string representation used at the MCP boundary — parsed by Forge into an `ArtifactRef` on input, rebuilt from an `ArtifactRef` on output. Internal components never handle FAL strings directly.

### FAL syntax

```
forge://<root-name>/[<folder>/]*[<artifact-name>.<type-name>[#<block-name>[#<block-name>]*]]
```

- `forge://<root-name>/` — mandatory, identifies the root; namespaced roots use `namespace:name`
- `[<folder>/]*` — zero or more folder names
- `<artifact-name>.<type-name>` — artifact name separated from its type by the **first** `.` in the filename; namespaced types use `namespace:name`
- `[#<block-name>]*` — optional block path, `#`-separated, full path from root block

A FAL ending with `/` and no artifact part is a **folder FAL**.

**Filename constraint:** artifact names managed by Forge must not contain `.` — the first `.` is always the name/type separator. This is an intentional design constraint, not an OS limitation. Forge is used for KB and project files under controlled naming conventions; the restriction is documented and acceptable in that context.

Names containing spaces, `/`, `#`, or other ambiguous characters must be quoted with double quotes. Literal double quotes in a name are doubled.

**Examples:**

```
forge://development/                                                            ← KB root
forge://development/big-project/                                               ← folder
forge://development/big-project/TODO.todolist.doc                              ← KB artifact
forge://development/big-project/TODO.todolist.doc#W1                           ← block
forge://kb/public/TODO.todolist.doc#section:Normale#item:W1                    ← nested block
forge://kb/public/INDEX.doc.md#section:Session-Bootstrap                       ← nested block
forge://commwise:production/bloc.commwise:layout                               ← namespaced root + type
forge://commwise:afr:data/rapport.commwise:afr:doc-rse                         ← chained namespace
```

### FAL parsing

Forge is the sole authority on FAL syntax. It parses FAL strings into `ArtifactRef` at the MCP boundary, splitting on the first `.` to separate artifact name from type:

```
forge://development/kb/public/INDEX.md
→ ArtifactRef { root: "development", path: "kb/public/", name: "INDEX", type: "md" }

forge://development/kb/public/Plan.doc.md
→ ArtifactRef { root: "development", path: "kb/public/", name: "Plan", type: "doc.md" }
```

The type registry maps `type` to a handler. The root registry maps `root` to a `UrlRef`. Neither registry parses FAL strings.

### Brand principle

A FAL is only valid if it was issued by Forge — never constructed manually. Forge maintains a Brand registry of all FALs it has emitted. A FAL presented to `forge_read` or `forge_write` that is not in the Brand registry is rejected with a hint:

```
"This FAL was not issued by Forge — call forge_ls to discover existing artifacts, or forge_create to create a new one."
```

This is an application of **Constrain, Don't Forbid** and **Fail Fast, Fail Clear**: the constraint is mechanical (not a rule), and the error message contains its own correction. A manually constructed FAL — even syntactically correct — may carry the wrong type extension, silently routing the operation to the wrong handler and corrupting the artifact structure.

The Brand registry is session-scoped and in-memory. It is updated by:
- `forge_ls` — every artifact and folder FAL returned in a listing
- `forge_create` — the artifact FAL of a newly created artifact

`forge_reload_types` clears the Brand registry entirely — all artifacts must be rediscovered via `forge_ls`.

### Root registry

Defined in registry files loaded at startup. Cannot be changed at runtime.

Each root entry:
- `name` — used in FALs (prefixed with namespace at load time)
- `url` — base URL of the root (the only place a physical path appears)
- `handler` — URL of the root handler JavaScript module

### Type registry

Defined in registry files loaded at startup. Reloadable at runtime via `forge_reload_types`.

Each type entry:
- `name` — dot-separated type hierarchy (`md`, `doc.md`, `convention.doc.md`); prefixed with namespace at load time; injected by the registry before `initType` is called. Read right to left: rightmost segment is the base format, each segment to the left is a specialisation.
- `version` *(recommended)* — handler version; not used by the registry; handlers that need to track format migrations may store it in artifact metadata and compare on load
- `handler` — URL of the type handler JavaScript module
- `description` *(optional)* — short human-readable description of the type, included in `forge_describe` output
- `descriptor` *(optional)* — URL of a JSON descriptor file; passed to `handler.initType(entry)` at startup
- *any other property* — passed as-is to `handler.initType(entry)` at startup; Forge ignores unknown properties

Each library entry:
- `name` — library identifier; injected by the registry before `initLibrary` is called
- `factory` — URL of the library JavaScript module
- *any other property* — passed as-is to `factory.initLibrary(entry)` at startup

## Blocks
[up](#table-of-contents)

Within an artifact, content is organised as a hierarchy of **nodes** and **blocks**.

- A **node** is structural — it contains other nodes or blocks, and holds no data.
- A **block** is a data unit — it holds plain text content and has no children.

This mirrors the folder/artifact distinction at the filesystem level, one level down.

**Key principles:**
- Nodes and blocks are always accessed by full path from the anonymous root, never by position or line number.
- Order among siblings is significant and preserved — both for nodes and blocks within a node.
- `readBlock` reads a block's content. Calling it on a node is an error.
- `writeBlock` writes to a block. Calling it on a node is an error.
- `ls` returns the direct children of a node, with their type (`node` or `block`), in order.
- Content is always plain text.

> Note: unlike folders in the filesystem, the order of children within a node is significant. `ls` always returns children in their declared order.

**The anonymous root `""`** is always present at the top of the hierarchy. It is the entry point for the full managed content of the artifact.

**Hierarchy example — `todolist.doc`:**
```
""                               (anonymous root — node)
  section:High-priority          (## High priority — node)
    item:O1                      (- [ ] [O1] ... — block)
    item:O2                      (block)
  section:Normale                (node)
    item:W1                      (block)
  changelog                      (node)
    entry:"Version 2.5"          (block)
```

**Hierarchy example — `doc.md`:**
```
""                               (anonymous root — node)
  quick-start                    (## Quick Start — block)
  section:Why-Forge-exists       (## Why Forge exists — node)
  section:Key-concepts           (node)
  changelog                      (node)
    entry:"Version 4.0"          (block)
```

**Path examples in FAL:**
```
forge://kb/public/TODO.todolist.doc#section:Normale#item:W1
forge://kb/public/INDEX.doc.md#section:Session-Bootstrap
forge://kb/public/CHANGELOG.doc.md#changelog#entry:"Version 2.0"
```

**`writeBlock` on nodes:** not allowed. A node contains children — it holds no data. Attempting to write to a node throws an error.

**`forge_is_block`:** returns `true` if the target is a block (writable), `false` if it is a node. Use before writing to avoid errors.

## Root registry
[up](#table-of-contents)

The root registry manages folder navigation and storage access. It is the sole authority on URL syntax — URLs never leave the root registry. All external communication uses `UrlRef` objects.

**Root handlers** implement `IRootRegistry` for a specific storage backend (filesystem, database, archive, etc.). A root handler is the only component that knows how to translate between `UrlRef` and a physical URL.

### IRootRegistry

The interface exposed by the root registry to the type registry and type handlers. Operations are expressed in `UrlRef` — no URLs, no FALs.

```js
// Artifact CRUD
rootRegistry.create(ref)              // UrlRef → void; error if already exists
rootRegistry.read(ref)                // UrlRef → content (string)
rootRegistry.write(ref, content)      // UrlRef → void; error if does not exist
rootRegistry.delete(ref)              // UrlRef → void
```

### Folder navigation

Folder operations are between Forge and the root registry directly — the type registry and type handlers are not involved.

```js
// Called by Forge only
rootRegistry.list(ref)                // UrlRef → { folders: UrlRef[], artifacts: UrlRef[] }
rootRegistry.mkdir(ref)               // UrlRef → void
rootRegistry.rmdir(ref)               // UrlRef → void; error if not empty
rootRegistry.mvdir(ref, targetRef)    // UrlRef → void; error across roots
rootRegistry.rndir(ref, name)         // UrlRef → void; error if target name exists
```

**`list(ref)` contract:**

Returns an ordered result as defined by the storage backend. `folders` are entries where `isFolder` is true; `artifacts` are entries where `isFolder` is false and a `UrlRef` can be constructed. Order is preserved but not semantically significant — unlike node children within an artifact.

**Exceptions:**
- `rmdir` on a non-empty folder → error. An `undefined` artifact inside cannot be deleted.
- Any operation on a `UrlRef` outside the root → error.
- Move across roots → not supported.

## Type discovery
[up](#table-of-contents)

When the root registry returns artifact `UrlRef` entries from `list()`, Forge passes each to the type registry for discovery. The type registry runs discovery in two phases.

**Phase 1 — claim:**

The type registry calls `claim(urlRef, rootRegistry)` on all registered type handlers. Within a type hierarchy, the registry respects the order from most specific to least specific (`convention.doc.md` before `doc.md` before `md`) and **stops as soon as one handler claims the `UrlRef`** — more general handlers in the same hierarchy are not called. Hierarchies that are independent of each other are all evaluated.

The hierarchy order is derived from the type names — a type name is split on `.` and longer names (more segments) are more specific. Read right to left: `md` is the base; `doc.md` specialises it; `convention.doc.md` specialises further. No explicit `extends` declaration is needed. The namespace prefix is stripped before computing hierarchy order.

Claim logic is entirely the handler's responsibility. A handler may inspect the `UrlRef` extension, the name, or the artifact content (shebang) via `rootRegistry.read(urlRef)`. `claim` may be async — the type registry always awaits its result. Examples:

- `md` — claims any `UrlRef` with extension `.md` unconditionally. Called last among `*.md` types.
- `doc.md` — claims `.md` files containing a specific shebang (e.g. `*Document type:*`). Reads the file via `rootRegistry.read()`. Called before `md` in the hierarchy.
- `todolist.doc` — claims `UrlRef` with name exactly `TODO` and extension `.doc`. No file read needed.

If two independent handlers could both claim the same `UrlRef`, one solution is to introduce a shebang to distinguish them; another is to place one inside the hierarchy of the other.

**Phase 2 — outcome:**

- Exactly 1 claim → artifact typed; type registry builds an `ArtifactRef` from the `UrlRef` and the handler's type name.
- 0 claims → artifact assigned the built-in `undefined` type. It exists in the hierarchy (it can be listed) but no operation is possible on it. It cannot be read, written, moved, or deleted. A folder containing an `undefined` artifact cannot be deleted.
- >1 claims → error. Forge reports all claiming handlers.

## Type handlers
[up](#table-of-contents)

A type handler is a JavaScript module that manages artifacts and their block structure for a specific type. It is the executable form of a convention — conformance becomes automatic through the handler interface.

Forge never calls a type handler directly. All calls go through the type registry.

Type handlers are **storage-agnostic** — they access storage exclusively through `IRootRegistry`. Whether the backend is a filesystem, a database, or an archive is invisible to the handler.

**Interface:**
```js
export const type = 'doc.md';
export const version = '1.0';  // recommended — not used by the registry

// Called once per type name at startup (and on forge_reload_types).
// entry = { name, handler, description?, version?, ...all other properties from the registry JSON }
// name is always injected by the registry before initType is called.
//
// Two patterns:
//   Factory pattern     — return a handler object with a closure on the type config.
//                         The type registry uses the returned object as the handler.
//                         Use when one module serves multiple types (e.g. structured-text.js).
//   Side-effect pattern — return undefined; configure shared module state.
//                         The type registry uses the module itself as the handler.
//                         Avoid when multiple types share the same module (state collision).
export async function initType(entry)
  // Factory:      return { claim, describe, readBlock, writeBlock, ... }
  // Side-effect:  return undefined (or omit return)

// Called once per library name at startup (and on forge_reload_types).
// entry = { name, factory, ...all other properties from the registry JSON }
// name is always injected by the registry before initLibrary is called.
// Returns an array of type entries — each registered as if declared directly in `types`.
// name is injected into each returned entry before its handler's initType is called.
// A module may export both initType and initLibrary — they serve different registry sections.
export async function initLibrary(entry)
  // return [ { name, handler, ... }, { name, handler, ... }, ... ]

// Type discovery
export async function claim(urlRef, rootRegistry)
  // return true if this handler manages this UrlRef
  // may be async — always awaited by the type registry
  // may call rootRegistry.read(urlRef) to inspect content (shebang, etc.)

// Type description — RTFM principle (optional — Registry provides default if absent)
export async function describe(urlRef, rootRegistry)
  // return { recognition, capabilities, usage }

// Artifact CRUD
export async function createArtifact(urlRef, rootRegistry)
  // create new artifact; error if already exists
export async function deleteArtifact(urlRef, rootRegistry)
export async function moveArtifact(urlRef, targetUrlRef, rootRegistry)
  // within the same root only
export async function renameArtifact(urlRef, name, rootRegistry)

// Block operations — block arguments are always full paths from the root block ""
export async function ls(urlRef, node="", rootRegistry)
  // list one level of children under a node — returns { name, type: "node"|"block" }[], in order
export async function isBlock(urlRef, block, rootRegistry)
  // returns true if the target is a block (writable), false if it is a node
export async function readBlock(urlRef, block, rootRegistry)
  // read a block's content — error if target is a node
export async function writeBlock(urlRef, block, content, rootRegistry)
  // replace a block's content — error if target is a node or artifact absent
export async function insertBlock(urlRef, node, name, type, position, rootRegistry)
  // insert a new named node or block inside a node
  // node     — path of the parent node ("" = artifact root)
  // name     — name of the new element
  // type     — "node" or "block"
  // position — insertion index (0 = first, omit = append)
  // two siblings may share the same name
export async function appendBlock(urlRef, block, content, rootRegistry)
  // append text to a block's own content
export async function deleteBlock(urlRef, block, rootRegistry)
  // delete a block and its children
```

**`initType(entry)` contract — factory vs side-effect:**

Called once per type name at startup, after the handler module is imported. Also called on `forge_reload_types`. Receives the full registry entry object — all properties from the JSON, with `name` injected by the registry. `version` is included if declared in the JSON.

**Factory pattern** (preferred when one module serves multiple types): `initType` returns a handler object — a plain object or closure containing `claim`, `describe`, `readBlock`, `writeBlock`, and so on. The type registry uses this object as the handler for the type. Each type gets its own handler object with its own closure — no shared mutable state between types.

**Side-effect pattern** (acceptable for single-type modules): `initType` configures module-level state and returns `undefined`. The type registry falls back to using the module itself as the handler. Safe only when the module is registered under exactly one type name.

The type registry resolves the handler as:
```js
const result  = mod.initType ? await mod.initType({ name: typeName, ...entry }) : undefined;
const handler = (result && typeof result === 'object') ? result : mod;
```

`initType` is optional. Handlers that need no configuration (e.g. plain-text) do not export it — the module is used directly.

**`initLibrary(entry)` contract:**

Called once per library name at startup, also called on `forge_reload_types`. Receives the full library entry object with `name` injected. Returns an array of type entries — each a plain object `{ name, handler, ...props }`. The registry registers each entry exactly as if it had been declared in `types`, then calls `initType` on each entry's handler normally. `name` is injected into each returned entry before its handler's `initType` is called.

A module may export both `initType` and `initLibrary` — a library module that also exposes a handler for a base type, for example. The registry section (`types` vs `libraries`) determines which function is called.

Nesting: a library may itself return entries whose handlers also export `initLibrary` — the registry handles them recursively, applying the namespace prefix at each level. This is the implementer's responsibility to design; the registry imposes no depth limit.

If `entry.descriptor` is present, it is a `file://` URL pointing to a JSON file — the handler loads it to complete its configuration. This allows descriptors that are too large or too structured to be inlined in the registry JSON.

**Handler versioning:** `version` in the JSON entry is recommended but not enforced by the registry. It is passed to `initType(entry)` as-is. Handlers that need to manage format migrations may store the version in artifact metadata and compare on load — that logic is entirely the handler's responsibility.

**`createArtifact` / `writeBlock` contract:**

- `createArtifact(urlRef, rootRegistry)` — creates the artifact via `rootRegistry.create(urlRef)`. Throws if it already exists. Use `forge_create` before any `forge_write`.
- `writeBlock(urlRef, block, content, rootRegistry)` — writes content to an existing artifact. Throws if the artifact does not exist: *"File does not exist — call forge_create first"*. This prevents `forge_write` from silently creating files.

**`describe(urlRef, rootRegistry)` — Template Method pattern:**

`describe()` is optional. The type registry provides a default implementation (Template Method pattern — the registry is the abstract base, handlers are concrete subclasses). A handler overrides `describe()` only when it has richer semantics to expose than the default.

Return format:
```js
{
  recognition: "A FAL ending with .<type> is ...",  // always starts with this sentence
  capabilities: { read: true, write: true, blocks: false },
  usage: "forge_read(fal) ... forge_write(fal, content) ..."
}
```

**`recognition` rule:** the first sentence always starts with *"A FAL ending with `.<type>` …"*. This is the self-referential anchor — an AI reading this description can match it against any FAL it encounters, without any external knowledge of the type system.

**`ls(urlRef, node="", rootRegistry)` contract:**

Returns an ordered list of direct children of `node` — one level only. Each entry is `{ name, type: "node"|"block" }`. Order is significant and preserved. Names are complete paths from the artifact root, directly reusable as arguments to any block operation. Default `node=""` lists the top-level children of the artifact.

**`insertBlock` rules:**
- `node` — full path of the parent node from the artifact root (`""` = artifact root).
- `name` — name of the new element. Siblings may share the same name.
- `type` — `"node"` or `"block"`. Declared at creation, not inferred later.
- `position` — insertion index among siblings (0 = first). Omit to append.

**`writeBlock` on nodes:** not allowed — nodes hold no data. Only blocks may be written to.

**Exceptions:**
- Any block operation on a non-existent block → error.
- `writeBlock` on a non-existent artifact → error (use `forge_create` first).
- `createArtifact` on an already-existing artifact → error.
- `deleteArtifact` on an `undefined` artifact → error.
- `moveArtifact` across roots → error.

## Registry
[up](#table-of-contents)

The registry layer is the only interface between Forge and the handlers. Forge never calls a handler directly — it calls a registry, which dispatches to the appropriate handler internally.

There are two registries with complementary responsibilities:
- **Root registry** — storage authority; manages folder navigation; implements `IRootRegistry`
- **Type registry** — typing authority; maps `extension ↔ type`; converts `UrlRef ↔ ArtifactRef`; dispatches block operations to handlers via `IRootRegistry`

### Type registry

The type registry manages all artifact operations. It is loaded at startup from registry files (see Namespaces). It receives `ArtifactRef` from Forge and translates them to `UrlRef` before calling handlers.

**Core responsibility — extension ↔ type mapping:**

The type registry maintains two hashmaps:
- `typeName → handler` — dispatch by type (O(1))
- `extension → handler` — dispatch for discovery (via `claim()`)

The conversion `ArtifactRef ↔ UrlRef` is trivial once the handler is known: `root`, `path`, and `name` are identical in both; only `type` (ArtifactRef) and `extension` (UrlRef) differ, and the handler knows both.

```js
// ArtifactRef → UrlRef
{ root, path, name, type } → { root, path, name, extension: handler.extension }

// UrlRef → ArtifactRef  (after claim)
{ root, path, name, extension } → { root, path, name, type: handler.type }
```

**Internal structure:**

At startup, the type registry builds a hashmap: `typeName → { handler, described }`. Type names in the hashmap carry their full namespace prefix (`commwise:layout`). The `described` flag is `false` at startup and set to `true` by `typeRegistry.describe()` — it tracks whether the AI has called `forge_describe` for this type in the current session. The type hierarchy order (for `claim()` dispatch) is derived from the local type name (prefix stripped) — names are split on `.` and sorted by descending segment count (more segments = more specific). No explicit ordering configuration is needed.

**Handler initialisation:** after importing a handler module, the type registry injects `name` into the entry and resolves the handler object:

For entries in `data.types`:
```js
const result  = mod.initType ? await mod.initType({ name: typeName, ...entry }) : undefined;
const handler = (result && typeof result === 'object') ? result : mod;
```

For entries in `data.libraries`:
```js
const entries = await mod.initLibrary({ name: libraryName, ...entry });
// each returned entry is then processed as a data.types entry
```

If `initType` returns an object (factory pattern), that object is stored as the handler. If `initType` returns `undefined` or is absent, the module itself is stored.

**Loading algorithm** — `types` and `libraries` are processed in JSON declaration order:
```
function loadRegistry(file, prefixSoFar):
  data = readJSON(file)

  for each entry in data.roots:
    finalName = prefixSoFar + entry.name
    rootRegistry.register(finalName, entry)        // collision → startup error

  for each [name, entry] in data.types:            // object: name is the key
    finalName = prefixSoFar + name
    entry.name = finalName                         // inject name before initType
    typeRegistry.register(finalName, entry)        // collision → startup error

  for each [name, entry] in data.libraries:        // object: name is the key
    entry.name = prefixSoFar + name                // inject name before initLibrary
    mod = import(entry.factory)
    typeEntries = await mod.initLibrary(entry)     // returns array of type entries
    for each typeEntry in typeEntries:
      finalName = prefixSoFar + typeEntry.name
      typeEntry.name = finalName                   // inject name before initType
      typeRegistry.register(finalName, typeEntry)  // collision → startup error

  for each namespace in data.namespaces:
    childPrefix = prefixSoFar + namespace.name + ":"
    if namespace.roots:
      loadRegistry(namespace.roots, childPrefix)
    if namespace.types:
      loadRegistry(namespace.types, childPrefix)
```

**Reload:** `forge_reload_types` re-runs `loadRegistry` from `forge.config.json` for the types file only (roots are not reloaded). The Brand registry is cleared entirely. The `described` flags are reset. If the reload produces a collision or any startup error, the previous registry is restored and the error returned — Forge remains operational.

**Collision check:** if two entries share the same final name in the hashmap → startup error (or reload error). This applies to both roots and types (including types generated by libraries).

**API exposed to Forge:**

```js
// Discovery — UrlRef → ArtifactRef (called by Forge during forge_ls)
typeRegistry.discover(urlRef, rootRegistry)         → ArtifactRef

// Type description — RTFM principle
typeRegistry.describe(ref)                          → { recognition, capabilities, usage }
                                                    // sets described=true for the type

// Artifact operations — all take an ArtifactRef
// All throw if FAL not in Brand registry — Brand gate (checked first)
// All throw if described=false for the type — RTFM gate (checked second)
typeRegistry.read(ref, block?)                      → content
typeRegistry.write(ref, block, content)
typeRegistry.ls(ref, node?)                         → { name, type: "node"|"block" }[]
typeRegistry.isBlock(ref, block)                    → boolean
typeRegistry.deleteArtifact(ref)
typeRegistry.deleteBlock(ref, block)
typeRegistry.createArtifact(ref)
```

**Brand gate:** checked first on all artifact operations. If the FAL (reconstructed from `ArtifactRef`) is not in the Brand registry, throws: `"This FAL was not issued by Forge — call forge_ls to obtain a valid FAL."`

**RTFM gate:** checked second. If `described` is `false` for the type, throws: `"Call forge_describe(fal) first — RTFM: no read or write before the type is understood."`

**Default `describe()` implementation (Template Method):** if the handler does not export `describe`, the registry generates a default description from the type name:
```js
{
  recognition: `A FAL ending with .${typeName} is a plain-text file — full file access only, no named blocks.`,
  capabilities: { read: true, write: true, blocks: false },
  usage: `forge_read(fal) returns the entire file content. forge_write(fal, content) replaces the entire file.`
}
```

**Dispatch mechanism** (same for all artifact operations):
1. Reconstruct FAL string from `ArtifactRef` for Brand check
2. Check Brand registry — throw if FAL not registered (Brand gate)
3. Check `described` flag — throw if `false` (RTFM gate)
4. Look up handler in hashmap by type name — O(1)
5. Convert `ArtifactRef` → `UrlRef` using `handler.extension`
6. Delegate to handler, passing `urlRef` and `rootRegistry`

**`discover(urlRef, rootRegistry)` mechanism:**
1. Call `await claim(urlRef, rootRegistry)` on handlers, most specific first
2. Stop at first claim
3. Build `ArtifactRef`: copy `root`, `path`, `name` from `UrlRef`; set `type` from `handler.type`
4. Prepend namespace prefix to type name
5. Build FAL string from `ArtifactRef`; register in Brand registry
6. Return `ArtifactRef`

### Root registry

The root registry manages folder navigation and implements `IRootRegistry`. It is loaded at startup from registry files (see Namespaces). Each root has exactly one handler — no dispatch needed.

URLs are entirely internal to the root registry. Forge and the type registry communicate with the root registry exclusively via `UrlRef` objects. The root registry translates `UrlRef ↔ URL` internally when calling root handlers.

Folder FALs are derived from `UrlRef` by Forge (`forge://<root>/<path>`) and registered in the Brand registry when emitted by `forge_ls` or `forge_mkdir`.

### Sequence diagrams

**`forge_ls` — folder listing:**

```mermaid
sequenceDiagram
    participant MCP
    participant Forge
    participant RootReg as Root Registry
    participant TypeReg as Type Registry
    participant TypeH as Type Handler

    MCP->>Forge: forge_ls(folderFal)
    Forge->>Forge: FAL → FolderRef
    Forge->>RootReg: list(folderRef)
    RootReg-->>Forge: { folders: UrlRef[], artifacts: UrlRef[] }

    loop each folder UrlRef
        Forge->>Forge: UrlRef → folder FAL string
        Forge->>Forge: register folder FAL in Brand registry
    end

    loop each artifact UrlRef
        Forge->>TypeReg: discover(urlRef, rootRegistry)
        TypeReg->>TypeH: await claim(urlRef, rootRegistry)
        TypeH-->>TypeReg: true
        TypeReg->>TypeReg: build ArtifactRef from UrlRef + handler.type
        TypeReg->>TypeReg: build FAL string; register in Brand registry
        TypeReg-->>Forge: ArtifactRef
        Forge->>Forge: ArtifactRef → FAL string
    end

    Forge-->>MCP: [folder FAL strings..., artifact FAL strings...]
```

**`forge_read` — artifact read (with Brand + RTFM gates):**

```mermaid
sequenceDiagram
    participant MCP
    participant Forge
    participant TypeReg as Type Registry
    participant RootReg as Root Registry
    participant TypeH as Type Handler

    MCP->>Forge: forge_read(fal, block?)
    Forge->>Forge: FAL string → ArtifactRef
    Forge->>TypeReg: read(ref, block?)
    TypeReg->>TypeReg: reconstruct FAL; check Brand registry
    alt FAL not in Brand registry
        TypeReg-->>Forge: throw "This FAL was not issued by Forge"
        Forge-->>MCP: error
    else FAL is branded
        TypeReg->>TypeReg: check described flag (RTFM gate)
        alt described = false
            TypeReg-->>Forge: throw "Call forge_describe(fal) first"
            Forge-->>MCP: error
        else described = true
            TypeReg->>TypeReg: ArtifactRef → UrlRef (handler.extension)
            TypeReg->>TypeH: readBlock(urlRef, block, rootRegistry)
            TypeH->>RootReg: read(urlRef)
            RootReg-->>TypeH: raw content
            TypeH-->>TypeReg: block content
            TypeReg-->>Forge: content
            Forge-->>MCP: content
        end
    end
```

**`forge_describe` — type description:**

```mermaid
sequenceDiagram
    participant MCP
    participant Forge
    participant TypeReg as Type Registry
    participant TypeH as Type Handler

    MCP->>Forge: forge_describe(fal)
    Forge->>Forge: FAL string → ArtifactRef
    Forge->>TypeReg: describe(ref)
    TypeReg->>TypeReg: lookup handler by type name
    alt handler.describe exists
        TypeReg->>TypeH: describe(urlRef, rootRegistry)
        TypeH-->>TypeReg: { recognition, capabilities, usage }
    else no describe on handler
        TypeReg->>TypeReg: generate default description
    end
    TypeReg->>TypeReg: set described=true for type
    TypeReg-->>Forge: { recognition, capabilities, usage }
    Forge-->>MCP: description
```

## Namespaces
[up](#table-of-contents)

A namespace groups roots and types belonging to a project or library. The KB is the default namespace — its roots and types carry no prefix. All other namespaces are declared in registry files and loaded recursively at startup.

### Why namespaces

- **Isolation** — a project's types and roots cannot clash with the KB or another project, even if they share the same local names.
- **Portability** — a namespace registry file is self-contained. It can be promoted to the KB, merged into another namespace, or shared as a standalone library without changing its internal structure.
- **Composability** — a namespace can declare child namespaces, which declare their own, and so on. The loading algorithm is the same at every level — the recursion is the design.

### Namespace declaration

Namespaces are declared inside roots or types registry files using a `namespaces` array. Each entry specifies a namespace name, and optionally a roots registry file, a types registry file, or both.

**roots.json with namespaces:**
```json
{
  "roots": [
    { "name": "production", "url": "...", "handler": "..." }
  ],
  "namespaces": [
    {
      "namespace": "commwise",
      "roots": "file:///commwise/.../roots.json",
      "types": "file:///commwise/.../types.json"
    }
  ]
}
```

**types.json with namespaces:**
```json
{
  "types": {
    "layout": { "version": "1.0", "handler": "..." }
  },
  "namespaces": [
    {
      "namespace": "afr",
      "types": "file:///afr/.../types.json"
    }
  ]
}
```

A namespace entry may omit `roots` or `types` if the namespace only contributes one kind. Both fields are optional, but at least one must be present.

### Loading algorithm

Forge loads namespaces recursively at startup. The algorithm is identical at every level — there is no distinction between root-level and child-level loading. See the Loading algorithm in the Registry section above for the full pseudo-code including `libraries`.

### Prefix rules

- KB (default namespace): no prefix — `md`, `todolist.doc`, `development`
- Direct namespace: `commwise:layout`, `commwise:production`
- Chained namespace: `commwise:afr:doc-rse`, `commwise:afr:data` — parent prefix accumulates

### Collision rule

Two roots or two types with the same final name (after prefix) → **startup error**. Forge does not start. The error message identifies both conflicting entries and their source files.

This is enforced at hashmap insertion time — the check is O(1) per entry and costs nothing at runtime.

### FAL examples with namespaces

```
forge://development/kb/INDEX.md                           ← KB root, KB type (no prefix)
forge://commwise:production/bloc.commwise:layout          ← commwise root, commwise type
forge://commwise:afr:data/rapport.commwise:afr:doc-rse    ← chained namespace root and type
```

### Namespace portability

A namespace registry file has no knowledge of its position in the loading tree. It declares names relative to itself — the prefix is applied externally by the loader. This means:

- A type `layout` in `commwise/types.json` becomes `commwise:layout` when loaded under the `commwise` namespace, and `mylib:commwise:layout` if that namespace is itself nested under `mylib`.
- Moving a namespace from one parent to another only requires updating the `namespace` declaration in the parent — the child files are unchanged.
- Promoting a namespace to the KB means removing the namespace wrapper — its types and roots become unprefixed KB entries.

## Roots and configuration
[up](#table-of-contents)

Forge is a **single shared process** across all projects. There is no per-project instance. Each project lives under a named root, in its own namespace if it defines project-specific roots or types.

**Configuration file:** `public/tools/forge/forge.config.json`

```json
{
  "roots": "file:///C:/Users/RemiLequette/Development/with-claude/knowledgebase/public/tools/forge/roots.json",
  "types": "file:///C:/Users/RemiLequette/Development/with-claude/knowledgebase/public/tools/forge/types.json"
}
```

**KB roots.json** (default namespace, no prefix):
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
  "namespaces": [
    {
      "namespace": "commwise",
      "roots": "file:///C:/Users/RemiLequette/Development/commwise/tools/forge/roots.json",
      "types": "file:///C:/Users/RemiLequette/Development/commwise/tools/forge/types.json"
    }
  ]
}
```

**KB types.json** — `types` and `libraries` are processed in JSON declaration order:
```json
{
  "types": {
    "md": {
      "version": "1.0",
      "handler": "file:///...handlers/structured-text.js",
      "description": "a Markdown document"
    },
    "managed.js": {
      "version": "1.0",
      "handler": "file:///...handlers/structured-text.js",
      "claim":  { "strategy": "shebang", "value": "// @forge-type: managed.js" },
      "blocks": { "separator": { "type": "regex", "pattern": "^// ====\\[ (.+?) \\]====$" } }
    },
    "doc.md": {
      "version": "1.0",
      "handler": "file:///...handlers/structured-text.js",
      "descriptor": "file:///...descriptors/doc.md.json"
    },
    "todolist.doc": {
      "version": "1.0",
      "handler": "file:///...handlers/structured-text.js",
      "descriptor": "file:///...descriptors/todolist.doc.json"
    }
  },
  "libraries": {
    "plain-text-family": {
      "factory": "file:///...factories/plain-text-family.js",
      "extensions": ["txt", "log", "csv"]
    }
  }
}
```

`md` — base Markdown type; `initType` receives `{ name, version, handler, description }`, returns a handler object (factory).
`managed.js` — a JS file with Forge-managed block structure; claimed by shebang; more specific than `js` in the `*.js` hierarchy.
`doc.md` — a structured Markdown document; claimed by shebang; more specific than `md` in the `*.md` hierarchy.
`todolist.doc` — the `TODO` document; claimed by exact filename match.
`plain-text-family` — library; `initLibrary` receives `{ name: "plain-text-family", factory: "...", extensions: [...] }` and returns `[ { name: "txt", handler: "..." }, ... ]`. Each entry registered as a type normally.

Root and type names are short, lowercase, no spaces. URLs are the only place physical paths appear.

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

All tools accept FALs. Folder FALs end with `/`. Block paths use `#`. Namespaced roots and types use `:` as separator. See the FAL section for syntax and quoting rules.

Forge implements each tool by parsing the FAL string into an `ArtifactRef`, then delegating to a registry. No FAL string is passed to any registry or handler.

**Error handling:** Forge wraps the entire tool dispatcher in a single top-level `try/catch`. Any exception thrown by a registry or handler is caught and returned as `{ error: err.message }` with `isError: true`. Tools and handlers must always throw exceptions on error — never return error objects. A tool may add its own `try/catch` only to enrich the error message with context before re-throwing.

**Brand principle:** `forge_read` and `forge_write` (and all block operations) require the FAL to have been issued by Forge. A manually constructed FAL is rejected with `"This FAL was not issued by Forge — call forge_ls to discover existing artifacts, or forge_create to create a new one."` The Brand gate is checked first. FALs are branded by `forge_ls` (existing artifacts) and `forge_create` (new artifacts).

**RTFM principle:** `forge_read` and `forge_write` (and all block operations) require a prior `forge_describe` call for the artifact's type in the current session. The RTFM gate is checked after the Brand gate. Without `forge_describe`, read and write throw `"Call forge_describe(fal) first"`.

**Implemented:**

| Tool | Arguments | Description |
|---|---|---|
| `forge_ping` | — | Connectivity check — returns `pong` and server version |
| `forge_ls` | `fal?` | List one level — unified at all depths. See detailed description below. |
| `forge_describe` | `fal` | Describe the type of an artifact or folder. For artifacts: returns `{ recognition, capabilities, usage }` and sets `described=true` for the type in the session — required before any read or write. For folder FALs: returns a generic folder description without setting any flag. |
| `forge_read` | `fal, block?` | Read a block's own content. Defaults to `""` — full managed content. Requires Brand + RTFM. |
| `forge_create` | `fal` | Create a new empty artifact. Error if it already exists. Brands the FAL — `forge_write` can follow without `forge_ls`. |
| `forge_write` | `fal, block?, content` | Write content to an existing artifact. Error if the artifact does not exist — use `forge_create` first. Plain-text: full file. Structured: named block (must be a block, not a node). Requires Brand + RTFM. |
| `forge_is_block` | `fal#block` | Returns `true` if the target is a block (writable), `false` if it is a node. Requires Brand + RTFM. |
| `forge_delete` | `fal` or `fal#name` | Delete an artifact, or a node/block and its children. Requires Brand + RTFM for intra-artifact targets. |
| `forge_mkdir` | `fal` | Create a folder. Error if it already exists. Issues a branded folder FAL. |
| `forge_rmdir` | `fal` | Delete a folder. Error if not empty. |
| `forge_mvdir` | `fal, target` | Move a folder within the same root. Error if target exists. |
| `forge_rndir` | `fal, name` | Rename a folder in place. Error if target name exists in the same parent. |
| `forge_reload_types` | — | Reload the type registry from disk (types only — roots are not reloaded). Clears the Brand registry and all `described` flags. If the reload produces a collision or any error, the previous registry is restored and the error returned — Forge remains operational. Use to pick up handler or descriptor changes without restarting. |

### forge_ls — detailed description

`forge_ls` is the single navigation tool at all depths. Its behaviour depends on the form of the FAL argument.

**No argument — list roots:**
```
forge_ls()
→ { roots: [ { fal: "forge://development/", folder: true }, { fal: "forge://dropbox/", folder: true } ] }
```
Returns the list of registered roots as folder entries. Always free. No branding.

**Folder FAL — list folder contents:**
```
forge_ls("forge://development/with-claude/knowledgebase/public/")
→ [ { fal: "forge://development/with-claude/knowledgebase/public/conventions/", folder: true },
    { fal: "forge://development/with-claude/knowledgebase/public/INDEX.doc.md",  type: "doc.md" },
    ... ]
```
Returns folders (`{ fal, folder: true }`) and artifacts (`{ fal, type }`) at the target level. Always free — no Brand or RTFM required.

**Deep path shortcut:** pass the full folder FAL directly, even if intermediate levels have never been listed. Forge traverses intermediate folders silently without branding them. Only the entries at the target level are branded and returned. This avoids the cascade of `forge_ls` calls previously required to reach a deep folder.

```
// One call instead of four:
forge_ls("forge://development/with-claude/knowledgebase/public/conventions/")
→ [ { fal: "forge://development/.../conventions/documentation.doc.md", type: "doc.md" }, ... ]
```

Intermediate folder FALs are not registered in the Brand registry — a subsequent `forge_rmdir` on an intermediate folder would require a `forge_ls` at that level first.

**Artifact FAL (no `#`) — list root node:**
```
forge_ls("forge://development/with-claude/knowledgebase/TODO.todolist.doc")
→ [ { name: "section:High-priority", type: "node" },
    { name: "section:Normale",        type: "node" },
    { name: "changelog",              type: "node" } ]
```
Equivalent to `forge_ls(fal#"")` — lists the top-level children of the artifact's root node. Requires Brand + RTFM (the artifact FAL must have been issued by Forge, and `forge_describe` must have been called for its type).

**Artifact FAL with `#node` — list node children:**
```
forge_ls("forge://development/.../TODO.todolist.doc#section:High-priority")
→ [ { name: "section:High-priority#item:O1", type: "block" },
    { name: "section:High-priority#item:O2", type: "block" } ]
```
Lists the direct children of the named node. Returns `{ name, type: "node"|"block" }[]` in order. Names are full paths from the artifact root — directly usable as block arguments to `forge_read`, `forge_write`, `forge_is_block`. Requires Brand + RTFM.

**Why the asymmetry between folder and artifact/node listing:**
Folder navigation is type-independent and always safe — Forge traverses folders without loading any handler. Artifact and node listing is type-specific — the handler's `ls()` method is called, which may parse content, enforce structure, and return type-aware names. The Brand gate on artifact FALs protects against type falsification: a FAL where the type extension was manually set to the wrong value would route the `ls` call to the wrong handler, potentially misinterpreting the artifact's content. Folders carry no type and are not subject to this risk.

**Planned — artifacts:**

| Tool | Arguments | Description |
|---|---|---|
| `forge_move` | `fal, target` | Move an artifact within the same root |
| `forge_rename` | `fal, name` | Rename an artifact |

**Planned — blocks:**

| Tool | Arguments | Description |
|---|---|---|
| `forge_insert` | `fal#node, name, type, position?` | Insert a new node or block inside a node. `type`: `"node"` or `"block"`. `position`: index (0 = first, omit = append). |
| `forge_append` | `fal#block, content` | Append text to a block's content. |

**Planned — registry:**

| Tool | Arguments | Description |
|---|---|---|
| `forge_types_list` | — | List all registered types with their namespace |
| `forge_types_get` | `type` | Get a type definition and handler version |
| `forge_types_check` | — | Report types whose handler version differs from the version declared in the registry |
| `forge_roots_list` | — | List all registered roots with their namespace |

## Roadmap
[up](#table-of-contents)

**Near term:**
- `handler-lib.js` — shared library for type handlers: `loadDescriptor`, `makeClaim`, `makeDescribe`, `makeHandler`
- `managed.js` type — shebang claim + block parsing via regex separator; validates descriptor mechanism
- Register first real types: `doc.md`, `todolist.doc`
- Implement remaining artifact CRUD: `forge_delete`, `forge_move`, `forge_rename`
- Implement block CRUD: `forge_append`, `forge_insert`
- Registry viewer — HTML tool browsing roots, types, namespaces, and artifacts via Forge

**Medium term:**
- Absorb `local-server` — single process for MCP interface and static HTTP layer
- `md-doc` tool absorbed as handler logic for `doc.md` type

**Long term:**
- `filesystem` MCP disabled in all project instructions

## Index

| Term | Occurrences |
|------|-------------|

## Changelog

### Version 8.1 - forge_describe accepte les folder FALs
**Date:** 2026-06-08
**Reason:** Spirit of MCP — tools should be self-describing. A client should not need to know in advance whether a FAL is a folder or artifact before calling describe. forge_describe on a folder FAL now returns a generic folder description instead of throwing.

**Modifications:**
- MCP tools / forge_describe : description mise à jour — folder FAL accepte et retourne une description générique, sans modifier le flag described

---

### Version 8.0 - folder: true au lieu de type: 'folder'
**Date:** 2026-06-08
**Reason:** Les folder entries dans forge_ls retournent `{ fal, folder: true }` et non `{ fal, type: 'folder' }`. Un dossier n'a pas de type Forge — `folder: true` est une propriété discriminante distincte. Alignement spec sur le code.

**Modifications:**
- forge_ls / No argument : format de retour mis à jour — `{ roots: [{ fal, folder: true }] }`
- forge_ls / Folder FAL : format de retour mis à jour — `{ fal, folder: true }` pour les dossiers
- forge_ls / Folder FAL : description mise à jour — `folders ({ fal, folder: true }) and artifacts ({ fal, type })`

---

### Version 7.9 - forge_create brands; forge_mkdir ne brande plus; message d'erreur corrigé
**Date:** 2026-06-08
**Reason:** forge_create était le cas manquant de branding : après un create, forge_write doit pouvoir suivre sans forge_ls. forge_mkdir ne brandait qu'un dossier FAL — inutile, on n'écrit jamais directement sur un dossier. Message Brand mis à jour pour mentionner forge_create.

**Modifications:**
- Brand principle : liste des sources de branding — forge_ls + forge_create (forge_mkdir retiré)
- Brand principle : message d'erreur corrigé — `call forge_ls to obtain a valid FAL` → `call forge_ls to discover existing artifacts, or forge_create to create a new one`
- MCP tools / Brand principle : même correction du message + sources de branding
- MCP tools / forge_create : description mise à jour — "Brands the FAL — forge_write can follow without forge_ls"

---

### Version 7.8 - Dot-separated type hierarchy
**Date:** 2026-06-08
**Reason:** Type names now use `.` as hierarchy separator instead of `-`. Read right to left: rightmost segment is the base format, each segment to the left is a specialisation. `doc.md` is a more specific `md`; `convention.doc.md` is more specific still. This matches the natural reading order of file extensions and eliminates the ambiguity that led LLMs to confuse `js-managed` with an unrelated `js` type. `-` becomes an ordinary character within a type segment. Simultaneously: the FAL name/type separator is now explicitly documented as the first `.` in the filename, and the no-dot-in-artifact-names constraint is stated as an intentional Forge design rule.

**Modifications:**
- Key concepts / Type: hierarchy description updated — `.` separator, right-to-left reading, examples updated (`convention.doc.md` before `doc.md` before `md`)
- FAL syntax: `<artifact-name>.<type-name>` note updated — "first `.`" rule made explicit; filename constraint paragraph added
- FAL parsing: example updated — `Plan.doc.md` parsing shown
- FAL examples: `TODO.doc-todolist` → `TODO.todolist.doc`, `INDEX.doc` → `INDEX.doc.md`
- Type registry entry: `name` description updated — dot-separated hierarchy, right-to-left reading
- Type discovery: hierarchy examples updated — `convention.doc.md`/`doc.md`/`md`; split on `.`; `md-*` → `*.md`; claim examples updated
- Registry / Type registry / Internal structure: split on `.` documented
- Blocks / Hierarchy examples: `doc-todolist` → `todolist.doc`, `doc` → `doc.md`; FAL path examples updated
- Roots and configuration: `types.json` example updated — `js-managed` → `managed.js`, `md-doc` → `doc.md`; `todolist.doc` added; prose updated
- Namespaces / Prefix rules: `doc-todolist` → `todolist.doc`
- MCP tools / forge_ls: examples updated — `INDEX.doc.md`, `TODO.todolist.doc`
- Roadmap: `js-managed` → `managed.js`, `md-doc` → `doc.md`, `doc-todolist` → `todolist.doc`
- Why Forge exists: example FAL updated

---

### Version 7.7 - initType/initLibrary + forge_reload_types + forge_ls deep path
**Date:** 2026-06-08
**Reason:** Three improvements in the same design session. (1) `init()` split into `initType()` and `initLibrary()` — same module can export both, registry section determines which is called, no Array.isArray needed. (2) `forge_reload_types` added — reloads type registry from disk, clears Brand registry and described flags, non-fatal on error. (3) `forge_ls` folder FAL now accepts deep paths — intermediate folders traversed silently, only target level branded; artifact FAL without `#` lists root node; detailed return format documented for each form; asymmetry between folder and artifact/node listing explained.

**Modifications:**
- Keywords: `init` replaced by `initType`, `initLibrary`; `reload` added
- Key concepts: `Descriptor` and `Library` updated — `init` → `initType`/`initLibrary`
- FAL section / Brand principle: note on `forge_reload_types` clearing the Brand registry added
- FAL section / Type registry: `initType`/`initLibrary` replace `init`; `"Cannot be changed at runtime"` → `"Reloadable via forge_reload_types"`
- Type handlers / Interface: `init()` replaced by `initType()` and `initLibrary()` with full contracts
- Type handlers / contracts: renamed and split — `initType` (factory + side-effect), `initLibrary` (array return, nesting, name injection)
- Registry / Type registry / Internal structure: handler initialisation code split; `Array.isArray` branch removed
- Registry / Type registry / Loading algorithm: `mod.init` → `mod.initLibrary`
- Registry / Type registry: Reload paragraph added
- MCP tools / Implemented: `forge_reload_types` added; `forge_ls` points to detailed section
- MCP tools / forge_ls detailed description: new section — four forms with return format and asymmetry rationale

---

### Version 7.6 - Library pattern for type registry
**Date:** 2026-06-08

---

### Version 7.5 - forge_ls unified + ls() handler method
**Date:** 2026-06-07

---

### Version 7.4 - Node/block vocabulary
**Date:** 2026-06-07

---

### Version 7.3 - Block write restricted to leaf nodes
**Date:** 2026-06-07

---

### Version 7.2 - Factory pattern for init(entry)
**Date:** 2026-06-07

---

### Version 7.1 - init(entry) mechanism + claim async
**Date:** 2026-06-07

---

### Version 7.0 - ArtifactRef, UrlRef, IRootRegistry — clean architecture
**Date:** 2026-06-07

---

### Version 6.5 - forge_create implemented; forge_write requires existing file
**Date:** 2026-06-07

---

### Version 6.4 - Brand principle
**Date:** 2026-06-07

---

### Version 6.3 - RTFM principle + forge_describe
**Date:** 2026-06-07

---

### Version 6.2 - Folder CRUD implemented
**Date:** 2026-06-07

---

### Version 6.1 - Top-level error handler
**Date:** 2026-06-07

---

### Version 6.0 - Namespace model
**Date:** 2026-06-07

---

### Version 5.0 - Registry API and sequence diagrams
**Date:** 2026-06-06

---

### Version 4.0 - Handler interfaces, block model, config fully specified
**Date:** 2026-06-06

---

### Version 3.0 - Root handler, type handlers, type discovery rewritten
**Date:** 2026-06-06

---

### Version 2.0 - FAL, key concepts, type model, support model
**Date:** 2026-06-06

---

### Version 1.0 - Creation
**Date:** 2026-06-06
**Reason:** Forge designed and proto implemented in session "death to filesystem".
