# Project Ideas Inbox

Cross-project idea inbox — ideas posted from any project for any other project, pending triage.

*Document type: Log*

## Quick Start

Shared inbox for cross-project ideas.
Post an idea here when working in one project and thinking of something for another.
Triage is done on demand in the target project — read entries for your tag, promote to TODO or discard, then delete the line.
See `conventions/project-registry.md` for posting format and triage rules.

## Keywords
inbox, ideas, cross-project, triage, posting

## Ideas

- `kb-maintenance` | Créer un viewer/explorateur de la registry des projets (`projects.md`) — outil HTML ou Node.js permettant de naviguer dans les projets enregistrés, leurs conventions, et leurs dépendances. [effort: M] [date: 2026-06-06]
- `kb-maintenance/conventions` | Mettre à jour la description de `filesystem.md` dans `INDEX.md` — refléter l'ajout de la règle "large file generation via container + download" (keywords `download`, `present_files`, `large-files`). [effort: XS] [date: 2026-06-06]
- `kb-maintenance/conventions` | Nouvelle convention : "Artefact + outil de maintenance co-généré" — pattern à formaliser. Idée centrale : tout artefact volumineux à structure connue (HTML, JSON, Markdown long) devrait être accompagné dès sa création d'un outil de maintenance dédié (script Node.js ou Python) qui expose des opérations structurées sur ses sections : lire un bout, écrire un bout, lister des éléments. Claude invoque l'outil via `commands` MCP (zéro tokens), jamais le fichier brut. Analogie : c'est un "MCP local co-généré" — même philosophie qu'un vrai MCP (interface structurée, pas d'accès aux entrailles), mais spécifique à l'artefact, vivant dans le projet, sans serveur. Exemple existant dans guideIA : `guide-parser.js` + `plan-editor.html` jouent ce rôle pour `Plan.md` et `GuideIA.md`. Questions à trancher en session : nommage du pattern, structure minimale d'un outil de maintenance (interface CLI standard ?), quand le co-générer (toujours ? seulement au-delà d'un seuil ?), lien avec `conventions/tools.md` et `conventions/artifact.md`. [effort: M] [date: 2026-06-06]
- `kb-maintenance/conventions` | Nouvelle convention : tests Vitest — structure d'un fichier de test, approche boîte noire vs boîte blanche, nommage, helpers, makeCtx pattern, organisation par describe. Motivé par la session de conversion forge-brand.test.js 2026-06-08. [effort: S] [date: 2026-06-08]
- `kb-maintenance/conventions` | Nouvelle convention : logs — quand logger, niveaux (INFO/ERROR), format, ce qu'on ne logue pas, lien avec forge.log et gitignore. [effort: S] [date: 2026-06-08]

## Changelog

### Version 1.5 - 2 ideas from KB session 2026-06-08
**Date:** 2026-06-08
**Reason:** Deux conventions identifiées pendant la session de conversion des tests Forge en Vitest : tests-vitest.md et logs.md.

### Version 1.4 - Idea from GuideIA — artefact + outil de maintenance co-généré
**Date:** 2026-06-06
**Reason:** Pattern discovered during GuideIA session — large artefacts should be paired with a co-generated maintenance tool acting as a local MCP. Enough context to run a dedicated KB session.

### Version 1.3 - Idea from GuideIA — filesystem.md INDEX update
**Date:** 2026-06-06
**Reason:** Idea posted from GuideIA session — INDEX.md description of filesystem.md to be updated after v1.1 addition.

### Version 1.2 - Idea from GuideIA
**Date:** 2026-06-06
**Reason:** Idea posted from GuideIA session — project registry viewer.

### Version 1.1 - Triage kb-maintenance 2026-06-06
**Date:** 2026-06-06
**Reason:** 3 ideas for kb-maintenance triaged — all promoted to TODO.md.

---

### Version 1.0 - Creation
**Date:** 2026-06-06
**Reason:** Initial cross-project idea inbox — bootstrapped with first idea for KB Maintenance.
