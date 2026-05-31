# MD Doc Usage Convention

Convention for writing and auditing documentation files using the md-doc tool.

## Quick Start

Convention for writing and auditing documentation files using the md-doc tool.
Load when creating, modifying, or auditing a Markdown file.
Covers: tool invocation, write workflow, tmp file management, and conformance checking.
Does not cover: reading files — read directly via `filesystem` MCP in full. Does not cover documentation structure rules — see conventions/documentation.md.

## Keywords
md-doc, tool, write, documentation, workflow, tmp, conformance, audit, create, update, delete, check

## Table of Contents

1. [Principle](#principle)
2. [Prerequisites](#prerequisites)
3. [Writing a Document](#writing-a-document)
4. [Temporary JSON Files](#temporary-json-files)
5. [Conformance](#conformance)
6. [Index](#index)

## Principle
[up](#table-of-contents)

**Read** documentation files directly via `filesystem` MCP — in full, once. The file enters the prompt cache and stays available for the session at no additional cost.

**Write** via `md-doc.js` — only the changed sections are sent as a JSON diff. This avoids reconstructing and emitting the entire file on every modification.

md-doc is a **write tool**, not a read tool.

## Prerequisites
[up](#table-of-contents)

Before the first call in any session, load the tool schema via `tool_search`:

```
tool_search query="execute command node"
```

Tool path (absolute, always pass this):
```
C:\Users\RemiLequette\Development\projects\knowledgebase\public\tools\md-doc.js
```

Invocation pattern:
```
commands:execute_command
  command: node
  args: ["<tool-path>", "<command>", ...args]
```

First line of stdout is always `OK` or `ERROR:<code>:<message>`. Always read it before proceeding.

## Writing a Document
[up](#table-of-contents)
### Section definition

In this convention, **"section"** refers exclusively to content sections — those in the content zone defined by `conventions/documentation.md`: after `## Table of Contents` (or after `## Keywords` if no TOC exists) and before `## Index`. Mandatory sections (`Quick Start`, `Keywords`, `Table of Contents`, `Index`, `Changelog`) are not "sections" in the md-doc sense and cannot be targets of positional insertion.

**`create` — new file**
Use when the file does not exist yet. Fails if the file already exists.
```
node md-doc.js create <file> <tmp/md-doc-create-input.json>
```
Input JSON: object with `title` and any section names as keys. The tool creates a conformant skeleton with `Quick Start`, `Keywords`, `Index`, and `Changelog`.

**`update` — modify existing file**
Use to update one or more sections in an existing file. Creates a `.bak` backup automatically before writing.
```
node md-doc.js update <file> <tmp/md-doc-update-input.json>
```
Input JSON: object with only the sections to update. Existing sections are replaced. Absent sections are created and inserted before `## Index` by default.

To control where a new section is inserted, add a `__positions` key:
```json
{
  "New Section": "content",
  "__positions": {
    "New Section": "after:Language"
  }
}
```
Valid position values: `"beginning"`, `"before:<section>"`, `"after:<section>"`.

- `"beginning"` means first position in the content zone (after `## Table of Contents`, or after `## Keywords` if no TOC).
- `"before:<section>"` and `"after:<section>"` refer to content sections only — targeting a mandatory section is not permitted.

Position is ignored when the section already exists. Returns `ERROR:SECTION_NOT_FOUND` if the reference section is absent.

**`delete` — remove a section**
Use to remove a non-mandatory section from an existing file. Creates a `.bak` backup automatically before writing.
```
node md-doc.js delete <file> <section-name>
```
Returns `ERROR:SECTION_NOT_FOUND` if the section does not exist.
Returns `ERROR:PROTECTED_SECTION` if the section is mandatory (`Quick Start`, `Keywords`, `Index`, `Changelog`).

**Rule:** Always write the JSON input to a tmp file via `filesystem` MCP — never pass content inline via `node -e`. Inline `-e` arguments are subject to shell parsing rules and will silently fail or error on content containing backticks, quotes, or special characters.

**Rule:** always run `check` after any write to verify the result is conformant.

**Rule:** When a transformation is total (renaming multiple sections, full translation, structural reorganization), use `filesystem:write_file` directly on the file — chaining `delete`/`update` with `__positions` is error-prone and risks misplacing mandatory sections.

## Temporary JSON Files
[up](#table-of-contents)

All JSON files used as input for `md-doc` must be placed in a `tmp/` folder at the root of the current project.

**Rules:**
- Path: `<project-root>/tmp/`
- Create the folder if absent before the first call: `node -e "require('fs').mkdirSync('<path>/tmp', { recursive: true })"`
- File naming: `md-doc-<purpose>.json` (e.g. `md-doc-create-input.json`, `md-doc-update-input.json`)
- Always delete tmp files after the operation completes — do not leave them in the repo
- `tmp/` must be listed in `.gitignore`

**Never use the system temp directory** (e.g. `/tmp` on Linux) — it is not accessible from the Windows filesystem where the project files live.

## Conformance
[up](#table-of-contents)

Run `check` on any document that has been written or that appears structurally suspect.

```
node md-doc.js check <file>
```

Output after `OK`: list of issues (empty = conformant). Issues include missing required sections (`Quick Start`, `Keywords`, `Index`, `Changelog`) and empty `Keywords`.

**Rules:**
- Always run `check` after `create`, `update`, or `delete`
- If `check` reports issues on an existing document, signal them explicitly before proceeding with any write on that file
- During audits, run `check` on every document in scope and report all findings — do not silently skip non-conformant files
- Never write to a non-conformant file without first noting the violations

## Index

| Terme | Occurrences |
|-------|-------------|

## Changelog
### Version 3.2 - Total rewrite rule added
**Date:** 2026-05-31
**Reason:** Chaining delete/update with __positions for total transformations proved error-prone — mandatory sections can end up misplaced.

**Changes:**
- `## Writing a Document`: added rule recommending `filesystem:write_file` for total rewrites

---

### Version 3.1 - Section definition and position clarification
**Date:** 2026-05-31
**Reason:** "Section" was ambiguous — could refer to any ## heading including mandatory ones. Clarified that "section" in md-doc context means content sections only. Clarified `beginning` and positional targeting rules accordingly.

**Changes:**
- `## Writing a Document`: added `### Section definition` note
- `## Writing a Document`: `beginning` and `before/after` position rules clarified

---

### Version 3.0 - Read removed, write-only tool
**Date:** 2026-05-31
**Reason:** read and dump commands removed from convention. Documentation files are read directly via filesystem MCP in full — they enter the prompt cache and stay available at no additional cost. md-doc is now exclusively a write tool.

**Changes:**
- Title and short description updated
- Quick Start rewritten — write-only scope, reading via filesystem MCP
- Keywords updated — removed read, competency-discovery; added create, update, delete, check
- Principle rewritten — read/write split, md-doc as write tool
- TOC updated — Reading a Document and Competency Discovery removed
- Reading a Document section removed
- Competency Discovery section removed
- Temporary JSON Files — examples updated (no more read/dump json files)
- Conformance — check rule extended to delete
- Tool path corrected: knowledgebase/public/tools/md-doc.js

---

### Version 2.2 - update position control documented
**Date:** 2026-05-31
**Reason:** New `__positions` key added to `update` command.

**Changes:**
- Writing a Document: `update` description expanded with `__positions` format, valid values, and error

---

### Version 2.1 - delete command documented
**Date:** 2026-05-31
**Reason:** New `delete` command added to md-doc.js.

**Changes:**
- Writing a Document: `delete` command added with signature, error codes, and rule

---

### Version 2.0 - Full translation to English
**Date:** 2026-05-31
**Reason:** Document was written in French, violating the documentation convention.

**Changes:**
- Full content translated to English, section names normalized, TOC added, return links added

---

### Version 1.0 - Creation
**Date:** 2026-05-30
**Reason:** Convention for reading and writing documentation files using the md-doc tool.
