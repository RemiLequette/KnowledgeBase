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

- [ ] Bootstrap robustesse | Convention `documentation.md` + `md-doc-usage.md` absente du template AssistantIA.md — un AI démarrant sur un sujet métier crée des .md non conformes. Ajouter règle de chargement dans AssistantIA.md + déclencheur sur création/modification .md. Constaté sur ComiteRSE-AfrSCM 2026-06-01.

- [ ] Scope Rule — accès vs autorisation | AI confond accès technique MCP avec autorisation Scope Rule. Clarifier dans INDEX : distinguer accès technique et accès autorisé, préciser comportement attendu de l'AI Assistant.

## Normale
[up](#table-of-contents)

- [ ] Add Design document type | Add Design document to taxonomy in documentation-style.md. Define style, WWH obligations, examples. Deferred 2026-06-03.
- [ ] Cleanup guide-maintenance.md | Fix French, remove references to Claude.md and old BP numbers.
- [ ] md-doc Index support | Inline anchor tags currently point nowhere — implement renderer support so index references resolve correctly.
- [ ] md-doc Citations support | Implement cross-document citation resolution. Consider renaming Citations to References.
- [ ] md-doc Changelog support | Add/update Changelog entries via md-doc — new command or extension of update.
- [ ] Rename conventions/ to contracts/
- [ ] Best practices → todo.md reference | Vérifier que guides/best-practices.md référence la convention todo.md.
- [ ] Rename artifact scripts to English | ouvrir-revision.js → open-revision.js, cloturer-revision.js → close-revision.js. Update references in artifact.md and specialization files.
- [ ] Convention github-pages.md | Document static site publication pattern (embedded variables, injection script, publication conditions) independently of any specific project. artifact.md currently references a project-level file.
- [ ] Convention git.md | Commit before large rewrites, commit message format, when to suggest a commit, Git operations via commands MCP. Enables AI Assistants to manage Git directly.
- [ ] Externalize Changelogs? | Changelogs rarely needed in context. Explore separate changelog.md files or shared CHANGELOG.md per folder. Evaluate token savings vs navigation cost and tooling impact (md-doc, conformance checks).

## Basse priorité
[up](#table-of-contents)

- [ ] Convention git tagging | Définir format des tags, quand tagger (après chaque convention majeure ? après chaque session ?), workflow recommandé. À créer comme convention ou guide.
- [ ] Write a WWH design session guide | Document the method for designing a tool or feature using WWH: how to structure Why/What/How, how to iterate, when to update conventions before coding, how to validate before implementing. Based on the todo-tool design session 2026-06-04.

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
