# TODO

Backlog léger de la Knowledge Base — idées, améliorations, tâches.

## Quick Start

Backlog léger de la Knowledge Base.
Contient les tâches ouvertes et en cours, classées par priorité.
Les tâches terminées sont archivées dans `TODO-archive.md`.

## Keywords
todo, backlog, knowledge-base, tâches, idées, améliorations

## Table of Contents

1. [Critical](#critical)
2. [High priority](#high-priority)
3. [Normal](#normal)
4. [Low priority](#low-priority)
5. [WIP](#wip)
6. [Done](#done)
7. [Index](#index)

## Critical

- [ ] [O39] Bug md-doc update supprime le TOC | `md-doc update` avec un JSON vide `{}` supprime silencieusement le `## Table of Contents` du fichier cible. Reproduit sur fixture minimale 2026-06-05 — séquence : créer fichier avec TOC → `str_replace` → `md-doc update {}` → TOC absent. Fixture : `tmp/test-md-doc.md`.

## High priority

- [ ] [O4] Bootstrap robustesse | Convention `documentation.md` + `md-doc-usage.md` absente du template AssistantIA.md — un AI démarrant sur un sujet métier crée des .md non conformes. Ajouter règle de chargement dans AssistantIA.md + déclencheur sur création/modification .md. Constaté sur ComiteRSE-AfrSCM 2026-06-01.
- [ ] [O5] Scope Rule — accès vs autorisation | AI confond accès technique MCP avec autorisation Scope Rule. Clarifier dans INDEX : distinguer accès technique et accès autorisé, préciser comportement attendu de l'AI Assistant.
- [ ] [O6] Convention self-reference in artifacts | An AI reading a project file directly (e.g. `TODO.md`, `GLOSSARY.md`) without going through `INDEX.md` has no signal to load the relevant convention. Explore a lightweight mechanism for files to reference their own governing convention — e.g. a standard comment header, a frontmatter field, or a convention pointer in the file's Quick Start. Constaté sur guideIA 2026-06-05.
- [ ] [O9] specs/ document type | Distinguer conventions opérationnelles (chargées par trigger) et specs descriptives (chargées explicitement). Créer `public/specs/`, migrer `forge.md`. Ajouter type Spec dans `documentation-style.md`. Ajouter section `specs/` dans INDEX.md. Litmus test : une spec n'a rien à auditer. [effort: M]
- [ ] [O11] guide-maintenance.md conformance | Non-compliant: French content, obsolete reference to Claude.md, informal structure. Bring into line with documentation.md before next audit. [effort: S]

## Normal

- [ ] [O12] Convention journal.md | Create a convention for Journal.md files — structure, entry format, when to create, what to capture (decisions, key moments, files modified). Update INDEX.md decision layer trigger and PROJECT.md structure. Based on Journal.md created in KB session 2026-06-05.
- [ ] [O13] tools.md Quick Start — extend scope to reference HTML viewers/editors and `guides/editor-tool.md`. Currently limited to scripts only.
- [ ] [O14] Shared library scope — KB vs project | `tools.md` defines the KB vs project rule for scripts but does not cover shared libraries (`lib/`). Clarify: a `lib/` module that is specific to one project belongs in `<project>/tools/lib/`, not in the KB. The KB `tools/lib/` is reserved for modules reusable across projects. Constaté sur guideIA 2026-06-05.
- [ ] [O17] md-doc Index support | Inline anchor tags currently point nowhere — implement renderer support so index references resolve correctly.
- [ ] [O18] md-doc Citations support | Implement cross-document citation resolution. Consider renaming Citations to References.
- [ ] [O19] md-doc Changelog support | Add/update Changelog entries via md-doc — new command or extension of update.
- [ ] [O22] Hierarchy of Concern in structured reasoning | Add HOC as a principle in conventions/claude-structured-reasoning.md — two dimensions: (1) gravity: not all errors are equal, grade remarks by actual impact; (2) order: general before detail, strategy before tactics. Never get lost in implementation details before validating the approach. Identified during how-to-get-things-done post-mortem 2026-06-06.
- [ ] [O24] md-doc handler | Type handler Forge pour fichiers Markdown structurés. Chaque section devient un bloc nommé. Remplace l'outil md-doc actuel et son protocole JSON. Gain token maximal — tous les fichiers KB. [effort: L]
- [ ] [O27] Extend maintenance rules beyond guides | guide-maintenance.md covers guides only. Conventions and tools also need maintenance rules. Consider convention-maintenance.md + tool-maintenance.md, or extend guide-maintenance.md to cover all three. [effort: S]
- [ ] [O28] Best practices → todo.md reference | Vérifier que guides/best-practices.md référence la convention todo.md.
- [ ] [O40] gitignore logs dans project-structure.md | Ajouter dans `conventions/project-structure.md` la règle : tout projet inclut un `.gitignore` avec `*.log`. Auditable en regardant le .gitignore — c'est une convention.
- [ ] [O48] forge_read batch query | forge_read(path, queries=[]) — plusieurs dot-notation queries en un appel. Réduit les allers-retours pour les lectures multi-sections. Distinct de O53 (multi-fichiers). [effort: S]
- [ ] [O49] forge_ls récursif avec tailles | forge_ls(fal, depth=N) — arborescence complète jusqu'à profondeur N. Chaque entrée inclut size (caractères ou lignes) pour orienter la lecture sans ouvrir les blocs. [effort: S]
- [ ] [O51] idea-inbox convention — simplifier et clarifier | Rendre le registre projet plus simple et clair pour utilisation directe par un AI Assistant. Mieux le référencer dans INDEX.md (trigger + description). [effort: S]
- [ ] [O52] working-with-forge.md — adapt to Forge v2 | Guide describes Forge v1 (FAL, RTFM, Brand, forge_describe). Rewrite for Forge v2: formats, forge_read/write/create with JSON payload, dot-notation query, metadata block, registry. Restore trigger in INDEX.md Decision Layer on completion. Files also affected: GLOSSARY.md (entries RTFM, Brand, FAL, Constrain Don't Forbid, Fail Fast Fail Clear). [effort: M]
- [ ] [O53] forge_read multi-fichiers | forge_read(paths=[]) — lire plusieurs fichiers en un seul appel (analogue à filesystem:read_multiple_files). Réduit les allers-retours lors du bootstrap et de la navigation multi-fichiers. Distinct de O48 (batch intra-artifact). [effort: S]

## Low priority

- [ ] [O1] Premature drafting anti-pattern | Drafting final wording before the concept is stable anchors the conversation too early and forces rewrites. Sharper rule: discuss the idea first, draft only when the shape is clear. Refine "Validate before acting" in Phase 1 or add as a new anti-pattern in how-to-get-things-done.md.
- [ ] [O3] Goldilocks principle | Recurring pattern in the KB: too little loses value, too much loses quality, the right level is in between. Instances: session length, prompt granularity. Document as a named standalone principle — referenceable from how-to-get-things-done.md and elsewhere.
- [ ] [O15] Multilingual document support | `documentation.md` and `md-doc` assume English as the only language. Projects in another language (e.g. French) currently work around this with a language exception declaration but `md-doc` rejects non-English TOC headings. Define a proper multilingual support model. Dépend de md-doc handler. Constaté sur guideIA 2026-06-05.
- [ ] [O16] Add Design document type | Add Design document to taxonomy in documentation-style.md. Define style, WWH obligations, examples. Deferred 2026-06-03.
- [ ] [O20] Guides as frameworks not constraints | KB guides describe recommended practice, not mandatory procedure. The human decides. The AI suggests, never enforces. Document this principle — potentially in best-practices.md or as a guide preamble convention.
- [ ] [O21] AI best practices mirror human best practices | Develop the idea that effective collaboration practices with an AI resemble those with a common collaborator — clear intent, defined scope, explicit feedback, clean closure. Potentially a section in best-practices.md or a standalone guide.
- [ ] [O25] js-clean handler | Type handler pour fichiers JS maîtrisés. Shebang `// @forge-type: js-clean` en première ligne. Blocs par fonction `fn:<name>`, sections `// ---`. Dépend de md-doc handler. [effort: L]
- [ ] [O26] INDEX conventions/ table restructured by concept | The table is organized by file — restructure around concepts, making filenames secondary. Non-trivial refactor. [effort: M]
- [ ] [O29] Rename artifact scripts to English | ouvrir-revision.js → open-revision.js, cloturer-revision.js → close-revision.js. Update references in artifact.md.
- [ ] [O30] Convention github-pages.md | Document static site publication pattern independently of any specific project. artifact.md currently references a project-level file.
- [ ] [O31] Convention git.md + git tagging | Commit before large rewrites, commit message format, when to suggest a commit, Git operations via commands MCP. Inclure : format des tags, quand tagger, workflow recommandé. [effort: S]
- [ ] [O32] Externalize Changelogs? | Changelogs rarely needed in context. Explore separate changelog.md files or shared CHANGELOG.md per folder. Evaluate token savings vs navigation cost and tooling impact (md-doc, conformance checks). md-doc pourrait automatiser la migration.
- [ ] [O33] Write a WWH design session guide | Document the method for designing a tool or feature using WWH: how to structure Why/What/How, how to iterate, when to update conventions before coding. Based on the todo-tool design session 2026-06-04.
- [ ] [O41] Forge — registry viewer | Build a viewer artifact for the forge registry (roots, types, artifacts) — using forge to read itself via `forge_ls`. HTML tool or React artifact.
- [ ] [O42] Separate KB public/ to own repo | Move public/ to a standalone repository, independent from the KB Maintenance project. [effort: L]
- [ ] [O45] Forge editor — rename forge-browser.html | Rename `forge-browser.html` to `forge-editor.html` to reflect its expanded role. [effort: XS]
- [ ] [O46] Forge editor — add forge_create | Add artifact creation (forge_create) to the Forge editor tool. [effort: S]
- [ ] [O54] Generic configurable MCP server — document as convention or guide | Pattern identified in Forge M2: a `*-tools.json` declares tools + handler paths; `mcp-server.js` is a reusable runner independent of any tool domain. Extract from Forge and document for reuse across projects. [effort: M]

## WIP

- [ ] [WIP] [W5] Forge v2 — voir ROADMAP.md | Milestone actif : M2 — MCP tools layer. M1 (format registry) livré. Prochaine étape : forge-tools.json v1 + mcp-server.js générique. [effort: M]


## Done

- [x] [D1] Complete how-to-get-things-done guide | Memory rule + HOC anti-pattern added.
- [x] [D2] Enrich todo-list convention with WIP concept | WIP elevated to first-class session concept.
- [x] [D3] Guide — working session conduct | Covered by how-to-get-things-done.md.
- [x] [D4] Anti-patterns in working sessions | Integrated in how-to-get-things-done.md.
- [x] [D5] Forge — gitignore logs KB | `*.log` added to KB .gitignore.
- [x] [D6] INDEX Decision Layer litmus test + Forge vocabulary | Done.
- [x] [D7] Bug forge_write bloc ignoré — plain-text.js | plain-text.js v1.2.
- [x] [D8] forge.js — top-level error handler | forge.js v2.2.
- [x] [D9] forge — folder CRUD | forge_mkdir, forge_rmdir, forge_mvdir, forge_rndir implémentés.
- [x] [D10] RTFM principle — spec + guide | forge.md v6.3 + working-with-forge.md v1.0 + INDEX.md v3.2.
- [x] [D11] Streisand Effect — glossaire + nettoyage docs | GLOSSARY.md v1.1-1.2 + working-with-forge.md v1.1 + INDEX.md v3.3.
- [x] [D12] Brand principle — spec + glossaire | forge.md v6.4 : Brand principle specced. GLOSSARY.md v1.3 : Brand, Constrain Don't Forbid, Fail Fast Fail Clear, TDD. working-with-forge.md v1.2 : Brand section + pattern filename-without-FAL.
- [x] [D13] forge_create + forge_write existence guard | plain-text.js v1.3 + forge.js v2.4 + forge.md v6.5.
- [x] [D14] forge.md v7.0 — clean architecture | ArtifactRef, UrlRef, IRootRegistry, Brand before RTFM, force removed. forge.md v7.0 + working-with-forge.md v1.3.
- [x] [D15] forge.js modularisation | forge.js split into src/logger.js, src/type-registry.js, src/root-registry.js, src/mcp-tools.js. forge.js reduced to entry point + re-exports. All test imports unchanged.
- [x] [D16] Tests consolidés + O8 forge_read header | Tests migrés dans knowledgebase/tests/forge/. forge-testable.js déprécié. parseFAL unifié. Gates Brand+RTFM dans TypeRegistry. discover filtre par extension. forge-run.js + CLI + REPL. O8 implémenté.
- [x] [D17] O23 forge_describe | forge_describe implémenté dans mcp-tools.js. TypeRegistry.describe() gère default + described flag. Testé.
- [x] [D18] structured-text.js v3.0 — grammaire blocs | matchName, blocks.separators (regex, repeat, récursion, template), listBlocks, readBlock/writeBlock nommés, createArtifact squelette. forge-types.json v0.8.0. O44 couvert par le mécanisme générique.

## Index

| Term | Occurrences |
|------|-------------|

## Changelog

### Version 5.12 - M1 done, M2 actif + O54
**Date:** 2026-06-12
**Reason:** Milestone 1 livré en session. W5 mis à jour vers M2. O54 ajouté — pattern MCP générique à documenter plus tard.

**Modifications:**
- WIP: W5 mis à jour — M2 actif, prochaine étape mcp-server.js
- Low priority: O54 ajouté

---

### Version 5.11 - W5 pointe sur ROADMAP.md
**Date:** 2026-06-12
**Reason:** WIP ne duplique plus le détail de la spec — pointe sur ROADMAP.md + milestone actif.

**Modifications:**
- WIP: W5 réécrit comme pointeur roadmap

---

### Version 5.10 - O48 réécrit v2 + O43/O50/O37/O47 archivés
**Date:** 2026-06-12
**Reason:** O48 réécrit pour Forge v2 (dot-notation queries, plus de FAL/blocks). O43/O50/O37/O47 retirés du backlog et archivés dans TODO-archive.md.

**Modifications:**
- Normal: O48 description mise à jour (v2)
- High priority + Normal: O43, O50, O37, O47 retirés
- TODO-archive.md: O43, O50, O37, O47 ajoutés (archived-from: open)

---

### Version 5.9 - Roadmap Forge + items v1 superseded
**Date:** 2026-06-12
**Reason:** ROADMAP.md créé dans public/tools/forge/. Items Forge v1 obsolètes marqués done : O43 (Brand), O50 (writeBlock), O37 (forge_write bloc), O47 (structured-text.md).

**Modifications:**
- High priority: O50, O43 → done (superseded v1)
- Normal: O37, O47 → done (superseded v1)

---

### Version 5.8 - O53 forge_read multi-fichiers
**Date:** 2026-06-12
**Reason:** Besoin identifié en session : lire plusieurs fichiers en un appel, analogue à filesystem:read_multiple_files. Distinct de O48 (batch intra-artifact).

**Modifications:**
- Normal: O53 ajouté

---

### Version 5.7 - W5 mis à jour — forge.md v1.0
**Date:** 2026-06-11
**Reason:** Grammaire format finalisée en session (primitive/extends/fileNameExtension). W5 mis à jour pour refléter la spec v1.0 et les prochaines étapes d'implémentation.

**Modifications:**
- WIP: W5 description mise à jour

---

### Version 5.6 - W5 forge-formats.json v1
**Date:** 2026-06-11
**Reason:** Grammaire format complète conçue en session — prête pour implémentation.

**Modifications:**
- WIP: W5 ajouté

---

### Version 5.5 - W1, W3, W4 archived — superseded by Forge v2 redesign
**Date:** 2026-06-11
**Reason:** Forge v2 redesign (format grammar, new architecture) makes W1/W3/W4 obsolete. Archived.

**Modifications:**
- WIP: W1, W3, W4 removed
- TODO-archive.md: W1, W3, W4 added with [archived-from: wip]

---

### Version 5.4 - O52 working-with-forge.md adapt to Forge v2
**Date:** 2026-06-11
**Reason:** Guide obsolete — describes Forge v1. Trigger removed from INDEX Decision Layer pending rewrite.

**Modifications:**
- Normal: O52 ajouté

---

### Version 5.3 - W4 forge.md How passe 2
**Date:** 2026-06-10
**Reason:** Why/What nettoyés en session. How à traiter en session dédiée.

**Modifications:**
- WIP: W4 ajouté

---

### Version 5.2 - O51 idea-inbox simplification
**Date:** 2026-06-10
**Reason:** Simplifier la convention idea-inbox et mieux la référencer dans INDEX.

**Modifications:**
- Normal: O51 ajouté

---

### Version 5.1 - O50 writeBlock leaf-only rule
**Date:** 2026-06-07
**Reason:** Session debug forge — discussion sur la sémantique de writeBlock("") a mené à une règle de conception : seuls les blocs feuilles ont du contenu, les blocs parents sont des conteneurs comme des dossiers.

**Modifications:**
- High priority: O50 ajouté

---

### Version 5.0 - structured-text.js v3.0 done + nouveaux items
**Date:** 2026-06-07
**Reason:** Session grammaire blocs — structured-text.js v3.0 livré, 134 tests passent. O44 couvert par le mécanisme générique (fermé via D18). Nouveaux items O47/O48/O49.

**Modifications:**
- Normal: O44 retiré (couvert par D18) ; O47 (convention structured-text.md), O48 (forge_read batch+sous-arbre), O49 (forge_ls récursif+tailles) ajoutés
- WIP: W1 mis à jour — résumé v3.0 + prochaines étapes
- Done: D18 ajouté

---

### Version 4.9 - Driver générique enrichi + O45/O46
**Date:** 2026-06-07
**Reason:** Session enrichissement structured-text.js — shebang claim, strip/restore, discover hierarchy.

**Modifications:**
- Low priority: O45 (rename forge-browser → forge-editor) + O46 (forge_create dans l'éditeur) ajoutés
- WIP: W1 mis à jour — résumé session + prochaines étapes

---

### Version 4.8 - O23 fermé
**Date:** 2026-06-07

---

### Version 4.7 - Tests consolidés + O8 done
**Date:** 2026-06-07

---

### Version 4.6 - forge.js modularisation done
**Date:** 2026-06-07

---

### Version 4.5 - forge.md v7.0 clean architecture
**Date:** 2026-06-07

---

### Version 4.4 - O44 forge_describe force parameter
**Date:** 2026-06-07

---

### Version 4.3 - forge_create done
**Date:** 2026-06-07

---

### Version 4.2 - Brand principle done, W1 updated
**Date:** 2026-06-07

---

### Version 4.1 - Streisand Effect done
**Date:** 2026-06-07

---

### Version 4.0 - RTFM principle done, W1 updated
**Date:** 2026-06-07

---

### Version 1.0 - Création
**Date:** 2026-05-30
**Raison:** Backlog léger de la Knowledge Base.
