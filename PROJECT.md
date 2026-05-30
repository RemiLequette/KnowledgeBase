# Claude Knowledge Base

## Quick Start

Métadonnées du projet claude-knowledge — description, structure, et point d'entrée pour l'audit.
À lire par tout AI Assistant pour comprendre le projet avant de commencer.
Ne contient pas les conventions ni les best practices — voir INDEX.md pour la navigation.

## Purpose
Centralized knowledge repository shared across all Claude projects.
Contains conventions, workflows, and best practices to ensure consistency.

## Structure
- **PROJECT.md** — this file, meta description of the project
- **INDEX.md** — quick context map to decide which folder to load
- **conventions/** — technical and tooling conventions
- **workflows/** — recurring task patterns and processes
- **guides/** — setup instructions and best practices documentation

## Usage
See `INDEX.md` for context on which folder(s) to load based on your task.

For new Claude projects using this knowledge base as a template, see `guides/project-setup.md`.

## Decisions projet

- Les conventions (`conventions/`) et best practices (`guides/best-practices.md`) de ce projet sont **universelles** — elles s'appliquent à tous les projets, pas uniquement à cette KB.
- Chaque convention devrait avoir une best practice associée quand ça a du sens — la BP pointe vers la convention, elle ne duplique pas son contenu.

---

## Glossary

See `GLOSSARY.md` at project root.

---

## Audit

To audit this project's conformance to best practices:

1. Read: `guides/audit-process.md` — The audit methodology
2. Verify against: `guides/best-practices.md` — The best practices

See `guides/audit-process.md` for the complete process.

---

## Keywords
project, knowledge-base, conventions, workflows, guides, structure, audit, metadata

---

## Index

| Terme | Occurrences |
|-------|-------------|

---

## Changelog

### Version 1.1 - Glossary
**Date:** 2026-05-30
**Raison:** Ajout de la section Glossary requise par la convention glossary.md.

**Modifications :**
- Ajout de `## Glossary` avec reference vers GLOSSARY.md

### Version 1.0 - Creation
**Date:** 2026-05-30
**Raison:** Metadonnees du projet claude-knowledge.

**Contenu initial :**
- Purpose, Structure, Usage
- Decisions projet (universalite des conventions)
- Section Audit
