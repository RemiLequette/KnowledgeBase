# Project Registry Convention

Convention for the centralized project directory and cross-project idea inbox.

*Document type: Convention*

## Quick Start

Defines two shared artifacts living in the Knowledge Base:
- `public/projects.md` — a directory of all projects using this KB
- `public/project-ideas-inbox.md` — a cross-project idea inbox

Load when registering a new project, querying project dependencies, or posting an idea to another project.
Does not cover per-project task management — see `conventions/todo-list.md`.
Does not cover per-project idea channels (email, Notion) — see `conventions/idea-inbox.md`.

## Keywords
project-registry, projects, directory, dependencies, cross-project, idea-inbox, inbox, triage, registration

## Table of Contents

1. [Why](#why)
2. [Model](#model)
3. [Project Directory](#project-directory)
4. [Cross-Project Idea Inbox](#cross-project-idea-inbox)
5. [AI Assistant Behavior](#ai-assistant-behavior)
6. [Index](#index)

## Why
[up](#table-of-contents)

Projects using the same KB share conventions and may share tools, data, or outputs. Without a central directory, an AI Assistant working on one project has no reliable way to locate another project, understand its purpose, or identify dependencies — it must either guess or ask.

Without a cross-project idea inbox, ideas that arise during a session for another project are either lost, pollute the current project's TODO, or require switching context. A lightweight inbox allows capture with minimum friction and deferred triage in the target project.

## Model
[up](#table-of-contents)

### Two artifacts

| Artifact | Location | Purpose |
|----------|----------|---------|
| Project directory | `public/projects.md` | Static registry — what projects exist, where they are, how they relate |
| Idea inbox | `public/project-ideas-inbox.md` | Dynamic queue — ideas posted for other projects, consumed on triage |

### Project entry

Each project is described by a minimal set of fields. A project entry is self-contained — readable without loading any other file.

### Idea lifecycle

```
Posted (in inbox) → Triaged (removed from inbox, added to target project TODO)
```

No intermediate states. No log. An idea is either in the inbox or it has been consumed.

Triage is **on demand** — done in a dedicated session in the target project, not automatically at session start.

## Project Directory
[up](#table-of-contents)

### File: `public/projects.md`

Governed by `conventions/documentation.md`. Document type: Reference.

### Entry format

Each project is a `###` subsection under a `## Projects` section:

```markdown
### Project Name

- **Tag:** `project-name`
- **Path:** C:\Users\...\ProjectFolder
- **Status:** active
- **Description:** One sentence — what this project does or produces.
- **Uses KB conventions:** convention-a.md, convention-b.md
- **Depends on:** Other Project Name — reason
```

**Fields:**

| Field | Required | Description |
|-------|----------|-------------|
| Tag | Yes | Short lowercase identifier for this project — used as inbox channel and general project reference |
| Path | Yes | Absolute local path to the project root |
| Status | Yes | `active` or `archived` |
| Description | Yes | One sentence, plain English |
| Uses KB conventions | No | Comma-separated list of conventions actively used |
| Depends on | No | Other projects this project reads from or writes to, with reason |

### Registration

A project registers itself by adding an entry to `public/projects.md`. The AI Assistant may draft the entry; the human confirms before writing.

Minimum viable entry: Path, Status, Description, Idea inbox tag.

### Keeping entries current

Update the entry when: the project is archived, a dependency changes, or a new convention is adopted. There is no automated sync — entries reflect the last manual update.

## Cross-Project Idea Inbox
[up](#table-of-contents)

### File: `public/project-ideas-inbox.md`

Governed by `conventions/documentation.md`. Document type: Log (append-only until triage removes entries).

### Posting an idea

Anyone working in any project can post an idea for another project at any time. Format:

```markdown
- `target-tag` | Idea text. [effort: S] [date: YYYY-MM-DD]
- `target-tag/subchannel` | Idea text. [date: YYYY-MM-DD]
```

The default channel is the project tag alone. A subchannel can be appended with `/` for finer routing (e.g. `kb-maintenance/conventions`). Subchannels are optional — define them in the target project's own documentation if used.

**Fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `target-tag` | Yes | Tag of the destination project — must match an entry in `projects.md` |
| `/subchannel` | No | Optional routing within the target project |
| Idea text | Yes | Free text — what the idea is |
| `[effort: XS/S/M/L/XL]` | No | Rough sizing, same scale as `conventions/todo-list.md` |
| `[date: YYYY-MM-DD]` | No | Date posted — helps during triage to assess staleness |

### Triage

Triage is done in a dedicated session in the target project:

1. Read all entries tagged with the project's inbox tag
2. For each entry: decide to promote to TODO, discard, or defer
3. Remove processed entries from the inbox file (delete the line)
4. Add promoted ideas to the project's `TODO.md` following `conventions/todo-list.md`

No archiving. No log. Removed entries leave no trace in the inbox — the target project's TODO is the record of what was accepted.

### Rules

- **Post freely** — no approval needed to add an entry to the inbox
- **Triage on demand** — never process the inbox automatically at session start
- **Remove on consume** — delete the line after processing, regardless of outcome
- **No state tracking** — do not add processed/done markers; remove instead
- **Inbox tag must exist** — only post to a tag declared in `public/projects.md`

## AI Assistant Behavior
[up](#table-of-contents)

| Situation | Behavior |
|-----------|----------|
| Session start | Do not read the inbox unless explicitly requested |
| User asks about another project | Read `public/projects.md` — do not browse the other project's files unless the user asks |
| User wants to post an idea to another project | Draft the inbox entry, confirm with user, then append to `public/project-ideas-inbox.md` |
| User triggers inbox triage | Read entries for the current project's tag, handle each, remove processed lines, confirm before writing |
| Registering a new project | Draft the `projects.md` entry, confirm with user before writing |
| Inbox tag not found in `projects.md` | Flag it — do not post to an unregistered tag |

## Index

| Term | Occurrences |
|------|-------------|

## Changelog

### Version 1.2 - Tag as primary project identifier + subchannels
**Date:** 2026-06-06
**Reason:** Tag generalized as the primary identifier of a project (not just for the inbox). Subchannels added as optional syntax for finer inbox routing.

**Changes:**
- `### Entry format`: `Idea inbox tag` field renamed `Tag`, moved to first position
- `### Fields` table: `Tag` row replaces `Idea inbox tag`
- `### Posting an idea`: subchannel syntax `target-tag/subchannel` added; explanation paragraph added
- `### Fields` table in inbox: `/subchannel` row added

---

### Version 1.1 - Entry format — list instead of table
**Date:** 2026-06-06
**Reason:** Markdown table inside a code block rendered poorly. Replaced with bold key-value list, consistent with other KB conventions.

**Changes:**
- `### Entry format`: code block replaced — table replaced by `- **Field:** value` list

---

### Version 1.0 - Creation
**Date:** 2026-06-06
**Reason:** New convention — centralized project directory and cross-project idea inbox.
