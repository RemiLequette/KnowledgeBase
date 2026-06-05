# Editor Tool Guide

Guide for building HTML viewer and editor tools that read and write local resources via the local server.

## Quick Start

Load this guide when building an HTML tool whose purpose is to view or edit one or more local resources.
Covers the rationale for building a dedicated tool, the canonical vocabulary, and the recommended technical infrastructure — detailed enough to bootstrap a new tool from scratch.
Does not cover the local server itself — see `conventions/local-server.md`.
Does not cover the general tool rationale — see `conventions/tools.md [section Rationale]`.

## Keywords
editor-tool, viewer, resource, HTML, local-server, revision, working-file, save, bootstrap, topbar, modal, toast, refresh

## Table of Contents

1. [Why](#why)
2. [What](#what)
3. [How](#how)
4. [Index](#index)

## Why
[up](#table-of-contents)

### Viewer and editor

"Editor tool" is an ambitious name. Many useful tools are viewers — they carry no editing capability at all. The distinction matters: a viewer and an editor solve different problems, and an editor is not always necessary. An editor is a viewer with modifications added. Some editors expose a read-only mode, making them viewers on demand.

### Resources without a human view

Data lives in resources. Some resources are readable by a human with effort — a long Markdown file, a JSON configuration — but they offer no structure, no navigation, no filtering. Others are simply not human-readable at all: binary files have no useful plain-text representation, and APIs or databases such as SQLite expose their data only through queries, with no native visual interface.

In all these cases, the data exists but the human has no adequate view of it. The tool creates that view.

### The value of a viewer

A viewer transforms a raw resource into a navigable interface.

**Structured display** — the viewer renders the resource according to its structure: columns, sections, cards, rows. The human sees the organization, not the raw syntax or query results.

**Filtering** — show only the items that match a criterion right now: a priority level, a state, a type. The raw resource always exposes everything; the viewer shows what is relevant.

**Drill up and down** — navigate between an overview (all chapters, all columns) and the detail of a single item, without losing context. A text editor or a query tool has no concept of zoom level.

**Aggregation** — a viewer can read several resources and present a unified view. Comparing two files side by side, or combining data from a file and a database, is impossible to do mentally on large datasets.

**Passive problem detection** — inconsistencies, missing items, unexpected states become visible at a glance, without any user action. The viewer detects continuously; the human decides whether to act.

**Low friction** — a bookmark is enough to open it. No prompt, no context loading, no waiting. The regularity of use depends directly on access friction: a todo list only has value if it is consulted; a plan only stays synchronized if reviewing it is effortless.

### The viewer as a foundation for AI collaboration

A viewer gives the human and the AI a shared reference point — and brings reliability that an AI alone cannot guarantee.

**Stable identifiers** — the viewer assigns short, stable references to items (indexes, numbers, codes). The conversation becomes precise: "work on W3", "chapter 5 is incomplete". Without a viewer, the human must describe or copy-paste to identify an item.

**Context preparation** — the human uses the viewer to navigate, identify what deserves attention, then arrives in the conversation with a targeted question. The AI loads only what is relevant.

**Role separation** — the viewer owns the current state (what exists, what is done, what is missing). The AI can focus on value-added work: generate, reformulate, analyze. No need to ask it "what is still open?" — and even for such a simple question, an AI reading a long resource can miss items, misread a state, or produce a response that seems correct but is incomplete. The viewer is deterministic; the AI is not. The tool brings reliability to factual information.

**Post-AI validation** — after the AI produces content, the viewer lets the human integrate it and verify structural coherence before committing. The AI writes; the human validates in the tool.

### What an editor adds

An editor adds the ability to modify — but modifying without a safety net is risky. The editor answers this with a transactional revision model.

**Direct and precise modification** — click to change a state, drag to reorder, edit inline. An AI modifies text with a risk of parsing errors or unintended changes to surrounding content.

**Continuous coherence** — the editor maintains and displays coherence in real time as changes are made: references that become orphaned, items that enter an invalid state, structure that diverges between two resources.

**The revision model** — changes accumulate locally in a working file. The source resources are never touched during a session. A crash loses nothing. The human decides when to commit.

**Visibility of in-progress changes** — at any point during a session, the user must be able to see clearly what has changed since the last Save. Modified items are visually highlighted; a revision badge signals that uncommitted work exists. Without this visibility, Save is a blind act — the user cannot know what they are about to commit.

**Explicit Save with controlled log** — the commit to source resources is a deliberate act. At Save time, the user reviews and can edit the changelog entry before it is written. The history is intentional, not mechanical. Nothing is silently overwritten.

### Writing the Why section of a tool spec

Documenting a tool before coding it is mandatory — not a formality. The spec is the basis for development (it defines what to build and why each decision was made) and doubles as the user manual. Without it, design decisions are lost, the tool cannot be regenerated, and an AI Assistant has no way to understand intent before modifying the code.

A tool spec follows the Why-What-How structure — the same structure as the present document. See `conventions/documentation-style.md [section Why-What-How Hierarchy]` for the full convention. See `conventions/tools.md [section Adding a Tool]` for the mandatory workflow: spec first, then code.

A good Why section answers three questions:

1. **What problem does the tool solve?** — name the friction, the error rate, or the cost that motivated building it.
2. **Why is this better than doing it by hand or with an AI?** — be specific. "Slow and error-prone" is acceptable only if you name what is slow and what errors occur.
3. **Why each design decision?** — for every non-obvious feature (a trash zone, a split layout, a revision model), explain why it exists. Decisions without a Why will be undone by the next person who touches the tool.

## What
[up](#table-of-contents)

### Data model vocabulary

**Source resource** — the authoritative resource(s) the tool reads and writes: a local file, a database, an API. The tool never writes to a source resource except on explicit Save.

**Working file** — a JSON file that captures the in-progress state between two Saves. Written on every change. Read on startup if present (takes precedence over the source resource). Committable to Git — work in progress is never lost.

**Revision** — the set of modifications accumulated since the last Save. A revision may be represented as a mutated in-memory state (simple tools) or as a typed operation log (tools where auditability or replay matters).

**Save** — the explicit commit of the current revision to the source resource(s). Always user-triggered. Never automatic. On Save: write source resources, append to changelog if applicable, delete the working file.

**Discard** — explicit cancellation of the current revision. Restores the state from source resources. Requires confirmation. Deletes the working file.

**Refresh** — explicit reload of the source resources from the backend, without committing the current revision. Used when the source may have been modified externally (by an AI Assistant or another tool) since the last load. If a revision is in progress, requires confirmation before discarding it.

**Dirty** — describes an item or a panel whose content differs from the last saved state. Dirty items are visually highlighted. The presence of dirty content activates the Save and Discard buttons.

### UI vocabulary

Use these terms consistently in specs, comments, and labels.

**Topbar** — the fixed horizontal bar at the top of the tool. Always visible. Contains: tool title, connection indicator, revision badge, and the Save / Discard action buttons.

**Connection indicator** — a colored dot in the topbar reflecting backend availability. Three states: green (connected, saves active), orange (backend unavailable, changes not saved), red (backend reachable but last write failed).

**Revision badge** — a label in the topbar that appears when a revision is in progress (the working file exists and contains unsaved changes). Hidden when the tool is clean.

**Panel** — a persistent, always-visible zone of the interface dedicated to a single concern (e.g. the plan panel, the guide panel, the elements panel). Panels are not tabs — they are simultaneously visible.

**View** — a named layout of panels. A tool may have one or several views. Switching views changes which panels are visible or how they are arranged.

**Modal** — a centered overlay dialog used for confirmations and short input forms. Blocks interaction with the rest of the interface until dismissed. One reusable modal instance per tool — populated dynamically by each caller.

**Toast** — a short non-blocking notification that appears briefly (typically 2–3 seconds) at a corner of the screen. Used to confirm that an action was recorded. Never used for errors that require user action — those go in a modal.

## How
[up](#table-of-contents)

### Stack

A single HTML file — HTML, CSS, and JavaScript inline, no external dependencies, no build step.
One file = one tool. Self-contained and portable.

See `conventions/tools.md [section Rationale]` for the general argument for deterministic, dependency-free tools.

### Bootstrap pattern

Each project has a small bootstrap HTML file opened via `file://`. It:
1. Pings the backend via a health check endpoint
2. If available: redirects to the served tool URL
3. If unavailable: displays "Start the backend before opening this file"

The bootstrap file is the only file opened via `file://`. The tool itself is always served and can use `fetch()` freely. The served URL can be bookmarked — the bootstrap is only needed on first open.

See `conventions/local-server.md [section How projects use the server]` for the bootstrap pattern when the backend is the local server.

### Resource access

The tool accesses its source resources through a backend layer. The backend is a pure transport — it has no knowledge of the tool's data format or business logic.

The choice of backend depends on where the resources live:

**Desktop local files — use the local server.** Browsers cannot access the local filesystem directly: `fetch()` calls to local paths are blocked by CORS and `file://` security restrictions. The local server lifts this constraint by serving files over `http://localhost` and exposing read/write endpoints. It is the recommended backend for any resource stored on the local machine. See `conventions/local-server.md` for setup and the full API contract.

| Operation | Call |
|-----------|------|
| Read a file | `GET /file?path=...` — returns 404 if absent |
| Write a file | `POST /file?path=...` with `text/plain` or `application/json` body |
| Delete a file | `DELETE /file?path=...` — idempotent |
| Check availability | `GET /ping` |

**Cloud or remote resources — use the appropriate MCP.** Files stored on Google Drive, Notion, or similar services are accessible via their MCP connector, which handles authentication and API calls. The tool calls the MCP instead of the local server. The internal model and revision logic remain identical — only the access layer changes.

**Other backends** — a SQLite database is accessed via a local API wrapper; a remote REST API is called directly via `fetch()`. The pattern is the same in all cases: the backend is a replaceable transport layer.

### Revision model

The revision model separates in-progress work from committed state.

**On every user action:** mutate the in-memory state, then write the working file (`POST /file`).

**On Save:**
1. Apply the revision to source resources — write via the backend
2. Append a changelog entry if the source resource has one — present it to the user for review before writing
3. Delete the working file
4. Reset dirty state and take a new snapshot

**On Discard:**
1. Show a confirmation modal
2. Delete the working file
3. Reload source resources from the backend

**On Refresh:**
1. If a revision is in progress, show a confirmation modal (changes will be lost)
2. Delete the working file
3. Reload source resources from the backend
4. Rebuild in-memory state from scratch

**On startup:**
1. Load source resources via the backend
2. Attempt to load the working file — if present, apply it to the in-memory state
3. Update the topbar (revision badge, button states)

### UI shell

Every editor tool shares the same shell structure.

**Topbar** — fixed, always visible:
```
[Tool title]  [connection indicator]  [revision badge]  .....  [Refresh]  [Discard]  [Save]
```
- Save and Discard are disabled when there is no revision in progress or the backend is unavailable
- The connection indicator polls the health check on load and reflects write errors in real time

**Modal** — one instance, reused by all callers:
```javascript
showModal(title, bodyHTML, onConfirm)
// onConfirm returns true to close, false to keep open (e.g. validation failed)
```

**Toast** — one instance, auto-dismiss:
```javascript
toast(message)        // neutral
toast(message, true)  // error style
```

**State management pattern** — every mutation follows the same sequence:
```
mutate in-memory state
-> mark dirty
-> write working file (saveWork)
-> re-render
```

## Index

| Term | Occurrences |
|------|-------------|

## Changelog

### Version 1.3 - Visibility of changes, Refresh, local server rationale, doc context
**Date:** 2026-06-05
**Reason:** Four additions in the same session.

**Changes:**
- Why / What an editor adds: new paragraph "Visibility of in-progress changes" — dirty highlighting, revision badge, Save as a deliberate informed act
- Why / Writing the Why: added documentation context — spec is mandatory before coding, doubles as user manual, references documentation-style.md and tools.md conventions
- What / Data model: new term "Refresh" — explicit reload from backend, distinct from Discard
- How / Resource access: rewritten — desktop local files (local server, browser security rationale), cloud resources (MCP), other backends; local server presented as solution to browser filesystem restrictions
- How / Revision model: Refresh lifecycle added
- How / UI shell: Refresh button added to topbar
- Keywords: refresh added


### Version 1.2 - Resource generalization
**Date:** 2026-06-05
**Reason:** "File" replaced by "resource" throughout — the pattern applies equally to local files, binary resources, databases, and APIs. How section updated to present local server as the recommended backend for files, with an open door to other backends.

**Changes:**
- Quick Start: "files" replaced by "resources"
- Keywords: "file-access" replaced by "resource"
- Why: new section "Resources without a human view" — examples of text files, binary files, databases/APIs; "file" replaced by "resource" throughout
- Why / AI collaboration: reliability argument added — viewer is deterministic, AI can hallucinate even on factual state questions
- What: "source file" replaced by "source resource" throughout; connection indicator generalized to "backend"
- How: "File access" renamed "Resource access" — local server presented as recommended backend for files; other backends (SQLite, REST API) mentioned explicitly; bootstrap pattern generalized


### Version 1.1 - Why rewritten
**Date:** 2026-06-05
**Reason:** Initial Why was generic (script rationale). Rewritten to capture the specific value of viewer and editor tools — structured display, filtering, drill up/down, aggregation, AI collaboration, revision model.

**Changes:**
- Why: full rewrite — viewer value, editor value, AI collaboration, writing guidance
- Quick Start: subtitle updated to mention viewer
- Keywords: viewer added


### Version 1.0 - Creation
**Date:** 2026-06-05
**Reason:** Guide for building HTML editor tools — extracted from todo-tool and plan-editor patterns.

**Content:**
- Why: when to build a tool, tool vs AI comparison, guidance for writing a tool spec Why section
- What: data model vocabulary (source file, working file, revision, save, discard, dirty), UI vocabulary (topbar, connection indicator, revision badge, panel, view, modal, toast)
- How: stack, bootstrap pattern, file access, revision model, UI shell
