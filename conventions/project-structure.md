# Project Structure Convention

Convention for the structure of any Claude project — files, folders, and Claude project instructions.

## Quick Start

Source of truth for how any Claude project is structured.
Load when setting up a new project, auditing an existing one, or updating project instructions.
Covers: folder structure, mandatory files, Claude project instructions template, and the INDEX.md bootstrap chain.
Does not cover: content rules for individual files — see conventions/documentation.md.

## Keywords
project-structure, claude-project, instructions, template, bootstrap, Claude.md, PROJECT.md, README.md, folder, scaffold

## Table des matieres

1. [Folder Structure](#folder-structure)
2. [Mandatory Files](#mandatory-files)
3. [Claude Project Instructions Template](#claude-project-instructions-template)
4. [Bootstrap Chain](#bootstrap-chain)

---

## Folder Structure
[up](#table-des-matieres)

Minimal structure for any Claude project:

```
projects/[project-name]/
├── Claude.md          <- AI Assistant entry point
├── PROJECT.md         <- Project metadata
├── README.md          <- Human navigation
├── GLOSSARY.md        <- Project terminology
├── TODO.md            <- Active backlog
└── src/               <- Project-specific files
```

**Rules:**
- Project root folder name = project name (lowercase, hyphens, no spaces)
- No project name in subfolder names — only in the root folder
- All file references inside the project use paths relative to the project root

---

## Mandatory Files
[up](#table-des-matieres)

| File | Purpose | Owner |
|------|---------|-------|
| `Claude.md` | AI Assistant entry point — project-specific setup | AI Assistant |
| `PROJECT.md` | Project metadata — purpose, structure, audit section, glossary pointer | Humans + AI |
| `README.md` | Human navigation — plain language, quick links | Humans |
| `GLOSSARY.md` | Project terminology — domains, terms, cross-references | Humans + AI |
| `TODO.md` | Active backlog — ideas, tasks, improvements | Humans + AI |

**Absence of any mandatory file must be reported at session start and flagged at audit.**

---

## Claude Project Instructions Template
[up](#table-des-matieres)

Instructions saved in the Claude project settings. Keep minimal — 2-3 lines maximum.

```
Project name: [PROJECT-NAME]

Project folder: C:\Users\RemiLequette\Development\projects\[PROJECT-NAME]

Use the `filesystem` MCP tool to read INDEX.md at:
C:\Users\RemiLequette\Development\projects\knowledgebase\INDEX.md

Then use the `filesystem` MCP tool to read Claude.md at the root of the project folder.

WHY: filesystem MCP reads from your local machine, not Claude's Linux container.
INDEX.md bootstraps the session and loads shared conventions.
Claude.md loads project-specific setup.
```

**Notes:**
- Replace `[PROJECT-NAME]` with the actual project name (e.g. `my-data-pipeline`)
- `claude-knowledge` itself skips the INDEX.md step — it IS the knowledge base
- Project name must be consistent across instructions, `Claude.md`, `PROJECT.md`, `README.md`

---

## Bootstrap Chain
[up](#table-des-matieres)

Every session follows this load sequence, defined in `INDEX.md`:

```
Claude project instructions
        |
        v
  INDEX.md  (knowledge base bootstrap + decision layer)
        |
        v
  Claude.md  (project-specific setup)
        |
        v
  [conventions loaded per decision layer]
```

**Single file, zero relay hops.** The instructions point directly to `INDEX.md` — no intermediate files.

---

## Index

| Terme | Occurrences |
|-------|-------------|

---

## Changelog

### Version 1.0 - Creation
**Date:** 2026-05-31
**Raison:** Convention manquante — le template des instructions Claude projet et la structure de projet n'avaient pas de source de verite dedicee. Referencee par guides/project-setup-process.md et guides/best-practices.md.

**Contenu initial :**
- Folder structure : arborescence minimale, regles de nommage
- Mandatory files : tableau des 5 fichiers obligatoires
- Claude project instructions template : modele pret a l'emploi
- Bootstrap chain : sequence de chargement INDEX.md -> Claude.md
