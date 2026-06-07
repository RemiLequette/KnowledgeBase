# Working with Forge

Operational guide for AI Assistants — how to navigate, read, and write artifacts using the Forge MCP server.

*Document type: Guide*

## Quick Start

This guide is the entry point for any AI Assistant using Forge in a session.
It covers what a FAL is, the RTFM workflow (describe before read or write), and when to use each tool.
Load at session start whenever Forge tools are available.

## Keywords
forge, FAL, forge_describe, forge_read, forge_write, forge_ls, RTFM, brand, workflow, AI-assistant, session, artifact, type

## Table of Contents

1. [What is a FAL](#what-is-a-fal)
2. [The RTFM workflow](#the-rtfm-workflow)
3. [The Brand principle](#the-brand-principle)
4. [Tool reference](#tool-reference)
5. [Common patterns](#common-patterns)
6. [Index](#index)

## What is a FAL
[up](#table-of-contents)

A FAL (Forge Artifact Locator) is the address of a file in Forge.

```
forge://<root>/<path/to/file>.<type>
```

Examples:
```
forge://development/with-claude/knowledgebase/PROJECT.md
forge://development/with-claude/knowledgebase/public/INDEX.md
forge://development/with-claude/knowledgebase/TODO.md
```

The part after the last `.` is the **type** — it tells Forge how to handle the file. The type is visible in every FAL returned by `forge_ls`. It determines what operations are available and how the file must be read or written.

**You never construct a FAL manually. You always obtain FALs by calling `forge_ls`.** A FAL built by hand — even if syntactically correct — may carry the wrong type and will be rejected by Forge (Brand principle).

## The RTFM workflow
[up](#table-of-contents)

**Forge enforces a mandatory step before any read or write: call `forge_describe` first.**

If you call `forge_read` or `forge_write` without having described the type, Forge returns:
```
"Call forge_describe(fal) first — RTFM: no read or write before the type is understood."
```

This is not an error to work around — it is the protocol telling you what to do next. Call `forge_describe`, then retry.

### The workflow in three steps

```
1. forge_ls(folder)        → discover FALs (branded by Forge)
2. forge_describe(fal)     → understand the type (once per type per session)
3. forge_read / forge_write → read or write
```

### Once per type per session

`forge_describe` only needs to be called once per type per session. After that, all artifacts of the same type are unlocked — no need to describe again.

```
forge_describe("forge://…/PROJECT.md")   → unlocks type "md" for the session
forge_read("forge://…/PROJECT.md")       → ok
forge_read("forge://…/INDEX.md")         → ok — type "md" already described
forge_read("forge://…/forge.js")         → blocked — type "js" not yet described
forge_describe("forge://…/forge.js")     → unlocks type "js"
forge_read("forge://…/forge.js")         → ok
```

### What forge_describe returns

`forge_describe` returns a description object:
```json
{
  "recognition": "A FAL ending with .md is ...",
  "capabilities": { "read": true, "write": true, "blocks": false },
  "usage": "forge_read(fal) returns the entire file content. forge_write(fal, content) replaces the entire file."
}
```

The `recognition` field always starts with *"A FAL ending with `.<type>` …"* — it is the self-referential anchor that tells you how to identify this type in any FAL.

The `capabilities` field tells you whether the type supports blocks (named sections within the file). Plain-text types have `blocks: false` — full file access only. Structured types (future `md-doc`, `doc-todolist`) have `blocks: true` — you can read and write individual sections.

## The Brand principle
[up](#table-of-contents)

**Every FAL used in a read or write must have been issued by Forge** — obtained via `forge_ls` or `forge_mkdir`, never constructed manually.

Forge maintains a Brand registry of all FALs it has emitted in the current session. A FAL not in the registry is rejected:
```
"This FAL was not issued by Forge — call forge_ls to obtain a valid FAL."
```

This protects against type errors: a manually constructed FAL may have the wrong type extension, silently routing the operation to the wrong handler and corrupting the artifact.

**The rule in practice:** always start with `forge_ls` to discover FALs. Never type a FAL by hand, even if you think you know it. If a human gives you a filename without a full FAL, call `forge_ls` to find the correct FAL and confirm with the human before proceeding.

## Tool reference
[up](#table-of-contents)

### forge_ls

```
forge_ls()           → list all roots
forge_ls(folderFal)  → list one level of a folder
```

Always free — no brand or describe required. Returns branded FALs with their type. **This is the only tool that issues valid FALs.** Use it to navigate and discover artifact addresses.

Folder FALs end with `/`:
```
forge://development/with-claude/knowledgebase/
forge://development/with-claude/knowledgebase/public/
```

### forge_describe

```
forge_describe(fal)   → describe the type, unlock for session
```

Call with any FAL of the target type — the description applies to all artifacts of that type. Returns `{ recognition, capabilities, usage }`.

### forge_read

```
forge_read(fal)          → full file content (plain-text types)
forge_read(fal, block)   → named block content (structured types only)
```

Requires a branded FAL (Brand) and prior `forge_describe` for the type (RTFM) — Brand is checked first. For plain-text types (`md`, `js`, `json`, `html`, `css`, `txt`), always omit the block argument — these types have no block structure.

### forge_write

```
forge_write(fal, content)          → replace full file (plain-text types)
forge_write(fal, block, content)   → replace named block (structured types only)
```

Requires a branded FAL (Brand) and prior `forge_describe` for the type (RTFM) — Brand is checked first. For plain-text types, always omit the block argument.

### forge_ping

```
forge_ping()   → connectivity check
```

Use at session start to verify Forge is running.

## Common patterns
[up](#table-of-contents)

### Read a file

```
forge_ls("forge://development/with-claude/knowledgebase/")
  → finds forge://development/with-claude/knowledgebase/PROJECT.md  (branded)

forge_describe("forge://development/with-claude/knowledgebase/PROJECT.md")
  → type "md" unlocked

forge_read("forge://development/with-claude/knowledgebase/PROJECT.md")
  → file content
```

### Read multiple files of the same type

```
forge_describe("forge://…/PROJECT.md")   → type "md" unlocked (once)
forge_read("forge://…/PROJECT.md")       → ok
forge_read("forge://…/INDEX.md")         → ok — no second describe needed
forge_read("forge://…/TODO.md")          → ok
```

### Write a file

```
forge_describe("forge://…/PROJECT.md")        → type "md" unlocked
forge_read("forge://…/PROJECT.md")            → read current content
[modify content]
forge_write("forge://…/PROJECT.md", newContent)  → write back
```

### Navigate an unknown project

```
forge_ls()                               → list roots
forge_ls("forge://development/")        → list top-level folders
forge_ls("forge://development/myproject/")  → list project files
forge_describe("forge://…/PROJECT.md")  → understand the type
forge_read("forge://…/PROJECT.md")      → read project context
```

### Human gives a filename without a FAL

```
Human: "read Forge.md"
→ call forge_ls on the likely folder
→ find the branded FAL (e.g. forge://…/conventions/forge.md)
→ confirm with human: "I found forge://…/conventions/forge.md — is that the one?"
→ proceed on confirmation
```

## Index

| Term | Occurrences |
|------|-------------|

## Changelog

### Version 1.3 - Brand before RTFM; force removed
**Date:** 2026-06-07
**Reason:** Design session v7.0 — two corrections: (1) Brand gate is checked before RTFM gate; (2) `force` parameter removed from `forge_describe` — no longer exists in the protocol.

**Changes:**
- The RTFM workflow: `forge_describe` tool reference — `force=true` variant removed
- Tool reference / forge_describe: `force=true` variant removed
- Tool reference / forge_read, forge_write: gate order updated — "Brand is checked first"

---

### Version 1.2 - Brand principle
**Date:** 2026-06-07
**Reason:** Brand principle specced in forge.md v6.4. AI Assistants must never construct
FALs manually — always obtain them via forge_ls. Section added, tool reference updated,
common pattern added for filename-without-FAL scenario.

**Changes:**
- Keywords: `brand` added
- TOC: `The Brand principle` added (section 3); subsequent sections renumbered
- What is a FAL: note added — never construct a FAL manually
- The RTFM workflow: workflow step 1 updated — "branded by Forge"
- The Brand principle: new section added
- Tool reference: forge_ls updated — "only tool that issues valid FALs"; forge_read/forge_write updated — "RTFM + Brand"
- Common patterns: `Human gives a filename without a FAL` pattern added

---

### Version 1.1 - Streisand Effect applied
**Date:** 2026-06-07
**Reason:** Quick Start contained a "Do not load" warning — Streisand Effect. Removed:
the absence of a trigger in the Decision Layer is sufficient.

**Changes:**
- Quick Start: sentence "Do not load `conventions/forge.md`..." removed

---

### Version 1.0 - Creation
**Date:** 2026-06-07
**Reason:** New guide — operational entry point for AI Assistants using Forge. Covers FAL concept, RTFM workflow, tool reference, and common patterns.
