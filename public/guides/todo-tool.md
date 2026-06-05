# Todo Tool Guide

Guide for building and using the HTML kanban tool that reads and writes `TODO.md` directly via the local server.

*Document type: Guide*

## Quick Start

Load this guide when building the todo tool from scratch, setting up a new project instance, or designing similar HTML tools backed by local markdown files.
Covers rationale, conceptual model, and full technical architecture — detailed enough to regenerate the tool from scratch.
Does not cover the todo list format itself — see `conventions/todo-list.md`.
Does not cover the local server — see `conventions/local-server.md`.

## Keywords
todo-tool, HTML, kanban, local-server, bootstrap, transaction, drag-and-drop, card-index, trash, archive, synchronization, tool

## Table of Contents

1. [Why](#why)
2. [What](#what)
3. [How](#how)
4. [How to install in a project](#how-to-install-in-a-project)
5. [Index](#index)

---

## Why
[up](#table-of-contents)

### General rationale

Editing `TODO.md` by hand is slow and error-prone — wrong state, missing effort tag, archiving forgotten.
Asking an AI Assistant to filter, sort, or change card states is costly in tokens and unreliable for tasks that require no judgment.
A visual tool is also more comfortable for exploring and reviewing a todo list than a conversation with an AI.

See `conventions/tools.md [section Rationale]` for the general principle: mechanical tasks belong to deterministic tools, not to AI. Two arguments apply specifically here:

- **Token efficiency** — filtering, sorting, and changing states are mechanical operations. Using an AI for these wastes context on work that requires no reasoning.
- **Reliability** — a dedicated tool applies state transitions and archiving rules consistently, without drift or omission.

The AI remains appropriate for semantic tasks: reformulating an item, suggesting a priority, identifying dependencies between tasks.

A dedicated tool also reduces access friction, which encourages regular review — a todo list only has value if it is consulted.

### Why a kanban layout

A flat markdown file gives no visual overview of the backlog. A kanban with three columns (Open / In Progress / Done) and priority swimlanes makes the distribution of work immediately visible: where effort is concentrated, what is stuck, what is overdue.

Grouping by priority within each column reflects the natural reading order of a backlog — high priority items appear first. Two cards per row makes efficient use of horizontal space while keeping cards readable.

### Why card indexes (O1, W1, D1…)

When reviewing the backlog with an AI Assistant, referencing items by description is ambiguous and verbose. A short stable index ("let's work on W3", "what's blocking O1?") makes the conversation precise and traceable.

The index also reflects a queue within a state/priority group: lower index = older item = generally higher implicit urgency. This provides a secondary ordering signal without requiring explicit user action.

The index is stable across sessions: items that already have an index keep it; new items are appended. Drag-and-drop reordering within a lane updates the index sequence, giving the user explicit control over queue order.

### Why a transaction model (working file + explicit Save)

Saving every keystroke directly to `TODO.md` would make the file unstable and create noise in Git history. An intermediate working file (`TODO-work.json`) captures all changes in real time. The commit to `TODO.md` is explicit (Save button), deliberate, and always produces a valid file.

The working file survives crashes and can be committed to Git — work in progress is never lost and is portable across machines.

### Why a trash zone (not immediate delete)

Deleting a card immediately is irreversible and bypasses the archive. The trash zone introduces a buffer:

- **Crash safety** — if the session ends before Save, trashed items are not lost; they are still in the working file.
- **Restore** — a mistaken deletion can be undone before Save.
- **Controlled archiving** — trashed items go to `TODO-archive.md` on Save, with their original state preserved. This allows archiving items that were never Done (`[archived-from: open]`, `[archived-from: wip]`), which is valuable information: it shows abandoned work, not just completed work.
- **Forget** — items that should leave no trace can be permanently deleted before Save, with an explicit confirmation.

### Why explicit archiving (done items stay in the board)

Automatically moving Done items to the archive on Save loses the ability to review what was just completed. Done items remain visible in the board until explicitly trashed. This supports end-of-session review: "what did I finish?" before archiving.

### Why a persistent splitter between active zone and trash

The proportion of active vs trash area varies by work session. A draggable splitter lets the user tune the layout for the current session. Persisting the split ratio in `localStorage` avoids re-adjusting on every load.

### Why a diff tooltip on modified cards

During a session, multiple cards may be modified. Before saving, the user needs a way to review what changed. A tooltip on hover showing before/after values per field gives a lightweight audit of the session without opening a separate view.

---

## What
[up](#table-of-contents)

### Item model

Each todo item has the following fields:

- `id` — internal numeric identifier (timestamp-based for new items, sequential for loaded items)
- `title` — optional short label (displayed bold, centered on card)
- `desc` — main text (description or full text if no title)
- `priority` — `high` / `normal` / `low`
- `state` — `open` / `wip` / `done`
- `effort` — optional sizing: `XS` / `S` / `M` / `L` / `XL`
- `seq` — position within state/priority group (1-based, drives card index display and sort order)

Trashed items have an additional field:
- `origState` — the state at the time of trashing (`open`, `wip`, or `done`)

### Card index

Each card displays a short index badge: `O1`…`On` for open, `W1`…`Wn` for WIP, `D1`…`Dn` for done.
The index reflects the `seq` field and is written to `TODO.md` on Save.

Indexing algorithm on load or refresh:
1. Items with an existing index tag in the file (`[O1]`, `[W1]`, `[D1]`) are placed first in their column, in index order.
2. Items without an index are appended in file order.
3. All items are renumbered sequentially from 1 within their state/priority group.

Drag-and-drop within a lane reorders items and renumbers immediately.

### Operations

**On active cards (hover actions):**
- Change state: Open → WIP, Open → Done, WIP → Open, WIP → Done, Done → Reopen
- Edit: opens inline editor for title and description
- Trash (✕): moves card to trash zone without confirmation

**On trashed cards (hover actions):**
- Restore: returns card to its original state column at the end of the queue
- Forget: permanently deletes, no archive — requires confirmation dialog

**Global:**
- Add item: per column, with title (optional), description, priority, effort
- Drag card to another column or lane: changes state and/or priority, inserts at drop position
- Drag card within a lane: reorders, renumbers
- Drag card to trash zone: trashes
- Click priority or effort badge: opens popover to change value
- Click description text: toggles expand (show full text vs 2-line clamp)
- Save: commits working file to `TODO.md`, archives trashed items to `TODO-archive.md`
- Refresh: reloads `TODO.md`, discards working file — requires confirmation if dirty
- Archive button: opens read-only modal of `TODO-archive.md`

### Data persistence

Three files per project:

- **`TODO.md`** — source of truth; written on explicit Save
- **`TODO-work.json`** — working state between commits; written on every change; read on load if present (takes precedence over `TODO.md`); committable to Git
- **`TODO-archive.md`** — append-only archive; trashed items written here on Save with `[archived-from: state]` tag

### Transaction model

Every user action calls `saveWork()` immediately — writes to `TODO-work.json`.
`commitSave()` is triggered by the Save button only:
1. Archives trashed items to `TODO-archive.md`
2. Serializes active items to `TODO.md`
3. Deletes `TODO-work.json`
4. Resets `dirtyIds` and `trashed`
5. Takes a new snapshot (baseline for diff tooltip)

### Dirty tracking and diff

At load time, a snapshot of all items is taken (`snapshot[id] = {title, desc, priority, state, effort}`).
Every modification marks the item's id as dirty (`dirtyIds` Set).
Dirty cards are visually highlighted (amber background + amber border).
Hovering a dirty card shows a tooltip with before/after values for each changed field (red strikethrough → green).

### Concurrency

Single-user, short sessions. No concurrent access handling needed. This assumption must be revisited if the usage context changes.

---

## How
[up](#table-of-contents)

### Architecture

The tool follows the bootstrap pattern from `conventions/local-server.md`:

- **Bootstrap file** (`todo-<project>.html`) — opened via `file://`; pings `localhost:3000`; redirects to the app URL on `http://localhost:3000/...`; contains the absolute path to `TODO.md` hardcoded. One bootstrap file per project.
- **App file** (`todo-tool.html`) — served via the local server; reads and writes files via the `/file` API; receives the `TODO.md` path as a URL parameter `?todo=...`.

The app URL (`http://localhost:3000/.../todo-tool.html?todo=...`) can be bookmarked — the bootstrap is only needed on first open.

### File access

All file operations go through the local server REST API:
- `GET /file?path=...` — read file (returns 404 if absent)
- `POST /file?path=...` with `text/plain` body — write file
- `DELETE /file?path=...` — delete file (used to remove `TODO-work.json` on commit or discard)
- `GET /ping` — server health check

The app parses and serializes the markdown itself. The server is a pure file transport — it has no knowledge of the todo list format.

Performance note: every save reads and writes the full file. This is acceptable for current scale. If it becomes a bottleneck, the server could be extended with partial file access, or storage migrated to SQLite. Either change must remain localized to the file access layer.

### Server availability indicator

Displayed at all times in the header:
- Green dot — connected, saves active
- Orange dot — server unavailable, changes not saved
- Red dot — server reachable but write failed

An offline banner appears below the header when disconnected.

### Markdown parsing

Items are parsed line by line. Priority is determined by the current section header (`## High priority`, `## Normal`, `## Low priority`, `## WIP`, `## Done`).

Each item line matches: `- [ ] [WIP]? [XN]? title | desc [effort: XS|S|M|L|XL]?` or `- [x] ...`

Extraction order per line:
1. Strip `[WIP]` prefix → sets `isWip`
2. Extract index tag `[O1]`/`[W1]`/`[D1]` → sets `existingSeq` and `existingState`
3. Extract `[effort: X]` tag → sets `effort`
4. Strip `[archived-from: state]` if present
5. Split on first ` | ` → `title` + `desc` (or `desc` only if no pipe)

### Markdown serialization

On commit, the file is reconstructed:
1. Header lines (everything before the first priority section) are preserved verbatim
2. Open items are written in three sections: `## High priority`, `## Normal`, `## Low priority`, sorted by `seq` within each
3. WIP items are written in `## WIP`, sorted by `seq`
4. Done items are written in `## Done`, sorted by `seq`
5. Footer lines (from `## Index` onward) are preserved verbatim

Item line format: `- [state] [WIP ]?[PFX+seq] title | desc [effort: X]`
where `PFX` is `O` / `W` / `D` depending on state.

### Board layout

Three columns: **Open** (blue), **In Progress** (orange), **Done** (green).
Each column has:
- A colored header with centered column title and item count badge
- An active zone (scrollable, flex-grows to `splitPct` %)
- A draggable splitter
- A trash zone (scrollable, flex-grows to `100 - splitPct` %)
- An add-item footer

Within the active zone, items are grouped into priority swimlanes (High / Normal / Low).
Each swimlane has a colored label row and a 2-column CSS grid of cards.

Columns are separated by vertical swimlane dividers (narrow gradient bars).

Split ratio is persisted in `localStorage` under key `todo-tool-split` (default 65%).

### Card design

Each card:
- White background, border-radius 7px
- **3px left border** in priority color (red / indigo / slate)
- **Dirty state**: amber background + amber border (overrides priority border)
- **Trashed state**: light gray background, strikethrough title, reduced opacity

Card header row (flex, aligned):
- **Index badge** — left-aligned; white background; 2px solid border in priority color; bold monospace text (e.g. `O3`)
- **Title** — bold, takes remaining width; italic gray placeholder if no title

Below header:
- Description text — 2-line clamp, click to expand/collapse
- Inline edit form (hidden by default) — title input + description input + Save/Cancel buttons
- Meta row — priority badge (colored) + effort badge (pip icons)

Card action buttons appear on hover (top-right, absolute):
- Active cards: state-change buttons + Edit + ✕ (trash)
- Trashed cards: Restore + Forget

### Effort pip icons

5 vertical bars of increasing height, colored by level:
- XS → 1 bar, sky blue
- S → 2 bars, green
- M → 3 bars, yellow
- L → 4 bars, orange
- XL → 5 bars, red

Inactive bars are the same color at 20% opacity. Clicking the effort badge opens a popover.

### Drag and drop

**Inter-column / inter-lane drop:**
- Dragging a card over a lane (`ondragover` on `.lane-cards`) shows a blue dashed placeholder at the bottom of the lane.
- Dropping changes the card's `state` and `priority` to match the target lane, inserts at the end.

**Intra-lane positional drop:**
- Each card listens to `ondragover` (card-level).
- On hover, the Y position within the card determines before/after: top half = insert before, bottom half = insert after.
- A blue dashed placeholder (`drop-ph`) is injected into the DOM at the computed position.
- On drop, the card is removed from its current position and spliced into the lane's item array at the computed index.
- All items in the lane are renumbered sequentially.

**Trash drop:**
- Dragging a card over the trash zone (`.trash-cards`) highlights it in red.
- Dropping calls `trashItem()`.

**Drag ghost:** native browser drag image (card opacity reduced to 35% during drag).

### Popover (priority / effort)

A fixed-position dark popover appears below the clicked badge.
Options are rendered from arrays; the current value is highlighted.
Clicking outside closes it (document click listener).
On selection, `markDirty()`, `saveWork()`, `reindex()`, `render()`.

### Diff tooltip

Shown on `mouseenter` of dirty cards.
Compares current item fields against `snapshot[id]`.
Only fields that differ are shown, with old value (red strikethrough) and new value (green).
Hidden on `mouseleave`. Positioned at cursor + 12px right.

### Archive view

Opened via the Archive button in the header.
Reads `TODO-archive.md` via `GET /file`.
Parsed line by line: `## YYYY-MM` headers become month labels; `- [x]` lines are parsed for index, title, desc, effort, and `[archived-from: state]` tag.
State badge is color-coded: done (green), open (blue), wip (orange).
Read-only — no modifications possible from this view.

### Add item form

Inline form below each column's active zone.
Fields: title (optional), description, priority (select), effort (select).
Enter key in description field confirms. Escape cancels.
On confirm, new item gets `id = Date.now()`, `seq = max(existing seq) + 1`.

### Configuration

Bootstrap file contains two hardcoded values:
1. Absolute path to `TODO.md`
2. Absolute path to `todo-tool.html`

To set up for a new project:
1. Copy `todo-bootstrap.html` to the project folder
2. Edit both hardcoded paths
3. Open bootstrap once → bookmark the redirected URL
4. Use the bookmark from then on

### State management summary

```
items[]        — active items (open / wip / done)
trashed[]      — items pending archive or forget
snapshot{}     — baseline at last load/commit (for diff)
dirtyIds Set   — ids modified since last commit
dirty bool     — true if working file has unsaved changes
splitPct       — active/trash split ratio (localStorage)
connected bool — server availability
```

All mutations follow: mutate → `markDirty(id)` → `saveWork()` → `render()`.
State changes also call `reindex()` before `render()`.

---

## How to install in a project
[up](#table-of-contents)

This section is written for an AI Assistant performing the installation. Follow the steps in order.

### Step 1 - Register the project folder in the local server

The local server restricts file access to an explicit list of allowed roots.
The project folder must appear in that list or the tool cannot read or write its files.

File to edit: `<kb>/public/tools/start-server.bat`

Add the absolute path to the project folder as an additional argument:

```bat
node "%~dp0local-server.js" ^
  "C:\Users\RemiLequette\...existing roots..." ^
  "C:\Users\RemiLequette\<project-folder>" ^
  --port 3000
```

See `conventions/local-server.md` for the full server model.

### Step 2 - Create TODO.md in the project

Create `TODO.md` at the root of the project folder.
The file must conform to `conventions/todo-list.md` — required sections: Quick Start, Keywords, priority sections (High priority / Normal / Low priority / Done), Index, Changelog.

### Step 3 - Copy and configure the bootstrap file

The bootstrap file is the entry point opened via `file://`. It must be copied into the project folder and adjusted — it cannot be shared because it contains hardcoded absolute paths specific to the project.

**Copy:**
```
<kb>/todo-bootstrap.html  →  <project-folder>/todo-<project>.html
```

**Edit the two variables at the top of the script block:**

```javascript
// ── CONFIGURE THIS FOR EACH PROJECT ──────────────────────────────────────
const TODO_PATH = 'C:/Users/RemiLequette/<project-folder>/TODO.md';
// ─────────────────────────────────────────────────────────────────────────

const TOOL_ABS  = 'C:/Users/RemiLequette/Development/with-claude/knowledgebase/public/tools/todo-tool.html';
```

- `TODO_PATH` — absolute path to `TODO.md` in the project folder (forward slashes)
- `TOOL_ABS` — absolute path to `todo-tool.html` in the KB (forward slashes). This path is fixed — `todo-tool.html` always lives in `<kb>/public/tools/`.

### Step 4 - Open the bootstrap and bookmark the app URL

1. Start `<kb>/public/tools/start-server.bat`
2. Open `todo-<project>.html` via `file://` in the browser
3. The bootstrap redirects to `http://localhost:3000/<absolute-path>/todo-tool.html?todo=<encoded-TODO_PATH>`
4. Bookmark that URL — use it for all future sessions. The bootstrap file is only needed on first open.

---

## Index

| Term | Occurrences |
|------|-------------|

## Changelog

### Version 1.2 - How to install in a project
**Date:** 2026-06-05
**Reason:** The guide covered architecture and features in detail but gave no step-by-step installation instructions for a new project. Added a dedicated section written for an AI Assistant, with explicit file paths, exact variable names to edit in the bootstrap, and ordered steps.

**Changes:**
- Added `## How to install in a project` between `## How` and `## Index`
- Section structured as 4 ordered steps: register allowed root, create TODO.md, copy and configure bootstrap, bookmark app URL
- Bootstrap copy source (`<kb>/todo-bootstrap.html`) and the two variables to edit (`TODO_PATH`, `TOOL_ABS`) named explicitly
- `todo-tool.html` location in KB clarified — shared, never copied
- Table of Contents updated (entry 4 added, Index renumbered to 5)

---

### Version 1.1 - Full WWH with feature-level decomposition
**Date:** 2026-06-04
**Reason:** Initial guide was too high-level. Expanded to cover every feature with its own Why/What/How so the tool can be regenerated from scratch from this document alone.

**Changes:**
- Why: added per-feature rationale sections (kanban layout, card indexes, transaction model, trash zone, explicit archiving, persistent splitter, diff tooltip)
- What: full item model, card index algorithm, complete operation list, persistence model, transaction model, dirty tracking
- How: full technical reference — architecture, file access, parsing, serialization, board layout, card design, effort icons, drag-and-drop (inter-lane + intra-lane positional), popover, diff tooltip, archive view, add form, configuration, state management summary

---

### Version 1.0 - Creation
**Date:** 2026-06-04
**Reason:** Guide for the HTML todo list tool — rationale, model, and architecture.

**Content:**
- Why: token efficiency, reliability, access friction, transaction model rationale
- What: item model, operations, source of truth, concurrency assumption, transaction model
- How: bootstrap architecture, file access via local server, configuration, save behavior, availability indicator
