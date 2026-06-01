# Project Knowledge Base Maintenance

## Quick Start

Project dedicated to the maintenance of the Knowledge Base shae by all AI Assited projects.

## Purpose
Centralized knowledge repository shared across all projects.
Contains conventions, workflows, and best practices to ensure consistency.

## Structure

### public/ — is the part accessible to all projects
THe rest is private to the project and supports the maintenance of the public psart
See `public/INDEX.md` for the full navigation map.

```
public/
├── INDEX.md         ← session bootstrap + decision layer
├── conventions/     ← technical conventions
├── guides/          ← setup & best practices guides
└── tools/           ← development tooling
```

### Project files — specific to this KB project
- **PROJECT.md** — this file
- **README.md** — human navigation
- **GLOSSARY.md** — project terminology
- **TODO.md** — active backlog
- **howto/** — practical guides for humans
- **tmp/** — temporary working files (not committed)


---

## KB Maintenance

**When to add content:**
- A tool behaves unexpectedly and a workaround is found — document it.
- A pattern proves reliable across multiple sessions — promote it.
- The designer explicitly asks to remember something technical — it belongs here, not in ephemeral memory.
- An innovation improves quality or reduces token cost noticeably — capture it.

**How to add:**
- Check `public/INDEX.md` first — the convention may already exist or belong in an existing file.
- Create a new file in `public/conventions/` if the topic is distinct enough to stand alone.
- Always update `public/INDEX.md` after adding or modifying a file — it is the entry point for every session.

**Format:** English only. Concise. Actionable. Prefer rules and examples over prose explanations.

**Guard rail:** Never propose changes to KB files unless the current project is the KB itself. In other projects, propose to document a finding instead.

## Decisions projet

- Les conventions (`public/conventions/`) et best practices (`public/guides/best-practices.md`) de ce projet sont **universelles** — elles s'appliquent à tous les projets, pas uniquement à cette KB.
- Chaque convention devrait avoir une best practice associée quand ça a du sens — la BP pointe vers la convention, elle ne duplique pas son contenu.

---

## Glossary

See `GLOSSARY.md` at project root.

---

## Audit

To audit this project's conformance to best practices:

1. Read: `public/guides/audit-process.md` — The audit methodology
2. Verify against: `public/guides/best-practices.md` — The best practices

See `public/guides/audit-process.md` for the complete process.

---

## Keywords
project, knowledge-base, conventions, workflows, guides, structure, audit, metadata

---

## Index

| Terme | Occurrences |
|-------|-------------|

---

## Changelog

### Version 1.5 - Restructuration public/
**Date:** 2026-05-31
**Raison:** Contenu public de la KB deplace dans public/. Tous les chemins mis a jour. Ajout de howto/ dans la structure projet.

**Modifications :**
- Quick Start : reference mise a jour (public/INDEX.md)
- Structure : section public/ ajoutee avec arborescence, tools/ retire de la racine
- Structure projet : ajout de howto/
- Usage : liens mis a jour vers public/
- KB Maintenance : liens mis a jour vers public/
- Decisions projet : chemins mis a jour
- Audit : chemins mis a jour

---

### Version 1.4 - Structure simplifiee
**Date:** 2026-05-31
**Raison:** Section Structure redondante avec INDEX.md. Simplifiee pour pointer vers INDEX.md pour la KB universelle.

**Modifications :**
- `## Structure` : KB universelle remplacee par un pointeur vers INDEX.md

---

### Version 1.3 - Structure clarifiee
**Date:** 2026-05-31
**Raison:** Structure obsolete (workflows/ supprime, KNOWLEDGEBASE.md et Claude.md supprimes). Distinction KB universelle / fichiers projet absente. Lien project-setup.md incorrect.

**Modifications :**
- `## Structure` reecrite : separation KB universelle vs fichiers projet
- `## Usage` : lien corrige vers `project-setup-process.md`, reference INDEX.md pour le bootstrap

---

### Version 1.2 - KB Maintenance section
**Date:** 2026-05-31
**Raison:** Migration des regles editoriales depuis INDEX.md vers PROJECT.md — separation maintenance / navigation.

**Modifications :**
- Ajout de `## KB Maintenance` avec regles "When to add", "How to add", "Format", "Guard rail"

---

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
