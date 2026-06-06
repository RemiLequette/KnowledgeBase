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
2. [Haute priorité](#haute-priorité)
3. [Normale](#normale)
4. [Basse priorité](#basse-priorité)
5. [Index](#index)

## Critical
[up](#table-of-contents)

- [ ] Bug md-doc update supprime le TOC | `md-doc update` avec un JSON vide `{}` supprime silencieusement le `## Table of Contents` du fichier cible. Reproduit sur fixture minimale 2026-06-05 — séquence : créer fichier avec TOC → `str_replace` → `md-doc update {}` → TOC absent. Fixture : `tmp/test-md-doc.md`.

## High priority
[up](#table-of-contents)

- [x] [W1] Complete how-to-get-things-done guide | Memory rule + HOC anti-pattern added. Exchange granularity captured as Goldilocks principle (separate TODO).

- [ ] Premature drafting anti-pattern | Drafting final wording before the concept is stable anchors the conversation too early and forces rewrites. Sharper rule: discuss the idea first, draft only when the shape is clear. Refine "Validate before acting" in Phase 1 or add as a new anti-pattern in how-to-get-things-done.md.

- [ ] KB Glossary | A glossary is becoming useful in the KB itself — named principles and acronyms are accumulating (WWH, HOC, Goldilocks, WIP, GTD, backlog/TODO...). Create a GLOSSARY.md at the KB project root following conventions/glossary.md.

- [ ] Goldilocks principle | Recurring pattern in the KB: too little loses value, too much loses quality, the right level is in between. Instances: session length, prompt granularity. Document as a named standalone principle — referenceable from how-to-get-things-done.md and elsewhere.

- [ ] Bootstrap robustesse | Convention `documentation.md` + `md-doc-usage.md` absente du template AssistantIA.md — un AI démarrant sur un sujet métier crée des .md non conformes. Ajouter règle de chargement dans AssistantIA.md + déclencheur sur création/modification .md. Constaté sur ComiteRSE-AfrSCM 2026-06-01.

- [ ] Scope Rule — accès vs autorisation | AI confond accès technique MCP avec autorisation Scope Rule. Clarifier dans INDEX : distinguer accès technique et accès autorisé, préciser comportement attendu de l'AI Assistant.

- [ ] Convention self-reference in artifacts | An AI reading a project file directly (e.g. `TODO.md`, `GLOSSARY.md`) without going through `INDEX.md` has no signal to load the relevant convention. Explore a lightweight mechanism for files to reference their own governing convention — e.g. a standard comment header, a frontmatter field, or a convention pointer in the file's Quick Start. Constaté sur guideIA 2026-06-05.

- [ ] Guide — working session conduct | Write a guide describing the rules of conduct for a working session: (1) wait for an explicit go before modifying any file — the design conversation may not be finished, and file writes are slow and hard to undo; (2) propose before acting; (3) confirm scope before starting. First rule: never start writing until the user gives a clear validation signal. Constaté sur guideIA 2026-06-05.

- [ ] guide-maintenance.md conformance | Non-compliant: French content, obsolete reference to Claude.md, informal structure. Bring into line with documentation.md before next audit. [effort: S]

## Normale
[up](#table-of-contents)

- [ ] Convention journal.md | Create a convention for Journal.md files — structure, entry format, when to create, what to capture (decisions, key moments, files modified). Update INDEX.md decision layer trigger and PROJECT.md structure. Based on Journal.md created in KB session 2026-06-05.

- [ ] tools.md Quick Start — extend scope to reference HTML viewers/editors and `guides/editor-tool.md`. Currently limited to scripts only.

- [ ] Shared library scope — KB vs project | `tools.md` defines the KB vs project rule for scripts but does not cover shared libraries (`lib/`). Clarify: a `lib/` module that is specific to one project belongs in `<project>/tools/lib/`, not in the KB. The KB `tools/lib/` is reserved for modules reusable across projects. Constaté sur guideIA 2026-06-05.
- [ ] Multilingual document support | `documentation.md` and `md-doc` assume English as the only language. Projects in another language (e.g. French) currently work around this with a language exception declaration but `md-doc` rejects non-English TOC headings (e.g. `## Table des matieres`). Define a proper multilingual support model: language declaration propagation, configurable fixed heading names, or per-language aliases. Constaté sur guideIA 2026-06-05.
- [ ] Add Design document type | Add Design document to taxonomy in documentation-style.md. Define style, WWH obligations, examples. Deferred 2026-06-03.
- [ ] Cleanup guide-maintenance.md | Fix French, remove references to Claude.md and old BP numbers.
- [ ] md-doc Index support | Inline anchor tags currently point nowhere — implement renderer support so index references resolve correctly.
- [ ] md-doc Citations support | Implement cross-document citation resolution. Consider renaming Citations to References.
- [ ] md-doc Changelog support | Add/update Changelog entries via md-doc — new command or extension of update.
- [ ] Guides as frameworks not constraints | KB guides describe recommended practice, not mandatory procedure. The human decides. The AI suggests, never enforces. Document this principle — potentially in best-practices.md or as a guide preamble convention.

- [ ] AI best practices mirror human best practices | Develop the idea that effective collaboration practices with an AI resemble those with a human collaborator — clear intent, defined scope, explicit feedback, clean closure. Potentially a section in best-practices.md or a standalone guide.

- [ ] Anti-patterns in working sessions | Document recurring anti-patterns in AI-assisted working sessions — scope drift, premature file writes, incomplete context, saturated context window. Natural complement to the working session guide.

- [ ] Hierarchy of Concern in structured reasoning | Add HOC as a principle in conventions/claude-structured-reasoning.md — two dimensions: (1) gravity: not all errors are equal, grade remarks by actual impact; (2) order: general before detail, strategy before tactics. Never get lost in implementation details before validating the approach. Identified during how-to-get-things-done post-mortem 2026-06-06.

- [ ] [WIP] Separate KB public/ to own repo | Move public/ to a standalone repository, independent from the KB Maintenance project. [effort: L]
- [ ] INDEX conventions/ table restructured by concept | The table is organized by file — restructure around concepts, making filenames secondary. Decision Layer already maps concepts to files. Non-trivial refactor. [effort: M]
- [ ] Extend maintenance rules beyond guides | guide-maintenance.md covers guides only. Conventions and tools also need maintenance rules. Consider convention-maintenance.md + tool-maintenance.md, or extend guide-maintenance.md to cover all three. [effort: S]
- [ ] str_replace vs filesystem:edit_file confusion | Claude systematically attempts str_replace on local files before falling back to filesystem:edit_file. Investigate whether this can be corrected via a convention or INDEX trigger. Reportedly hard-wired. Constaté 2026-06-06.

- [x] Enrich todo-list convention with WIP concept | WIP already exists as a state ([WIP] tag) in the format. Enrich the convention to make it a first-class session concept — the WIP is the bridge between sessions: a session closes by reviewing WIP items, the next session opens by reading them. Add guidance on WIP in the AI Assistant role section.

- [ ] Rename conventions/ to contracts/
- [ ] Best practices → todo.md reference | Vérifier que guides/best-practices.md référence la convention todo.md.
- [ ] Rename artifact scripts to English | ouvrir-revision.js → open-revision.js, cloturer-revision.js → close-revision.js. Update references in artifact.md and specialization files.
- [ ] Convention github-pages.md | Document static site publication pattern (embedded variables, injection script, publication conditions) independently of any specific project. artifact.md currently references a project-level file.
- [ ] Convention git.md | Commit before large rewrites, commit message format, when to suggest a commit, Git operations via commands MCP. Enables AI Assistants to manage Git directly.
- [ ] Externalize Changelogs? | Changelogs rarely needed in context. Explore separate changelog.md files or shared CHANGELOG.md per folder. Evaluate token savings vs navigation cost and tooling impact (md-doc, conformance checks).

## Basse priorité
[up](#table-of-contents)

- [ ] KB as a MCP [XXL] | Build a MCP server that exposes the KB as a working environment — not just file access but a full AI-assisted project toolset. Two layers: (1) Knowledge — `kb.convention(name)`, `kb.decision(task)` for automatic Decision Layer routing, zero navigation token overhead; (2) Tools — `kb.doc.update/check/create` replacing md-doc's JSON file interface with a natural API, `kb.local_server.*` abstracting the HTTP layer. Shift from "AI reads the KB" to "AI uses the KB". Risk to manage: opacity — a MCP can drift without visibility. Build when conventions are stable and manual loading patterns repeat across sessions.

- [ ] Convention git tagging | Définir format des tags, quand tagger (après chaque convention majeure ? après chaque session ?), workflow recommandé. À créer comme convention ou guide.
- [ ] Write a WWH design session guide | Document the method for designing a tool or feature using WWH: how to structure Why/What/How, how to iterate, when to update conventions before coding, how to validate before implementing. Based on the todo-tool design session 2026-06-04.

## Index

| Term | Occurrences |
|------|-------------|

## Changelog

### Version 3.0 - Premature drafting anti-pattern
**Date:** 2026-06-06
**Reason:** Post-mortem finding — drafting too early anchors the conversation before the concept is stable.

**Modifications:**
- High priority: added `Premature drafting anti-pattern`

---

### Version 2.9 - KB Glossary idea
**Date:** 2026-06-06
**Reason:** Named principles and acronyms accumulating in the KB — a glossary would help.

**Modifications:**
- High priority: added `KB Glossary`

---

### Version 2.8 - W1 closed
**Date:** 2026-06-06
**Reason:** how-to-get-things-done guide W1 completed — memory rule and HOC added to guide.

**Modifications:**
- High priority: W1 marked done

---

### Version 2.7 - Goldilocks principle
**Date:** 2026-06-06
**Reason:** Goldilocks pattern identified as recurring in the KB (session length, prompt granularity). Captured as a standalone principle to document.

**Modifications:**
- High priority: added `Goldilocks principle`

---

### Version 2.6 - Inbox triage 2026-06-06
**Date:** 2026-06-06
**Reason:** Triage of 3 ideas from project-ideas-inbox.md.

**Modifications:**
- Normale: added `Separate KB public/ to own repo` [WIP, effort: L]
- Normale: added `INDEX conventions/ table restructured by concept` [effort: M]
- Normale: added `Extend maintenance rules beyond guides` [effort: S]

---

### Version 2.5 - guide-maintenance.md conformance
**Date:** 2026-06-06
**Reason:** guide-maintenance.md identified as non-compliant during session — flagged for cleanup.

**Modifications:**
- High priority: added `guide-maintenance.md conformance`

---

### Version 2.4 - tools.md scope gap
**Date:** 2026-06-06
**Reason:** tools.md Quick Start covers scripts only — viewers/editors not referenced. Identified during INDEX tools/ section work.

**Modifications:**
- Normale: added `tools.md Quick Start — extend scope to reference HTML viewers/editors`

---

### Version 2.3 - Working session guide — cadrage ideas
**Date:** 2026-06-06
**Reason:** Three ideas captured during How to get things done guide scoping session.

**Modifications:**
- Normale: added `Guides as frameworks not constraints`
- Normale: added `AI best practices mirror human best practices`
- Normale: added `Anti-patterns in working sessions`

---

### Version 2.2 - Critical priority level + md-doc bug
**Date:** 2026-06-05
**Reason:** New Critical priority level added for bugs that break existing tools. First item: md-doc update silently drops TOC.

**Modifications:**
- TOC: Critical level added
- Critical: added `Bug md-doc update supprime le TOC`

---

### Version 2.1 - Convention journal.md
**Date:** 2026-06-05
**Reason:** Journal.md created for the KB project — no convention exists yet.

**Modifications:**
- Normale: added `Convention journal.md`

### Version 2.0 - Shared library scope + guide-parser
**Date:** 2026-06-05
**Reason:** tools.md KB vs project rule does not cover lib/ modules. Constaté sur guideIA.

**Modifications:**
- Normale: added `Shared library scope — KB vs project`


### Version 1.9 - Guide working session conduct
**Date:** 2026-06-05
**Reason:** AI started writing files before design was validated. First rule: wait for explicit go. Constaté sur guideIA.

**Modifications:**
- Haute priorité : added `Guide — working session conduct`


### Version 1.8 - Convention self-reference in artifacts
**Date:** 2026-06-05
**Reason:** An AI reading a project file directly has no signal to load the relevant convention. Constaté sur guideIA.

**Modifications:**
- Normale: added `Convention self-reference in artifacts`


### Version 1.7 - Multilingual document support
**Date:** 2026-06-05
**Reason:** `md-doc` rejects non-English TOC headings — projects in another language have no clean solution. Constaté sur guideIA.

**Modifications:**
- Normale: added `Multilingual document support`


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
