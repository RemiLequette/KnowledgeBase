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
- [ ] [O8] forge_read retourne FAL + bloc | Le résultat de forge_read doit inclure le FAL et le bloc dans la réponse — pas juste le contenu brut. Sinon l'AI perd le fil quand elle charge plusieurs blocs de fichiers différents. Changement simple dans forge.js. [effort: XS]
- [ ] [O9] specs/ document type | Distinguer conventions opérationnelles (chargées par trigger) et specs descriptives (chargées explicitement). Créer `public/specs/`, migrer `forge.md`. Ajouter type Spec dans `documentation-style.md`. Ajouter section `specs/` dans INDEX.md. Litmus test : une spec n'a rien à auditer. [effort: M]
- [ ] [O11] guide-maintenance.md conformance | Non-compliant: French content, obsolete reference to Claude.md, informal structure. Bring into line with documentation.md before next audit. [effort: S]
- [ ] [O23] forge_describe + describe() | Interface `describe()` dans les handlers, outil MCP `forge_describe(fal)`. Retourne structure de blocs + sémantique du type. Nécessaire pour exploiter md-doc. → **Specced in forge.md v7.0 — implement in forge.js** [effort: M]
- [ ] [O43] forge Brand registry | Session-scoped in-memory set of issued FALs. Brand gate on forge_read/forge_write — rejects FALs not issued by Forge with hint. FALs registered by forge_ls and forge_mkdir. → **Specced in forge.md v7.0 — implement in forge.js** [effort: S]

## Normal

- [ ] [O12] Convention journal.md | Create a convention for Journal.md files — structure, entry format, when to create, what to capture (decisions, key moments, files modified). Update INDEX.md decision layer trigger and PROJECT.md structure. Based on Journal.md created in KB session 2026-06-05.
- [ ] [O13] tools.md Quick Start — extend scope to reference HTML viewers/editors and `guides/editor-tool.md`. Currently limited to scripts only.
- [ ] [O14] Shared library scope — KB vs project | `tools.md` defines the KB vs project rule for scripts but does not cover shared libraries (`lib/`). Clarify: a `lib/` module that is specific to one project belongs in `<project>/tools/lib/`, not in the KB. The KB `tools/lib/` is reserved for modules reusable across projects. Constaté sur guideIA 2026-06-05.
- [ ] [O17] md-doc Index support | Inline anchor tags currently point nowhere — implement renderer support so index references resolve correctly.
- [ ] [O18] md-doc Citations support | Implement cross-document citation resolution. Consider renaming Citations to References.
- [ ] [O19] md-doc Changelog support | Add/update Changelog entries via md-doc — new command or extension of update.
- [ ] [O22] Hierarchy of Concern in structured reasoning | Add HOC as a principle in conventions/claude-structured-reasoning.md — two dimensions: (1) gravity: not all errors are equal, grade remarks by actual impact; (2) order: general before detail, strategy before tactics. Never get lost in implementation details before validating the approach. Identified during how-to-get-things-done post-mortem 2026-06-06.
- [ ] [O24] md-doc handler | Type handler Forge pour fichiers Markdown structurés. Chaque section devient un bloc nommé. Remplace l'outil md-doc actuel et son protocole JSON. Gain token maximal — tous les fichiers KB. Dépend de : forge_describe implémenté. [effort: L]
- [ ] [O27] Extend maintenance rules beyond guides | guide-maintenance.md covers guides only. Conventions and tools also need maintenance rules. Consider convention-maintenance.md + tool-maintenance.md, or extend guide-maintenance.md to cover all three. [effort: S]
- [ ] [O28] Best practices → todo.md reference | Vérifier que guides/best-practices.md référence la convention todo.md.
- [ ] [O37] Spec forge_write — vérification bloc | Documenter dans forge.md : (1) tout handler doit vérifier l'existence du bloc avant writeBlock et lever une erreur si absent ; (2) un AI Assistant doit appeler listBlocks avant tout forge_write sur un bloc nommé. [effort: S]
- [ ] [O40] gitignore logs dans project-structure.md | Ajouter dans `conventions/project-structure.md` la règle : tout projet inclut un `.gitignore` avec `*.log`. Auditable en regardant le .gitignore — c'est une convention.

## Low priority

