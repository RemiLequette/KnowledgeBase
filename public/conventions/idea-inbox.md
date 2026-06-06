# Idea Inbox Convention

Convention for collecting and processing ideas from multiple input channels into a project workflow.

*Document type: Convention*

## Quick Start

Convention for projects that receive ad hoc ideas or inputs from external channels (email, Notion, etc.).
Covers: channel model, status lifecycle, processing rules, and AI Assistant behavior.
Load when a project uses one or more input channels to import ideas, requests, or tasks for later processing.
Does not cover how processed ideas are integrated into the project backlog — see the project's own task management convention.
For cross-project ideas (an idea arising in one project for another), see `conventions/project-registry.md` — that inbox has no status lifecycle; entries are deleted on triage.

## Keywords
idea-inbox, canal, channel, Gmail, Notion, statut, status, traitement, processing, inbox, import, idées

## Table of Contents

1. [Why](#why)
2. [Model](#model)
3. [Channel Configuration](#channel-configuration)
4. [Processing Rules](#processing-rules)
5. [AI Assistant Behavior](#ai-assistant-behavior)
6. [Index](#index)

## Why
[up](#table-of-contents)

In projects where a responsible person collects ideas outside of structured sessions (on the go, by email, via a shared tool), those ideas risk being lost or duplicated if there is no defined intake mechanism.

The Idea Inbox pattern provides:
- A defined set of **channels** where ideas are deposited
- A **status lifecycle** that prevents double-processing
- A **processing trigger** controlled by the responsible person (not automatic)

This is intentionally lightweight — it is a capture mechanism, not a full task management system.

## Model
[up](#table-of-contents)

### Channel

A **channel** is any external source where ideas are deposited. Each channel has:
- A **source** (Gmail label, Notion database, etc.)
- A **filter** identifying unprocessed entries (label absence, status value, etc.)
- A **processed marker** applied after treatment

### Status lifecycle

Each entry in a channel follows this lifecycle:

```
[Unprocessed] → [In progress / AI feedback] → [Processed]
```

| State | Meaning |
|-------|---------|
| Unprocessed | New entry, not yet handled |
| In progress / AI feedback | Being worked on in the current session |
| Processed | Handled — must never be reprocessed |

### Processing

Processing is **on demand only** — the AI Assistant does not scan channels automatically at session start.

When triggered, the AI Assistant:
1. Reads unprocessed entries from all configured channels
2. Handles each entry (integrates into backlog, discusses, etc.)
3. Marks each entry as processed in its channel

## Channel Configuration
[up](#table-of-contents)

Each project using this convention defines its channels in its own instruction file (e.g. `AssistantIA.md`). The configuration format per channel:

| Field | Description |
|-------|-------------|
| Source | Tool and identifier (Gmail label ID, Notion collection ID, etc.) |
| Unprocessed filter | How to identify entries not yet handled |
| Processed marker | What to apply after treatment (label, status change, etc.) |

### Example - Gmail channel

```
Source: Gmail, label AfrSCM/RSE (id: Label_3232245477144619398)
Unprocessed filter: messages without label AfrSCM/RSE/Traité (id: Label_7)
Processed marker: apply label AfrSCM/RSE/Traité
```

### Example - Notion channel

```
Source: Notion database "Canal AfrScm RSE" (id: e0da8df4-0f89-444a-b6e8-98d990be87de)
Unprocessed filter: entries with status "À faire"
Processed marker: set status to "Traité"
```

## Processing Rules
[up](#table-of-contents)

1. **On demand only** — never process channels automatically at session start
2. **Never reprocess** — an entry already marked as processed must not be read again
3. **Mark after treatment** — apply the processed marker only after the entry has been handled
4. **Confirmation before marking** — follow the project's confirmation rule before modifying channel data (adding labels, changing statuses)

## AI Assistant Behavior
[up](#table-of-contents)

| Situation | Behavior |
|-----------|----------|
| Session start | Do not scan channels unless explicitly requested |
| User requests inbox processing | Read unprocessed entries → handle → propose marking → wait for confirmation |
| Entry already marked processed | Skip without reading |
| Marking requires write access | Apply project confirmation rule before acting |

## Index

| Term | Occurrences |
|------|-------------|

## Changelog

### Version 1.1 - Cross-project inbox reference added
**Date:** 2026-06-06
**Reason:** The cross-project idea inbox (`project-ideas-inbox.md`) follows a different model — no status lifecycle, delete on triage. Added a pointer in Quick Start to avoid confusion.

**Changes:**
- `## Quick Start`: sentence added pointing to `conventions/project-registry.md` for cross-project ideas

---

### Version 1.0 - Creation
**Date:** 2026-06-04
**Reason:** Extracted from ComiteRSE-AfrSCM project (AssistantIA.md § Envoi d'idées) — pattern generalized for reuse across projects.
