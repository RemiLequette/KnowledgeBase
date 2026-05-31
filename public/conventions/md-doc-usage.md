# MD Doc Usage Convention

## Quick Start
Convention for reading and writing documentation files using the md-doc tool.
Load when reading any project document, writing or updating a Markdown file, or running a documentation audit.
Covers: tool invocation, read/write workflow, competency discovery, tmp file management, and conformance checking.
Does not cover: the documentation structure rules themselves — see conventions/documentation.md.

## Keywords
md-doc, tool, read, write, documentation, workflow, competency-discovery, tmp, conformance, audit

## Principe
All documentation reads and writes must go through `md-doc.js`, not through direct filesystem reads.

Reasons:
- **Token efficiency** — `read` loads only the requested sections, not the full file
- **Convention enforcement** — `check` detects structural violations before they propagate
- **Session hygiene** — structured JSON output avoids raw Markdown noise in the context window
- **Consistency** — the same workflow applies across the KB and all projects

## Prerequis
Before the first call in any session, load the tool schema via `tool_search`:

```
tool_search query="execute command node"
```

Tool path (absolute, always pass this):
```
C:\Users\RemiLequette\Development\projects\claude-knowledge\tools\md-doc.js
```

Invocation pattern:
```
commands:execute_command
  command: node
  args: ["<tool-path>", "<command>", ...args]
```

First line of stdout is always `OK` or `ERROR:<code>:<message>`. Always read it before proceeding.

## Lire un document
Two commands are available depending on the need.

**`dump` — load everything**
Use when the full document is needed (e.g. INDEX.md discovery, first read of an unknown file).
```
node md-doc.js dump <file> <tmp/md-doc-dump.json>
```
Output: JSON object with `title` and all section names as keys.

**`read` — load selected sections**
Use when only specific sections are needed. Saves tokens.
```
node md-doc.js read <file> <tmp/md-doc-read-input.json> <tmp/md-doc-read-output.json>
```
Input JSON: array of section names, e.g. `["Quick Start", "Keywords"]`. `"title"` is a valid key.
Output JSON: object with requested keys. Missing sections return `null`.

**Rule:** prefer `read` over `dump` whenever the needed sections are known in advance.

## Ecrire un document
Two commands are available depending on whether the file exists.

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
Input JSON: object with only the sections to update. Existing sections are replaced. Absent sections are created and inserted before `## Index`.

**Rule:** always run `check` after any write to verify the result is conformant.

## Decouverte de competences
When starting a session, competency discovery follows this workflow — for the KB and for any project.

**Step 1 — Read the index**
```
node md-doc.js read <project>/INDEX.md <tmp/md-doc-read-input.json> <tmp/md-doc-index.json>
```
Requested keys: `["title", "Quick Start", "Keywords"]` — sufficient to understand scope without loading the full index.

**Step 2 — Identify relevant documents**
From the index output, determine which convention or domain files are relevant to the current request.

**Step 3 — Load targeted sections**
For each relevant file, use `read` with the minimum set of sections needed:
```
["Quick Start", "Keywords"]
```
If a section is specifically needed (e.g. a workflow or a rule), add it to the array.

**Step 4 — Load full document only if required**
Use `dump` only when the full content is needed and cannot be narrowed down.

**Rule:** never load a full document when a targeted `read` is sufficient.

## Fichiers JSON temporaires
All JSON files used as input or output for `md-doc` must be placed in a `tmp/` folder at the root of the current project.

**Rules:**
- Path: `<project-root>/tmp/`
- Create the folder if absent before the first call: `node -e "require('fs').mkdirSync('<path>/tmp', { recursive: true })"`
- File naming: `md-doc-<purpose>.json` (e.g. `md-doc-read-input.json`, `md-doc-dump.json`)
- Always delete tmp files after the operation completes — do not leave them in the repo
- `tmp/` must be listed in `.gitignore`

**Never use the system temp directory** (e.g. `/tmp` on Linux) — it is not accessible from the Windows filesystem where the project files live.

## Conformite
Run `check` on any document that has been written or that appears structurally suspect.

```
node md-doc.js check <file>
```

Output after `OK`: list of issues (empty = conformant). Issues include missing required sections (`Quick Start`, `Keywords`, `Index`, `Changelog`) and empty `Keywords`.

**Rules:**
- Always run `check` after `create` or `update`
- If `check` reports issues on an existing document, signal them explicitly before proceeding with any read or write on that file
- During audits, run `check` on every document in scope and report all findings — do not silently skip non-conformant files
- Never write to a non-conformant file without first noting the violations

## Index

## Changelog