- [ ] [O1] Premature drafting anti-pattern | Drafting final wording before the concept is stable anchors the conversation too early and forces rewrites. Sharper rule: discuss the idea first, draft only when the shape is clear. Refine "Validate before acting" in Phase 1 or add as a new anti-pattern in how-to-get-things-done.md.
- [ ] [O3] Goldilocks principle | Recurring pattern in the KB: too little loses value, too much loses quality, the right level is in between. Instances: session length, prompt granularity. Document as a named standalone principle — referenceable from how-to-get-things-done.md and elsewhere.
- [ ] [O15] Multilingual document support | `documentation.md` and `md-doc` assume English as the only language. Projects in another language (e.g. French) currently work around this with a language exception declaration but `md-doc` rejects non-English TOC headings. Define a proper multilingual support model. Dépend de md-doc handler. Constaté sur guideIA 2026-06-05.
- [ ] [O16] Add Design document type | Add Design document to taxonomy in documentation-style.md. Define style, WWH obligations, examples. Deferred 2026-06-03.
- [ ] [O20] Guides as frameworks not constraints | KB guides describe recommended practice, not mandatory procedure. The human decides. The AI suggests, never enforces. Document this principle — potentially in best-practices.md or as a guide preamble convention.
- [ ] [O21] AI best practices mirror human best practices | Develop the idea that effective collaboration practices with an AI resemble those with a human collaborator — clear intent, defined scope, explicit feedback, clean closure. Potentially a section in best-practices.md or a standalone guide.
- [ ] [O25] js-clean handler | Type handler pour fichiers JS maîtrisés. Shebang `// @forge-type: js-clean` en première ligne. Blocs par fonction `fn:<name>`, sections `// ---`. Dépend de md-doc handler. [effort: L]
- [ ] [O26] INDEX conventions/ table restructured by concept | The table is organized by file — restructure around concepts, making filenames secondary. Non-trivial refactor. [effort: M]
- [ ] [O29] Rename artifact scripts to English | ouvrir-revision.js → open-revision.js, cloturer-revision.js → close-revision.js. Update references in artifact.md.
- [ ] [O30] Convention github-pages.md | Document static site publication pattern independently of any specific project. artifact.md currently references a project-level file.
- [ ] [O31] Convention git.md + git tagging | Commit before large rewrites, commit message format, when to suggest a commit, Git operations via commands MCP. Inclure : format des tags, quand tagger, workflow recommandé. [effort: S]
- [ ] [O32] Externalize Changelogs? | Changelogs rarely needed in context. Explore separate changelog.md files or shared CHANGELOG.md per folder. Evaluate token savings vs navigation cost and tooling impact (md-doc, conformance checks). md-doc pourrait automatiser la migration.
- [ ] [O33] Write a WWH design session guide | Document the method for designing a tool or feature using WWH: how to structure Why/What/How, how to iterate, when to update conventions before coding. Based on the todo-tool design session 2026-06-04.
- [ ] [O41] Forge — registry viewer | Build a viewer artifact for the forge registry (roots, types, artifacts) — using forge to read itself via `forge_ls`. HTML tool or React artifact.
- [ ] [O42] Separate KB public/ to own repo | Move public/ to a standalone repository, independent from the KB Maintenance project. [effort: L]

## WIP

- [ ] [WIP] [W1] Forge — ArtifactRef/UrlRef/IRootRegistry + RTFM + Brand implementation | forge.md v7.0 : clean architecture specced — ArtifactRef, UrlRef, IRootRegistry, Brand before RTFM, force removed. forge.js modularised into src/ (logger, type-registry, root-registry, mcp-tools). Prochaines étapes : (1) implémenter forge_describe + RTFM gate, (2) implémenter Brand registry + Brand gate, (3) O8 forge_read retourne FAL+bloc, (4) md-doc handler (O24). [effort: L]
- [ ] [WIP] [W3] Namespace model — spec forge.md v6.0 | Modèle namespace conçu et documenté dans forge.md v6.0. Prochaines étapes : (1) split forge.config.json → roots.json + types.json, (2) implémenter le loader récursif dans forge.js. [effort: M]

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

## Index

| Term | Occurrences |
|------|-------------|

## Changelog

### Version 4.6 - forge.js modularisation done
**Date:** 2026-06-07
**Reason:** forge.js split into src/ modules. W1 updated (modularisation step done, next steps clarified). D15 added.

**Modifications:**
- WIP: W1 updated — modularisation noted as done, next steps reordered
- Done: D15 added

---

### Version 4.5 - forge.md v7.0 clean architecture
**Date:** 2026-06-07
**Reason:** Design session — ArtifactRef/UrlRef/IRootRegistry model specced. O44 closed (force removed from forge_describe). W1 updated.

**Modifications:**
- High priority: O44 removed (done); O23 and O43 spec references updated to v7.0
- WIP: W1 updated — ArtifactRef/UrlRef/IRootRegistry added as first step
- Done: D14 added

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
