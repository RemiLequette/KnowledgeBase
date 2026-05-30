# Claude Knowledge Base

## Quick Start

Navigation humaine pour le projet claude-knowledge.
Point d'entrée pour les humains : liens vers les fichiers clés, architecture du projet, description.
Pour un AI Assistant, lire Claude.md à la place.

Welcome to your centralized knowledge repository for managing Claude projects systematically.

---

## Quick Navigation

**New to this project?**
- Start here: `Claude.md`

**Setting up a new Claude project?**
- Read: `guides/project-setup-process.md`

**What are the design principles?**
- Read: `guides/best-practices.md` (15 best practices)

**Auditing a project for conformance?**
- Read: `guides/audit-process.md`

**Looking for a specific convention or workflow?**
- Check: `INDEX.md` (quick overview of all folders)

---

## Architecture

This knowledge base follows a **reference-based architecture**:

```
┌──────────────────────────────────────────────────┐
│         PROCESSES (Niveau Application)           │
│  ┌──────────────────┐    ┌──────────────────┐   │
│  │ audit-process    │    │ project-setup-   │   │
│  │                  │    │ process          │   │
│  │ Vérifier que le  │    │ Créer un nouveau │   │
│  │ projet respecte  │    │ projet respectant│   │
│  │ les practices    │    │ les practices    │   │
│  └────────┬─────────┘    └────────┬─────────┘   │
└───────────┼──────────────────────┼──────────────┘
            │                      │
            └──────────┬───────────┘
                       ↓
┌──────────────────────────────────────────────────┐
│        REFERENCE (Fondation)                     │
│     best-practices.md                             │
│     15 Design Principles                         │
└──────────────────────────────────────────────────┘
```

**How it works:**
- **Best Practices** are the single source of truth
- **Audit Process** verifies projects conform to best practices
- **Setup Process** creates new projects that follow best practices
- Both processes reference only the best practices — no duplication

---

## Structure

```
claude-knowledge/
├── Claude.md              ← Instructions for Claude sessions
├── PROJECT.md             ← Project metadata
├── INDEX.md               ← Quick index of all content
├── README.md              ← This file
├── conventions/           ← Technical standards & patterns
├── workflows/             ← Recurring processes
└── guides/                ← Setup & best practices documentation
```

---

## What This Is

A **reusable knowledge base** for structuring Claude projects with:
- **Conventions** — How to use tools, patterns, and standards
- **Workflows** — Step-by-step procedures (startup, auditing, etc.)
- **Guides** — Best practices and setup instructions

Each new Claude project references this knowledge base, ensuring consistency across all projects.

---

## Key Files

| File | Purpose |
|------|---------|
| `Claude.md` | Instructions for Claude sessions using this KB |
| `PROJECT.md` | Metadata and how to audit this project |
| `INDEX.md` | Content map — what's in each folder & keywords |
| `guides/project-setup.md` | How to create a new Claude project |
| `guides/best-practices.md` | 15 design principles for Claude projects |
| `guides/audit-process.md` | How to audit a project |

---

## For Humans & AI

This repository works for:
- **Claude** — Reads via `Claude.md` and `session-startup.md`
- **You** — Start with `README.md` (this file) or `Claude.md`
- **Teams** — See `guides/project-setup.md` for setting up shared projects

---

## Next Steps

1. **Explore:** Browse `INDEX.md` to see what's available
2. **Setup:** Use `guides/project-setup.md` to create a new project
3. **Learn:** Read the best practices in `guides/best-practices.md`
4. **Audit:** Use `guides/audit-process.md` to audit a project

---

## Keywords
readme, navigation, knowledge-base, human, quickstart, architecture, structure

---

## Index

| Terme | Occurrences |
|-------|-------------|

---

## Changelog

### Version 1.0 - Creation
**Date:** 2026-05-30
**Raison:** Navigation humaine pour le projet claude-knowledge.

**Contenu initial :**
- Quick Navigation vers les fichiers cles
- Architecture du projet (diagramme)
- Structure des dossiers
- Description du projet
