# Claude Knowledge Base

## Quick Start

Navigation humaine pour le projet claude-knowledge.
Point d'entrée pour les humains : liens vers les fichiers clés, architecture du projet, description.
Pour un AI Assistant, lire `public/INDEX.md` à la place.

Welcome to your centralized knowledge repository for managing Claude projects systematically.

---

## Quick Navigation

**New to this project?**
- Start here: `public/INDEX.md`

**Setting up a new Claude project?**
- Read: `public/guides/project-setup-process.md`

**What are the design principles?**
- Read: `public/guides/best-practices.md`

**Auditing a project for conformance?**
- Read: `public/guides/audit-process.md`

**Practical how-to guides (for you)?**
- Browse: `howto/`

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
│     best-practices.md                            │
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
knowledgebase/
├── public/                ← KB folder for Claude projects
│   ├── INDEX.md           ← Bootstrap + decision layer (AI entry point)
│   ├── conventions/       ← Technical standards & patterns
│   ├── guides/            ← Setup & best practices documentation
│   └── tools/             ← Development tooling
├── PROJECT.md             ← Project metadata
├── README.md              ← This file
├── GLOSSARY.md            ← Project terminology
├── TODO.md                ← Active backlog
├── howto/                 ← Practical guides for humans
└── tmp/                   ← Temporary working files
```

---

## What This Is

A **reusable knowledge base** for structuring Claude projects with:
- **Conventions** — How to use tools, patterns, and standards
- **Guides** — Best practices and setup instructions
- **Tools** — Development utilities

Each new Claude project references this knowledge base (`public/`), ensuring consistency across all projects.

---

## Key Files

| File | Purpose |
|------|--------|
| `public/INDEX.md` | Bootstrap + content map — session entry point for AI Assistants |
| `PROJECT.md` | Metadata and how to audit this project |
| `public/guides/project-setup-process.md` | How to create a new Claude project |
| `public/guides/best-practices.md` | 15 design principles for Claude projects |
| `public/guides/audit-process.md` | How to audit a project |

---

## For Humans & AI

This repository works for:
- **AI Assistants** — Bootstrap via `public/INDEX.md` (loaded from Claude project instructions)
- **You** — Start with `README.md` (this file), browse `howto/` for practical guides
- **Teams** — See `public/guides/project-setup-process.md` for setting up shared projects

---

## Next Steps

1. **Explore:** Browse `public/INDEX.md` to see what's available
2. **Setup:** Use `public/guides/project-setup-process.md` to create a new project
3. **Learn:** Read the best practices in `public/guides/best-practices.md`
4. **Audit:** Use `public/guides/audit-process.md` to audit a project

---

## Keywords
readme, navigation, knowledge-base, human, quickstart, architecture, structure, public

---

## Index

| Terme | Occurrences |
|-------|-------------|

---

## Changelog

### Version 1.2 - Restructuration public/
**Date:** 2026-05-31
**Raison:** Contenu public deplace dans public/. Ajout de howto/. Tous les liens mis a jour.

**Modifications :**
- Quick Navigation : tous les liens mis a jour vers public/
- Structure : arborescence complete revue (public/ + howto/ + racine interne)
- Key Files : table mise a jour avec chemins public/
- For Humans & AI : reference public/INDEX.md, mention de howto/
- Next Steps : liens mis a jour
- Keywords : ajout de `public`

---

### Version 1.1 - Mise a jour post-refactoring
**Date:** 2026-05-31
**Raison:** README obsolete apres suppression de Claude.md, KNOWLEDGEBASE.md, workflows/. Liens et structure corriges.

**Modifications :**
- Quick Navigation : point d'entree corrige (INDEX.md au lieu de Claude.md)
- Structure : workflows/ et Claude.md supprimes, tools/ et tmp/ ajoutes
- Key Files : table mise a jour (INDEX.md en tete, liens corriges)
- For Humans and AI : reference a session-startup supprimee
- Next Steps : liens corriges

---

### Version 1.0 - Creation
**Date:** 2026-05-30
**Raison:** Navigation humaine pour le projet claude-knowledge.

**Contenu initial :**
- Quick Navigation vers les fichiers cles
- Architecture du projet (diagramme)
- Structure des dossiers
- Description du projet
