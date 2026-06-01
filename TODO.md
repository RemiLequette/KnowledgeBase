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
- [ ] Review and update `guides/guide-maintenance.md` — cleanup French, references to Claude.md and old BP numbers
- [ ] md-doc Index support — inline anchor tags (`<a id="index-term-N">`) currently point nowhere; implement renderer support so index references resolve correctly
- [ ] md-doc Citations support — implement cross-document citation resolution; consider renaming Citations to References
- [ ] md-doc Changelog support — add/update Changelog entries via md-doc (new command or extension of update)
- [ ] Rename `conventions/` folder to `contracts/`
- [ ] Best practices — vérifier que `guides/best-practices.md` référence la convention `todo.md`

## Basse priorité
[up](#table-of-contents)

## Index

| Term | Occurrences |
|------|-------------|

## Changelog

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
