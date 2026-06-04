# Artifact — Structured data management convention

Convention for managing structured datasets that evolve over time through a series of versioned revisions.

*Document type: Convention — see `conventions/documentation-style.md`*

## Quick Start

Generic convention for any time-tracked structured dataset: file structure,
lifecycle, URL modes, index.html behavior, local server contract, revision index,
standard scripts, and GitHub Pages publication.
Load when a request involves the architecture of an artifact.
Do not load for domain-specific rules — see the specialization file.

## Keywords
artifact, structured data, revisions, history, lifecycle, JSON, index.html,
local server, URL modes, embed, GitHub Pages, scripts, convention

## Table of Contents

1. [Definition](#definition)
2. [File structure](#file-structure)
3. [State detection](#state-detection)
4. [URL parameters and modes](#url-parameters-and-modes)
5. [index.html behavior](#indexhtml-behavior)
6. [Revision index](#revision-index)
7. [Embedded variables](#embedded-variables)
8. [Standard scripts](#standard-scripts)
9. [Local server API contract](#local-server-api-contract)
10. [GitHub Pages publication](#github-pages-publication)
11. [Specializations](#specializations)
12. [Index](#index)

## Definition
[up](#table-of-contents)

### Why

Some datasets are not static — they evolve at discrete points in time (typically during
review sessions) and their history matters. Tracking only the current state loses the
ability to answer: what changed, when, and what was the state at a given point in time.

The artifact pattern solves this by separating the current reference state from the
in-progress modifications, and by keeping a full dated history. It also separates
local editing (dynamic, server-assisted) from publication (static, self-contained) —
so the same interface works in both contexts without duplication.

### What

An **artifact** is a structured dataset tracked over time. It evolves through
discrete revisions, each tied to a date. Every change is recorded and traceable.

An artifact has:
- a single interface file: `index.html` (no embedded data in local operation)
- a dated revision history in `historique/`
- a revision index: `historique/index.html`
- standard scripts to open and close revisions

### Local and published modes

An artifact operates in two distinct modes:

**Local mode** — the interface fetches data dynamically from a local server.
Data files live on disk (`historique/`). The server handles reads and auto-saves.
Editing is possible. This is the working mode.

**Published mode** — the interface is self-contained: data is embedded directly
into the HTML at export time. No server required. Read-only.
This enables sharing with users who have no access to the local environment.

GitHub Pages is one example of a publication target. Any static hosting works.
The export script (see `## GitHub Pages publication`) performs the embedding;
the working `index.html` is never modified.

## File structure
[up](#table-of-contents)

Canonical structure for any artifact:

```
<artifact>/
  index.html                    <- single interface, no embedded data in local mode
  historique/
    index.html                  <- revision index (see dedicated section)
    data-YYYY-MM-DD.json        <- validated data snapshot
    changes-YYYY-MM-DD.json     <- modifications recorded during the open revision
```

Two JSON files per revision:
- `data-YYYY-MM-DD.json` — validated state at opening (or closing) date
- `changes-YYYY-MM-DD.json` — modifications captured during the revision,
  auto-saved by the local server

Fundamental rule: the most recent `data-*.json` is the current reference.
If a `changes-*.json` with the same date exists, a revision is open.

## State detection
[up](#table-of-contents)

State is detected by `index.html` from the files present in `historique/` — never manually.

| Condition | State |
|-----------|-------|
| No `data-*.json` | Empty artifact, not initialized |
| `data-*.json` present, no `changes-*.json` with same date | No open revision |
| `data-*.json` + `changes-*.json` with same date | Revision in progress |

## URL parameters and modes
[up](#table-of-contents)

Modes common to all artifacts:

| URL | Mode | Behavior |
|-----|------|----------|
| `index.html` | Read | Loads most recent `data-*.json`, read-only |
| `index.html?date=YYYY-MM-DD` | Record | Loads `data` + `changes` for that date, read-only |
| `index.html?date=YYYY-MM-DD&mode=edit` | Edit | Modifications enabled, auto-save active |
| `index.html?embed=true` | Embed | Shows only `#change-summary`, no header or toolbar |

Specializations may define additional modes. These are documented in the specialization file.

## index.html behavior
[up](#table-of-contents)

### On load

1. `ping()` to the local server
2. Server available:
   - No `?date=`: fetch the most recent `data-*.json`
   - With `?date=`: fetch `data-YYYY-MM-DD.json` + `changes-YYYY-MM-DD.json`
   - If `changes` absent (404): start without modifications (read or empty edit)
3. Server absent:
   - Use `DATA_EMBEDDED` and `CHANGES_EMBEDDED` if non-null (GitHub Pages mode)
   - Otherwise: display "Server unavailable — start local-server.bat"

### In edit mode

- Each modification → `POST /patch?file=<artifact>/historique/changes-YYYY-MM-DD.json`
- Silent auto-save, discrete status indicator (green / amber / red)
- No export/import buttons, no localStorage, no IndexedDB

## Revision index
[up](#table-of-contents)

`historique/index.html` lists all revisions of an artifact.

Content — for each `data-*.json` / `changes-*.json` pair in `historique/`:
- revision date
- status: open / closed
- link to the record view: `../index.html?date=YYYY-MM-DD` (read-only)

Behavior:
- Loads the file list via `GET /list?resource=<artifact>`
- Sorted by descending date (most recent first)
- Server absent → uses `REVISIONS_EMBEDDED` (injected by `export-github-pages.js`)

Embedded variable (always present in `historique/index.html`, initialized to `null`):

```javascript
const REVISIONS_EMBEDDED = null; // replaced by export-github-pages.js
```

## Embedded variables
[up](#table-of-contents)

Always present in `index.html`, initialized to `null`:

```javascript
const DATA_EMBEDDED    = null; // replaced by export-github-pages.js
const CHANGES_EMBEDDED = null; // replaced if a revision is being published
```

When the server is absent and a variable is non-null, it is used directly without a fetch call.

## Standard scripts
[up](#table-of-contents)

Two standard scripts apply to every artifact.
The merge logic for `cloturer-revision.js` is domain-specific — defined in the specialization file.

### ouvrir-revision.js

```
node scripts/ouvrir-revision.js <artifact> [--date YYYY-MM-DD]
```

Date defaults to today if omitted.

Tasks:
1. List `data-*.json` files in `historique/` — find the most recent
2. If none found: exit with error
3. If a `data-*.json` posterior to `--date` exists: exit with error
4. If `data-YYYY-MM-DD.json` absent: copy the latest `data-*.json` → `data-YYYY-MM-DD.json`
5. If `changes-YYYY-MM-DD.json` absent: create empty (structure defined by specialization)
6. If both already existed: print "Revision already open — nothing to do"
7. Print the URL: `<artifact>/index.html?date=YYYY-MM-DD&mode=edit`

### cloturer-revision.js

```
node scripts/cloturer-revision.js <artifact>
```

Tasks:
1. Find the most recent `data-*.json` → revision date
2. Verify `changes-YYYY-MM-DD.json` exists → otherwise exit with error
3. Load `data` + `changes`
4. Merge according to logic defined in the specialization file
5. Closing date: today if > revision date, otherwise revision date + 1 day
6. Write `data-[closing-date].json` (no matching `changes` = new reference)
7. Print confirmation and new reference date

## Local server API contract
[up](#table-of-contents)

Endpoints used by every artifact:

| Endpoint | Usage |
|----------|-------|
| `GET /ping` | Server presence check |
| `GET /list?resource=<artifact>` | List `data-*.json` files in `historique/` |
| `GET /patch?file=<path>` | Read a `changes-*.json` |
| `POST /patch?file=<path>` | Auto-save a `changes-*.json` |

See the project's `local-server.md` for the full server specification.

## GitHub Pages publication
[up](#table-of-contents)

See the project's `github-pages.md` for the full publication process.

`export-github-pages.js` replaces in the published copy of `index.html`:

```javascript
const DATA_EMBEDDED    = null;
const CHANGES_EMBEDDED = null;
```

with the contents of the latest `data-*.json` (and `changes-*.json` if a revision is in progress).

For `historique/index.html`, it replaces:

```javascript
const REVISIONS_EMBEDDED = null;
```

with the full list of revisions (dates + statuses).

The working `index.html` is never modified by this operation.

Publication condition: defined by each specialization.

## Specializations
[up](#table-of-contents)

A specialization is a process file that extends this convention for a specific artifact.
It documents only what is domain-specific: JSON schemas, merge logic, additional URL modes,
extra scripts, and business rules.

Every specialization file opens with:

> *This file is a specialization of the `artifact.md` convention.*
> *General rules (file structure, lifecycle, URL modes, local server, GitHub Pages) are in `artifact.md`.*

Expected content of a specialization:
- `data-*.json` schema (domain data structure)
- `changes-*.json` schema (modification structure)
- Merge logic for `cloturer-revision.js`
- Additional URL modes if applicable
- Additional scripts if applicable
- Domain-specific rules

## Index

| Term | Occurrences |
|------|-------------|

## Changelog

### Version 1.1 - WWH compliance and local/published clarification
**Date:** 2026-06-04
**Reason:** Convention was missing its Why level and document type declaration.
Local vs published mode distinction was implicit.

**Changes:**
- Added document type declaration (Convention)
- `## Definition`: restructured with `### Why`, `### What`, `### Local and published modes`
- Why explains the problem the pattern solves
- Local/published modes clarifies the two operating contexts; GitHub Pages positioned as one example of publication

### Version 1.0 - Creation
**Date:** 2026-06-04
**Reason:** Generic convention extracted from two mature specializations.
Covers the shared structure, lifecycle, scripts, and publication pattern
common to all time-tracked structured datasets.
