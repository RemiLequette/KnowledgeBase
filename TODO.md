# TODO

Backlog léger de la Knowledge Base — idées, améliorations, tâches.

## Quick Start

Backlog léger de la Knowledge Base.
Contient les tâches ouvertes et en cours, classées par priorité.
Les tâches terminées sont archivées dans `TODO-archive.md`.

## Keywords
todo, backlog, knowledge-base, tâches, idées, améliorations

## Table of Contents

1. [Haute priorité](#haute-priorité)
2. [Normale](#normale)
3. [Basse priorité](#basse-priorité)
4. [Index](#index)

## Haute priorité
[up](#table-of-contents)

- [ ] **Bootstrap robustesse** — La convention `documentation.md` + `md-doc-usage.md` est definie dans l'INDEX.md (KB) mais pas dans les fichiers projet (`AssistantIA.md`). Un AI Assistant qui demarre sur un sujet metier charge le projet sans passer par le bootstrap KB et cree des fichiers .md non conformes. Solution : ajouter la regle de chargement directement dans le template `AssistantIA.md` de chaque projet (section "Chargement au debut de chaque session") + regle declencheur sur l'action ("avant toute creation/modification d'un .md, charger documentation.md et md-doc-usage.md si pas deja fait"). Constate sur projet ComiteRSE-AfrSCM session 2026-06-01.

- [ ] **Scope Rule — acces filesystem vs autorisation** — Un AI Assistant confond "techniquement accessible via MCP filesystem" avec "autorise par la Scope Rule". Le TODO.md de la KB racine est accessible via MCP mais hors perimetre public/ — l'AI Assistant aurait du repondre "non, pas sans autorisation explicite" au lieu de confirmer l'acces. Clarifier la Scope Rule dans l'INDEX pour distinguer acces technique et acces autorise, et preciser le comportement attendu de l'AI Assistant.

## Normale
[up](#table-of-contents)

- [ ] **Add Design document type** — Add `Design document` to the taxonomy in `conventions/documentation-style.md`. Define style, WWH obligations, and examples. Deferred from session 2026-06-03.
- [ ] Review and update `guides/guide-maintenance.md` — cleanup French, references to Claude.md and old BP numbers
- [ ] md-doc Index support — inline anchor tags (`<a id="index-term-N">`) currently point nowhere; implement renderer support so index references resolve correctly
- [ ] md-doc Citations support — implement cross-document citation resolution; consider renaming Citations to References
- [ ] md-doc Changelog support — add/update Changelog entries via md-doc (new command or extension of update)
- [ ] Rename `conventions/` folder to `contracts/`
- [ ] Best practices — vérifier que `guides/best-practices.md` référence la convention `todo.md`
- [ ] Rename artifact scripts to English — `ouvrir-revision.js` → `open-revision.js`, `cloturer-revision.js` → `close-revision.js`. Update references in `conventions/artifact.md` and all specialization files.
- [ ] Document GitHub Pages as a publication pattern — create `conventions/github-pages.md` covering the static site publication pattern (embedded variables, injection script, publication conditions). `artifact.md` currently references a project-level `github-pages.md`; the convention should document the generic pattern independently of any specific project.
- [ ] Document Git workflow for AI Assistants — create `conventions/git.md` covering: commit before large rewrites, commit message format, when to suggest a commit, how an AI Assistant can execute Git operations via the commands MCP. Enables AI Assistants to manage Git directly rather than delegating all commits to the user.
- [ ] Consider externalizing Changelogs from documents — Changelogs are loaded with every document but rarely needed in context. Explore moving them to separate `<filename>-changelog.md` files or a shared `CHANGELOG.md` per folder. Evaluate token savings vs navigation cost. Consider impact on tooling (md-doc, conformance checks).

## Basse priorité
[up](#table-of-contents)

- [ ] **Convention version control / git tagging** — Aucune convention de tagging git dans la KB. Définir : format des tags (semver, date, nom de convention ?), quand tagger (après chaque convention majeure ? après chaque session ?), workflow recommandé. À créer comme convention ou guide.

## Index

| Term | Occurrences |
|------|-------------|

## Changelog

### Version 1.6 - Externalize Changelogs idea
**Date:** 2026-06-04
**Reason:** Changelogs loaded with every document consume tokens and attention unnecessarily.

**Modifications:**
- Normale: added `Consider externalizing Changelogs from documents`

### Version 1.5 - artifact.md feedback items
**Date:** 2026-06-04
**Reason:** Three items identified during artifact.md creation session.

**Modifications:**
- Normale: added `Rename artifact scripts to English`
- Normale: added `Document GitHub Pages as a publication pattern`
- Normale: added `Document Git workflow for AI Assistants`

### Version 1.4 - Add Design document type todo
**Date:** 2026-06-03
**Reason:** Design document type deferred from documentation-style.md session.

**Modifications:**
- Normale: added `Add Design document type`

### Version 1.3 - Convention version control / git tagging
**Date:** 2026-06-01
**Raison:** Todo créé en session DDScope — aucune convention de tagging git dans la KB.

**Modifications :**
- Basse priorité : ajout `Convention version control / git tagging`

### Version 1.2 - Ajout md-doc Changelog support
**Date:** 2026-06-01
**Raison:** Idée notée en session ComiteRSE-AfrSCM — support des entrées Changelog dans md-doc.

**Modifications :**
- Normale : ajout `md-doc Changelog support`

### Version 1.1 - Mise en conformité documentation
**Date:** 2026-06-01
**Raison:** TODO.md non conforme — ajout Quick Start, Keywords, Index, Changelog.

**Modifications :**
- Ajout `## Quick Start`
- Ajout `## Keywords`
- Ajout `## Index`
- Ajout `## Changelog`

### Version 1.0 - Création
**Date:** 2026-05-30
**Raison:** Backlog léger de la Knowledge Base.
