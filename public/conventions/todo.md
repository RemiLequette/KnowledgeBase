# Todo Convention

Convention for the lightweight backlog of any project — ideas, improvements, tasks.

## Quick Start

Defines how to structure and use a lightweight backlog in a project.
Load when creating or manipulating a `TODO.md` file, or when an AI Assistant needs to add items during a session.
Does not cover bug tracking, tests, or development tasks.

## Keywords
todo, backlog, tasks, ideas, tracking, priority, session, archiving

## Scope

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

- **Capture** — add an item at any time during a session
- **Priority** — high / normal / low
- **State** — open / in progress / done
- **Archiving** — done items are moved to `TODO-archive.md`, never deleted

### AI Assistant role

An AI Assistant may only modify `TODO.md` or `TODO-archive.md` with **explicit user approval**.

This includes: adding, modifying, moving, or archiving an item.

## Files

Two files at the project root:

- **`TODO.md`** — active items (open and in progress)
- **`TODO-archive.md`** — done items (history)

When an item is marked done, it is moved from `TODO.md` to `TODO-archive.md`.

## Format

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

- [ ] Task description
- [ ] [WIP] Task in progress

## Normal

- [ ] Task description

## Low priority

- [ ] Task description

## Index

| Term | Occurrences |
|------|-------------|

## Changelog

### Version X.Y - ...
```

**States:**
- `- [ ]` — open
- `- [ ] [WIP]` — in progress
- `- [x]` — done (move to `TODO-archive.md`)

### TODO-archive.md

```markdown
# TODO Archive

## YYYY-MM

- [x] Done task description
```

Archived items are grouped by completion month.

## Index

| Term | Occurrences |
|------|-------------|

## Changelog

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
