# Todo List Convention

Convention for the lightweight backlog of any project — ideas, improvements, tasks.

## Quick Start

Defines how to structure and use a lightweight backlog in a project.
Load when creating or manipulating a `TODO.md` file, or when an AI Assistant needs to add items during a session.
Does not cover bug tracking, tests, or development tasks.

## Keywords
todo, backlog, tasks, ideas, tracking, priority, session, archiving

## Table of Contents

1. [Scope](#scope)
2. [Features](#features)
3. [Files](#files)
4. [Format](#format)
5. [Index](#index)

## Scope
[up](#table-of-contents)

The todo list is a **lightweight backlog** — it captures ideas and tasks for a project.

**In scope:**
- Improvement ideas
- Tasks identified during a session or audit
- Features to explore

**Out of scope:**
- Bugs and technical fixes
- Development and test tasks
- Detailed project management

## Features
[up](#table-of-contents)
- **Capture** — add an item at any time during a session
- **Priority** — high / normal / low
- **State** — open / in progress / done
- **WIP** — the set of all `[WIP]` items in `TODO.md`. Represents what is currently in progress across sessions. An item can be created directly in `[WIP]` state without going through `open` first. The WIP is the bridge between sessions: a session closes by reviewing WIP items, the next session opens by reading them.
- **Effort** — optional sizing tag `[effort: XS/S/M/L/XL]` to help prioritize, plan sessions, and assess delivery capacity
- **Title and description** — optional short title; description is the main text
- **Card index** — short stable identifier per card (`[O1]`, `[W1]`, `[D1]`) to reference items unambiguously, especially when talking to an AI Assistant
- **Archiving** — explicit action; trashed items go to `TODO-archive.md` on Save; forgotten items disappear permanently

### AI Assistant role

An AI Assistant may only modify `TODO.md` or `TODO-archive.md` with **explicit user approval**.

This includes: adding, modifying, moving, or archiving an item.

An AI Assistant may propose titles for items that have none.

Card indexes are managed by the tool, not by the AI Assistant. The AI Assistant may reference items by their index (e.g. "let's work on W3") but must not assign or modify indexes manually.

## Files
[up](#table-of-contents)
Three files at the project root:

- **`TODO.md`** — active items (open, in progress, done)
- **`TODO-archive.md`** — archived items (trashed items saved on commit)
- **`TODO-work.json`** — working state between commits (managed by tool, committable to Git)

Items are never automatically moved from `TODO.md` to `TODO-archive.md`. Archiving is always explicit:
- **Trash → Save** — trashed items are moved to `TODO-archive.md` with their original state preserved
- **Forget** — item is permanently deleted, no trace in archive

Done items remain in `TODO.md` until trashed or kept deliberately.

## Format
[up](#table-of-contents)
### TODO.md

`TODO.md` must conform to the documentation convention (`conventions/documentation.md`) — it requires `## Quick Start`, `## Keywords`, `## Index`, and `## Changelog`.

Content sections follow the priority structure:

```markdown
# TODO

Short description of the project backlog.

## Quick Start

## Keywords
todo, backlog, <project-name>

## High priority

- [ ] [O1] Short title | Optional longer description [effort: M]
- [ ] [O2] Task without title [effort: S]
- [ ] [WIP] [W1] Short title | Description in progress [effort: L]

## Normal

- [ ] [O3] Short title
- [ ] Task without index yet

## Low priority

- [ ] [O4] Short title | Optional description

## Done

- [x] [D1] Completed task | Description [effort: S]

## Index

| Term | Occurrences |
|------|-------------|

## Changelog

### Version X.Y - ...
```

**States:**
- `- [ ]` — open
- `- [ ] [WIP]` — in progress
- `- [x]` — done (stays in `TODO.md` until explicitly trashed)

**Title and description (optional):**
- Format: `Short title | Optional longer description`
- Separator: ` | ` (space-pipe-space)
- Title: short, self-contained — what the item is at a glance
- Description: optional detail, context, or acceptance criteria
- Items without a ` | ` separator are treated as description-only (no title) — fully backward-compatible
- The effort tag is always placed at the end of the line, after title and description

**Card index (optional, managed by tool):**
- Format: `[O1]`, `[O2]`, … for open items; `[W1]`, `[W2]`, … for WIP; `[D1]`, `[D2]`, … for done
- Placed after the state marker and `[WIP]` tag, before the title/description
- Generated and maintained by the todo tool — do not write or modify manually
- Items without an index are assigned one by the tool on load or refresh
- Indexing algorithm:
  1. Items with an existing index are placed first in their column, in index order
  2. Items without an index are appended in file order
  3. Indexes are renumbered sequentially from 1
- D&D reordering within a column updates the index sequence
- Index is preserved in `TODO-archive.md` for traceability
- On restore from trash: item goes to the end of its column (highest index), unless repositioned by D&D

**Effort tag (optional):**
- `[effort: XS]` / `[effort: S]` / `[effort: M]` / `[effort: L]` / `[effort: XL]`
- Placed at the end of the item line
- Preserved when the item is archived

### TODO-archive.md

```markdown
# TODO Archive

## YYYY-MM

- [x] [D1] Done task [archived-from: done]
- [x] [O2] Short title | Description [effort: M] [archived-from: open]
- [x] [W1] Short title [archived-from: wip]
```

Archived items are grouped by archiving month.
The `[archived-from: state]` tag records the item's state at the time of archiving — this allows distinguishing completed work (`done`) from discarded items (`open`, `wip`).
Card indexes are preserved.

## Index

| Term | Occurrences |
|------|-------------|

## Changelog
### Version 2.5 - WIP as a first-class session concept
**Date:** 2026-06-06
**Reason:** WIP existed only as a format state (`[WIP]` tag). Elevated to a first-class session concept: the set of all `[WIP]` items is the bridge between sessions. An item can be created directly in `[WIP]` state.

**Changes:**
- Features: `WIP` block added after `State`

---

### Version 2.4 - Explicit archiving and archived-from tag
**Date:** 2026-06-04
**Reason:** Automatic archiving of done items at Save was too implicit. Done items should remain visible until explicitly removed. Trashed items going to archive with their original state allows distinguishing completed work from discarded items.

**Changes:**
- Features: `Archiving` updated — explicit action, trash→archive on Save, forget=permanent delete
- Files: section rewritten — three files listed; archiving rules made explicit; done items stay in TODO.md
- Format / TODO.md: `## Done` section added to skeleton example
- Format / TODO.md: States block updated — done stays in TODO.md until trashed
- Format / TODO-archive.md: format updated — `[archived-from: state]` tag added; month label changed to archiving month

---

### Version 2.3 - Card index
**Date:** 2026-06-04
**Reason:** Stable short identifiers per card allow unambiguous reference to items, especially when discussing the backlog with an AI Assistant (e.g. "let's work on W3").

**Changes:**
- Features: added `Card index`
- Features / AI Assistant role: added note on index ownership — tool manages, AI references only
- Format / TODO.md: item format updated — optional `[O1]`/`[W1]`/`[D1]` tag after state marker
- Format / TODO.md: `Card index` block added — format, placement, algorithm, archive behavior
- Format / TODO-archive.md: example updated to show index preserved

---

### Version 2.2 - Title and description
**Date:** 2026-06-04
**Reason:** A todo item is a single line of text with no way to separate a short label from a longer description. The visual tool needs a title to display on the card. Items without a title remain valid (backward-compatible).

**Changes:**
- Features: added `Title and description`
- Features / AI Assistant role: added note — AI may propose titles for items that have none
- Format / TODO.md: item format updated — optional `title | description` with ` | ` separator
- Format / TODO.md: `Title and description` block added after States
- Format / TODO-archive.md: example updated to show title/description format

---

### Version 2.1 - Effort sizing tag
**Date:** 2026-06-04
**Reason:** Allow quick effort sizing to help prioritize, plan sessions, and assess delivery capacity.

**Changes:**
- Features: added `Effort` — optional tag `[effort: XS/S/M/L|XL]`
- Format / TODO.md: examples updated to show effort tag usage
- Format / TODO.md: `Effort tag` block added after States
- Format / TODO-archive.md: example updated to show effort tag preserved on archiving

---

### Version 2.0 - Full translation to English + documentation convention compliance
**Date:** 2026-05-31
**Reason:** Document was written in French, violating the documentation convention. TODO.md format updated to require compliance with documentation convention.

**Changes:**
- Full content translated to English
- Subtitle added
- Quick Start rewritten in English
- Keywords updated
- Sections renamed: Perimetre -> Scope, Fonctionnalites -> Features, Fichiers -> Files
- Format updated: TODO.md must now conform to documentation convention

---

### Version 1.0 - Creation
**Date:** 2026-05-30
**Raison:** Convention pour le backlog leger de tout projet.
