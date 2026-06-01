# CommWise Framework Convention

## Quick Start
Convention for projects built on the CommWise platform following the Modular Architecture Convention.
Requires the **CommWise MCP tool** — all module read/write operations go through it.
Covers the framework folder layout, the CommWise block model, module assembly, and source synchronisation via a correspondence file.
Load when reading or writing CommWise blocks, assembling modules, or synchronising `src/` with a CommWise app.
See `conventions/modular-architecture.md` for the architecture concepts (Core, IService, Assembly, Framework) this convention implements.

## Keywords
commwise, framework, MCP, blocks, script, style, div, assembly, synchronisation, correspondence-file, session, pull, push

## Table of Contents

1. [1 - Required Tool](#1---required-tool)
2. [2 - Framework Folder](#2---framework-folder)
3. [3 - Block Model](#3---block-model)
4. [4 - Module Registry Fields](#4---module-registry-fields)
5. [5 - Assembling Modules](#5---assembling-modules)
6. [6 - Source Synchronisation](#6---source-synchronisation)
7. [7 - CommWise Best Practices](#7---commwise-best-practices)
8. [Index](#index)

## 1 - Required Tool
[up](#table-of-contents)
**This framework convention requires the CommWise MCP tool.** All read and write operations on CommWise blocks are performed exclusively through it. No manual copy-paste, no other tool.

Key MCP operations used by this convention:

| Operation | MCP call |
|---|---|
| List blocks in an app | `commwise_list_blocks` |
| Read a block | `commwise_get_block` |
| Partial edit (surgical) | `commwise_replace_text` |
| Full block rewrite | `commwise_update_block` |
| Insert a new block | `commwise_insert_block` |
| Open a write session | `commwise_start_session` |

Every write operation requires an open session — see section 7.

## 2 - Framework Folder
[up](#table-of-contents)
A project using this framework places its CommWise-specific artifacts under:

```
src/frameworks/commwise/
  sync-tracker.md    # Correspondence file — maps src/ modules to CommWise block addresses
```

The correspondence file is the only mandatory artifact. It tracks the synchronisation state between the local `src/` working copy and the deployed CommWise blocks.

If the project has no `src/` working copy (all development done directly in CommWise), the correspondence file is not required.

## 3 - Block Model
[up](#table-of-contents)
CommWise stores each module as a **block**. The mapping from Core module types to CommWise block types is direct:

| Core module type | CommWise block type |
|---|---|
| `script` | `SCRIPT` |
| `style` | `STYLE` |
| `div` | `DIV` |

Each block has:
- A **type** — `SCRIPT`, `STYLE`, or `DIV`
- A **position** — integer; defines load order (lower = earlier)
- A **title** — human-readable label; recommended pattern: `JS: MODULE_NAME — description` for scripts

Block position is the framework-level identifier for a module. It is the value recorded in the project Module Registry (`block` field) and in the correspondence file.

## 4 - Module Registry Fields
[up](#table-of-contents)
Each module entry in the project Module Registry (`{ProjectName}_Modules.md`) must include two CommWise-specific fields:

| Field | Value | Example |
|---|---|---|
| `block` | CommWise block address — type + position | `SCRIPT 150` |
| `file` | Path of the extracted source file in `src/` | `src/DDS_STORE.js` |

The `block` field is the correspondence key between the Module Registry and the CommWise app. The `file` field is the correspondence key between the Module Registry and the local `src/` working copy.

Example module entry header:

```
global:   DDS_STORE
block:    SCRIPT 150
file:     src/DDS_STORE.js
```

## 5 - Assembling Modules
[up](#table-of-contents)
CommWise assembles the application by loading all blocks in position order. There is no explicit build step — the page is reconstructed at runtime from the ordered block sequence.

### Load order rule

Block positions determine execution order. When adding or inserting a module:
1. Call `commwise_list_blocks` to inspect existing positions before inserting.
2. Choose a position that respects the module's declared dependencies (dependencies must load before dependents).
3. Verify there is no position conflict with an existing block.

### Adding a new module

```
1. commwise_list_blocks — check positions around the intended slot
2. commwise_insert_block — with title, type, and content
3. Update the project Module Registry — add block and file fields
4. Update the correspondence file — add the new row
```

### Removing a module

Removing a block from CommWise does not automatically update the Module Registry or the correspondence file. Both must be updated in the same operation.

## 6 - Source Synchronisation
[up](#table-of-contents)
The correspondence file (`src/frameworks/commwise/sync-tracker.md`) maps each source file to its CommWise block and tracks synchronisation state.

### Correspondence file format

Minimum required columns:

| Column | Content |
|---|---|
| `File` | Path of the source file in `src/` |
| `CommWise block` | Block address — type + position (e.g. `SCRIPT 150`) |
| `Dirty` | `YES` / `NO` / `NEW` — local changes not yet pushed |
| `Last operation` | `PULL` or `PUSH` |
| `Date` | Date of last operation |

Additional columns (revision ID, app version, testability) are recommended for traceability but not mandatory.

### PULL — extract from CommWise into src/

Copies a block's content from CommWise into the local `src/` working copy.

```
1. Look up the module in the Module Registry — confirm block address
2. commwise_get_block (code_type matching block type, position as integer)
3. Write or overwrite the file in src/
4. Update correspondence file: Dirty = NO, Last operation = PULL, Date = today
```

### PUSH — write from src/ to CommWise

Writes a locally modified source file back to CommWise.

```
1. Look up the module in the Module Registry — confirm block address and eligibility
2. commwise_get_block — read current live block; confirm intended diff with user
3. commwise_start_session
4. commwise_replace_text (surgical) or commwise_update_block (full rewrite)
   — final write must include create_revision: true + release_notes
5. commwise_get_block — re-read and verify content matches what was pushed
6. Update correspondence file: Dirty = NO, Last operation = PUSH, Date = today
```

### Dirty states

| Value | Meaning |
|---|---|
| `NO` | Source file and CommWise block are in sync |
| `YES` | Source file has local changes not yet pushed to CommWise |
| `NEW` | Source file created locally; no CommWise block exists yet |

## 7 - CommWise Best Practices
[up](#table-of-contents)
Best practices for all CommWise write operations, regardless of assembly or synchronisation context.

### Session lifecycle

Every write requires an open session. No write call is valid outside of one.

```
commwise_start_session → write calls (pass session_id) → final write: create_revision: true
```

The final write in every session must include:

```json
{
  "create_revision": true,
  "metadata": {
    "release_notes": "...",
    "append_release_notes": true
  }
}
```

### Editing strategy

**Prefer `commwise_replace_text` (surgical)** for all partial modifications to an existing block.
- `find_text` must match the source exactly — indentation and surrounding context included.
- Fails silently when `find_text` exceeds ~5000 characters → fall back to `commwise_update_block`.

**Use `commwise_update_block` (full rewrite)** only when the target diff is too large for `commwise_replace_text` or when the block needs a structural rewrite.

### Inserting blocks

Always call `commwise_list_blocks` with `section_filter` before inserting to detect position conflicts.

### Known trap — regex and newlines

CommWise interprets `\n` in `replace_text` payloads as real newlines. JS regex literals containing `\n` are corrupted on write.

**Fix:** decompose the regex or build it via `new RegExp()` with `'\\n'` as a string. Never pass a literal `\n` inside a regex pattern through `replace_text`.

## Index

| Term | Occurrences |
|------|-------------|

## Changelog

### Version 1.0 - Creation
**Date:** 2026-06-01
**Reason:** CommWise framework convention extracted from DDScope project docs and written as a reusable KB-level convention. Content sourced from DDScope_CommWise.md (best practices) and DDScope_Framework_CommWise.md (block model, assembly) and DDScope_Assemblies.md (framework concept).

**Contents:**
- Section 1: Required Tool — CommWise MCP, key operations
- Section 2: Framework Folder — `src/frameworks/commwise/` layout
- Section 3: Block Model — Core type to CommWise block type mapping
- Section 4: Module Registry Fields — `block` and `file` fields
- Section 5: Assembling Modules — load order, add/remove
- Section 6: Source Synchronisation — correspondence file format, PULL/PUSH procedures, dirty states
- Section 7: CommWise Best Practices — session lifecycle, editing strategy, insert trap, regex trap
