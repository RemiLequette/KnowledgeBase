# Knowledge Base Index

## Quick Start

**Why:** Every AI-assisted session needs consistent conventions. This file is the single entry point to the Knowledge Base (KB) — loaded at the start of every session on instruction from the project's AI agent configuration.

**What:** A navigation map. Does not contain knowledge — points to it. Two catalogues: `conventions/` (rules for doing things) and `guides/` (step-by-step processes). A Decision Layer maps the current task to the files to load.

**How:** At session start, read the Session Bootstrap below. During the session, consult the Decision Layer to load only what the task requires.

---

## Session Bootstrap

Steps to follow at the start of every session, in order.

1. Read `public/guides/how-to-get-things-done.md` — session model and working practice.
2. Read `public/conventions/todo-list.md` — TODO and WIP file structure.
3. Read `PROJECT.md` at the project root — project context, current objective, WIP.
4. Apply the Scope Rule below.
5. Use the Decision Layer to identify and load the conventions relevant to the current task.
6. Greet the user by name, state the active project, and confirm you are ready.

---

## AI Agents

Agent-specific instructions. Apply only for the active agent.

| Agent | Specificities |
|-------|---------------|
| Claude | None |

---

## Scope Rule — Mandatory

**Never access files or directories outside the active project folder without explicit user request.**

This includes:
- Listing sibling project folders
- Reading files in other projects
- Inferring context from other projects

**Exception:** The Knowledge Base folder is accessible **read-only** — load only what the decision layer instructs.

WHY: Prevents context pollution, unnecessary file reads, and unintended exposure of unrelated projects.

---

## Decision Layer — What to read

To identify what type of document to read, ask: what would you need to audit it?
- Artifacts → convention
- A log → guide

Match the current task against the triggers below. Read only the documents that match.
Use Forge to read all KB documents — `forge_read(fal)`.

| Trigger | Load |
|---------|------|
| Reading, writing, copying local files | `conventions/filesystem.md` |
| Creating or editing a `.md` file | `conventions/documentation.md`, `conventions/documentation-style.md` |
| Declaring a document type, auditing content style | `conventions/documentation-style.md` |
| SQL query, database read/write, schema change | `conventions/sqlite.md` |
| CommWise layout, CSS, flex, viewport constraints | `conventions/commwise-layout.md` |
| CommWise modal, overlay, disabled button | `conventions/commwise-modals.md` |
| CommWise block read/write, assembly, synchronisation | `conventions/commwise-framework.md` |
| Modular architecture (Core, IService, Assembly, Framework) | `conventions/modular-architecture.md` |
| Architecture of a time-tracked structured dataset (artifact) | `conventions/artifact.md` |
| Project uses input channels to import ideas (email, Notion, etc.) | `conventions/idea-inbox.md` |
| Registering a project, querying project dependencies, posting or triaging cross-project ideas | `conventions/project-registry.md` |
| Live DOM debug, JS validation in browser | `conventions/claude-chrome-mcp.md` |
| Complex analysis, structured reasoning, multi-step problem | `conventions/claude-structured-reasoning.md` |
| `file://` HTML page with persistent storage | `conventions/indexeddb-file-protocol.md` |
| Setting up or using the local development server | `conventions/local-server.md` |
| Creating or auditing a GLOSSARY.md | `conventions/glossary.md` |
| Node.js automation script, cross-project tool | `conventions/tools.md` |
| Creating or managing a TODO.md or backlog | `conventions/todo-list.md` |
| Setting up or auditing Claude project structure or instructions | `conventions/project-structure.md` |
| Setting up a new Claude project | `guides/project-setup-process.md` |
| Auditing a project for conformance | `guides/audit-process.md` |
| Updating a guide file | `guides/guide-maintenance.md` |
| Building or setting up the HTML todo list tool | `guides/todo-tool.md`, `conventions/todo-list.md`, `conventions/local-server.md` |


---

## conventions/

Rules and patterns governing how something is done. A convention leaves a trace in the artifacts — conformance is auditable by examining documents, code, or data directly. Load only what the current task requires (use the Decision Layer above). A task may require more than one convention.

| File | Summary | Keywords |
|------|---------|----------|
| filesystem.md | Use `filesystem` for reads, `edit-file-lines` for writes, `node` for mechanical copy/replace ops (zero tokens) | filesystem, MCP, read, write, copy, node, regex, files |
| md-doc-usage.md | Read/write docs via md-doc tool — section-level access, token efficiency, conformance check, tmp file management | md-doc, tool, read, write, documentation, conformance, tmp |
| documentation.md | Convention universelle pour tous les fichiers Markdown — structure, titres, TOC, Keywords, Index, Changelog, Quick Start, citations | markdown, documentation, TOC, titres, ancres, keywords, index, changelog, quick-start, citations |
| documentation-style.md | Document types taxonomy and Why-What-How content hierarchy — every document declares its type; process specs and conventions separate intent, model, and implementation. | document-type, style, taxonomy, process, spec, convention, why-what-how, intent, model, implementation |
| sqlite.md | One statement per call, DELETE before INSERT, always verify after writes, update schema.sql after DDL | sqlite, MCP, SQL, database, schema, write, query |
| commwise-layout.md | `max-height` is the only reliable way to constrain flex children overridden by CommWise `!important` rules | CommWise, flex, layout, max-height, viewport, CSS, override |
| commwise-modals.md | Modal open/close requires both `dds-hidden` (display) and `visible` (opacity/visibility) + mandatory reflow between. Disabled buttons need ID-level CSS override. | CommWise, modal, overlay, dds-hidden, visible, disabled, button, CSS, trap |
| commwise-framework.md | CommWise as a framework — MCP tool, block model, module assembly, PULL/PUSH synchronisation, session lifecycle, editing best practices. | CommWise, MCP, framework, blocks, assembly, synchronisation, pull, push, session |
| modular-architecture.md | Architecture convention for modular SPAs — Core, IService, Assembly, Framework concepts and project doc structure. | architecture, modular, core, IService, assembly, framework, convention |
| artifact.md | Generic convention for time-tracked structured datasets — file structure, revision lifecycle, URL modes, local server, revision index, scripts, GitHub Pages. | artifact, structured data, revisions, JSON, lifecycle, scripts, GitHub Pages |
| idea-inbox.md | Convention for collecting and processing ideas from multiple input channels (Gmail, Notion, etc.) — channel model, status lifecycle, processing rules, on-demand trigger. | idea-inbox, canal, channel, Gmail, Notion, inbox, processing, import |
| project-registry.md | Centralized directory of all projects using the KB (`public/projects.md`) and cross-project idea inbox (`public/project-ideas-inbox.md`) — registration format, inbox posting, triage rules. | project-registry, projects, directory, dependencies, cross-project, idea-inbox, triage |
| claude-chrome-mcp.md | Use Claude in Chrome MCP for live DOM diagnostics and JS fix validation — eliminates layout guesswork | Chrome, MCP, browser, DOM, debug, javascript, inspect, layout |
| claude-structured-reasoning.md | 8 core techniques for clearer thinking: thinking tags, step-by-step decomposition, chain-of-thought, roles, structure, adversarial framing, constraints, reference-based | thinking-tags, chain-of-thought, structured-reasoning, prompting, clarity, analysis, constraints |
| local-server.md | Shared local HTTP server for all projects — allowed roots, API contract (/ping /file /dir), static serving, bootstrap pattern | local-server, HTTP, file-access, static, allowed-roots, multi-project |
| indexeddb-file-protocol.md | IndexedDB replaces localStorage for `file://` HTML pages — Chrome blocks localStorage in file:// context; IndexedDB works reliably. Includes reusable async snippet and migration table. | IndexedDB, localStorage, file-protocol, browser-storage, persistence, patch, HTML |
| glossary.md | Convention pour GLOSSARY.md dans chaque projet — domaines, termes, references croisees, chargement selectif par un AI Assistant. Section ## Glossary obligatoire dans PROJECT.md. | glossaire, glossary, terminologie, domaines, definitions, conformite, audit |
| tools.md | Node.js script-based tools — when to use, structure, standard interface (args, stdout, exit codes), invocation via commands MCP, output rules, catalogue. | tools, scripts, node, automation, token-efficiency, commands-mcp, cross-project |
| todo-list.md | Lightweight backlog for any project — format, states, archiving, AI Assistant role. Two files: TODO.md (active) + TODO-archive.md (done). | todo, backlog, tasks, priority, archiving, session |
| project-structure.md | Canonical structure for any Claude project — folder layout, mandatory files, Claude project instructions template, bootstrap chain. | project-structure, claude-project, instructions, template, bootstrap, scaffold |
| forge.md | Internal spec for the Forge MCP server — architecture, FAL syntax, type handlers, registry, namespaces. | forge, MCP, FAL, handler, registry, namespace, RTFM, internal-spec |

---

## guides/

Step-by-step processes for specific operations. A guide leaves a trace in the process — auditing whether it was followed requires a log. Read when performing the named operation, not at every session.

| File | Summary | Keywords |
|------|---------|----------|
| project-setup-process.md | Process to create a new Claude project. References best practices at each step. Includes scaffolding, file templates, checklist, and examples. | project-setup, process, initialization, configuration, best-practices, scaffolding |
| best-practices.md | Design principles for Claude project structure | best-practices, structure, instructions, conventions, clarity, context, design-principles |
| audit-process.md | Process to verify project conformance to best practices. Rules of engagement: session dedication, corrections, guide updates, re-audit separation. Structured findings, proposals, approval workflow. Includes checkpoint + batching workflow. | audit, verification, best-practices, compliance, quality-assurance, process, methodology |
| guide-maintenance.md | Standards for maintaining all guides: update Table of Contents and Changelog with every modification. Required for all guides (project-setup, best-practices, audit-process). | maintenance, guides, documentation, changelog, discoverability, traceability, standards |
| how-to-get-things-done.md | Practical framework for running effective AI-assisted working sessions — session model (chat = session), three phases (scoping, execution, closure), anti-patterns. | working-session, productivity, scoping, closure, WIP, todo, chat, log |
| todo-tool.md | Guide for the HTML tool that reads and writes TODO.md via the local server — rationale, conceptual model, architecture (bootstrap, transaction model, file access). | todo-tool, HTML, local-server, bootstrap, transaction, synchronization, todo |
| working-with-forge.md | Operational guide for AI Assistants using Forge — FAL concept, RTFM workflow (describe before read/write), tool reference, common patterns. | forge, FAL, RTFM, forge_describe, forge_read, forge_write, AI-assistant, session |

---

## tools/

Deterministic artifacts that execute mechanical tasks without consuming AI reasoning. Two types: **scripts** (see `conventions/tools.md`) and **viewers/editors** (see `guides/editor-tool.md`). A tool leaves a trace in both artifacts (it exists) and execution (it was run, with a result).

---

## Keywords
index, conventions, workflows, guides, navigation, discoverability, knowledge-base, decision-layer, scope

---

## Index

| Terme | Occurrences |
|-------|-------------|

---

## Changelog

### Version 3.4 - working-with-forge.md trigger removed
**Date:** 2026-06-11
**Reason:** `working-with-forge.md` describes Forge v1 (FAL, RTFM, Brand, forge_describe) — incompatible with Forge v2. Trigger removed from Decision Layer to prevent loading an obsolete guide. Table entry kept for traceability. See TODO O52.

**Modifications:**
- Decision Layer: trigger `Using Forge to read or write artifacts, first session with Forge` removed

---

### Version 3.3 - Streisand Effect applied to forge.md entry
**Date:** 2026-06-07
**Reason:** forge.md summary contained "For developers maintaining Forge, not for AI Assistants using it" — Streisand Effect. Removed the second sentence.

**Modifications:**
- Table conventions/: `forge.md` summary — second sentence removed

---

### Version 3.2 - working-with-forge.md + forge.md clarified
**Date:** 2026-06-07
**Reason:** New guide `working-with-forge.md` created — operational entry point for AI Assistants using Forge. Trigger added to Decision Layer. forge.md entry in conventions/ updated to clarify it is an internal spec, not for AI Assistants.

**Modifications:**
- Decision Layer: trigger `Using Forge to read or write artifacts, first session with Forge` added
- Table conventions/: `forge.md` entry updated — summary clarified as internal spec
- Table guides/: `working-with-forge.md` entry added

---

### Version 3.1 - Decision Layer litmus test + Forge vocabulary
**Date:** 2026-07-07
**Reason:** Decision Layer intro rewritten — litmus test convention/guide added, "load" replaced by "read", Forge mentioned as the tool to read KB documents.

**Modifications:**
- `## Decision Layer`: renamed to `What to read`; intro rewritten with litmus test and Forge reference

---

### Version 3.0 - backlog alias in Decision Layer
**Date:** 2026-06-06
**Reason:** "backlog" is a common alias for TODO — adding it to the trigger ensures the convention is loaded when the term is used.

**Modifications:**
- Decision Layer: `Creating or managing a TODO.md` → `Creating or managing a TODO.md or backlog`

---

### Version 2.9 - project-registry.md added
**Date:** 2026-06-06
**Reason:** New convention `project-registry.md` created — centralized project directory and cross-project idea inbox.

**Modifications:**
- Decision Layer: trigger `Registering a project, querying project dependencies, or posting a cross-project idea` added
- Table conventions/: `project-registry.md` entry added

---

### Version 2.8 - tools section, convention-guide distinction, documentation-style alignment
**Date:** 2026-06-06
**Reason:** Multiple improvements in same session: tools/ section added; foundational distinction between conventions and guides formalized; documentation-style.md aligned to reference INDEX as source of truth for Convention and Guide definitions; Session Bootstrap refined (todo-list.md added, circular step removed, greeting added, KB read-only clarified); Quick Start updated to mention three catalogues.

**Modifications:**
- `## tools/`: new section added after guides/ table
- `## conventions/`: definition enriched with auditability principle
- `## guides/`: definition enriched with log/auditability principle
- `## Quick Start`: What updated to mention tools/ alongside conventions/ and guides/
- `## Session Bootstrap`: step 2 added (todo-list.md); step 4 removed (circular); step 6 updated to greeting; Scope Rule exception clarified as read-only

---

### Version 2.7 - Quick Start WWH, Session Bootstrap, section intros
**Date:** 2026-06-06
**Reason:** INDEX lacked practical guidance on how to use the KB. Quick Start restated with Why-What-How structure. Session Bootstrap section added (was documented in Changelog but absent from file). Section introductions for conventions/ and guides/ rewritten to be actionable.

**Modifications:**
- `## Quick Start`: rewritten with WWH structure — why this file exists, what it contains, how to use it
- `## Session Bootstrap`: added — 5-step sequence for session start
- `## conventions/`: intro rewritten — actionable, references Decision Layer
- `## guides/`: intro rewritten — actionable, load on demand

---

### Version 2.6 - how-to-get-things-done.md added
**Date:** 2026-06-06
**Reason:** New guide `how-to-get-things-done.md` created — practical framework for effective AI-assisted working sessions.

**Modifications:**
- Table guides/: `how-to-get-things-done.md` entry added

---

### Version 2.5 - local-server.md added
**Date:** 2026-06-04
**Reason:** New convention `local-server.md` created — shared local HTTP server for all projects.

**Modifications:**
- Decision Layer: trigger `Setting up or using the local development server` added
- Table conventions/: `local-server.md` entry added

---

### Version 2.4 - idea-inbox.md + documentation-style au trigger md
**Date:** 2026-06-04
**Reason:** Nouvelle convention `idea-inbox.md` créée — pattern générique pour les canaux d'import d'idées. Correction du trigger `Creating or editing a .md file` pour inclure `documentation-style.md`.

**Modifications:**
- Decision Layer : trigger `Creating or editing a .md file` mis à jour — ajout de `conventions/documentation-style.md`
- Decision Layer : trigger `Project uses input channels to import ideas` ajouté
- Table conventions/ : entrée `idea-inbox.md` ajoutée

---

### Version 2.3 - artifact.md added
**Date:** 2026-06-04
**Reason:** New convention `artifact.md` created — generic pattern for time-tracked structured datasets.

**Modifications:**
- Decision Layer: trigger `Architecture of a time-tracked structured dataset (artifact)` added
- Table conventions/: `artifact.md` entry added

---

### Version 2.2 - documentation-style.md added
**Date:** 2026-06-03
**Reason:** New convention `documentation-style.md` created — document type taxonomy and Why-What-How content hierarchy.

**Modifications:**
- Decision Layer: trigger `Declaring a document type, auditing content style` added
- Table conventions/: `documentation-style.md` entry added

---

### Version 2.1 - Decision Layer trigger md-doc removed
**Date:** 2026-05-31
**Reason:** Trigger redundant — md-doc-usage.md is now loaded unconditionally at bootstrap (step 4).

**Modifications :**
- Decision Layer : trigger `Reading or writing a .md file via md-doc` removed

---

### Version 2.0 - Documentation conventions loaded at every session
**Date:** 2026-05-31
**Reason:** Most sessions touch documentation files. Loading documentation.md and md-doc-usage.md unconditionally at bootstrap avoids relying on the Decision Layer trigger.

**Modifications :**
- Session Bootstrap : step 4 added — load `conventions/documentation.md` and `conventions/md-doc-usage.md`
- Step numbering updated (State the project is now step 5)

---

### Version 1.9 - md-doc-usage.md referenced
**Date:** 2026-05-31
**Raison:** Convention md-doc-usage.md ajoutee dans la table conventions/ et dans le Decision Layer.

**Modifications :**
- Decision Layer : ajout du trigger `Reading or writing a .md file via md-doc` -> `conventions/md-doc-usage.md`
- Table conventions/ : ajout de `md-doc-usage.md`

---

### Version 1.8 - Scope Rule + suppression Claude.md + dossier public/
**Date:** 2026-05-31
**Raison:** Restructuration KB — contenu public deplace dans public/. Suppression de Claude.md comme fichier de bootstrap projet (remplace par PROJECT.md). Ajout de la Scope Rule pour controler l'acces aux fichiers hors projet actif.

**Modifications :**
- Session Bootstrap step 3 : `Claude.md` remplace par `PROJECT.md`
- Session Bootstrap : message d'erreur mis a jour (`PROJECT.md` au lieu de `Claude.md`)
- Ajout de `## Scope Rule` dans la section AI Agents
- Keywords : ajout de `scope`

---

### Version 1.7 - Ajout project-structure.md
**Date:** 2026-05-31
**Raison:** Nouvelle convention project-structure.md creee — source de verite pour la structure de projet et le template des instructions Claude.

**Modifications :**
- Ajout de `project-structure.md` dans la table conventions/
- Ajout du trigger correspondant dans le Decision Layer

---

### Version 1.6 - Ajout todo.md
**Date:** 2026-05-31
**Raison:** Convention todo.md existante non referencee dans l'INDEX.

**Modifications :**
- Ajout de `todo.md` dans la table conventions/
- Ajout du trigger `Creating or managing a TODO.md` dans le Decision Layer

---

### Version 1.5 - Session Bootstrap + AI Agents
**Date:** 2026-05-31
**Raison:** Fusion de KNOWLEDGEBASE.md et Claude.md dans INDEX.md. Elimination des fichiers relais et des allers-retours LLM inutiles.

**Modifications :**
- Ajout de `## Session Bootstrap` — instructions de demarrage de session (ancien KNOWLEDGEBASE.md)
- Ajout de `## AI Agents` — specificites par agent IA (remplace Claude.md)
- KNOWLEDGEBASE.md et Claude.md supprimes

---

### Version 1.4 - Suppression workflows/
**Date:** 2026-05-31
**Raison:** Dossier workflows/ vide apres suppression de session-startup.md — concept supprime.

**Modifications :**
- Suppression de la section `## workflows/`
- Suppression du trigger `Starting a new session` dans le Decision Layer

---

### Version 1.3 - Decision layer + maintenance separation
**Date:** 2026-05-31
**Raison:** Refactoring de l'INDEX pour separer navigation (INDEX.md) et maintenance (PROJECT.md). Ajout du decision layer explicite.

**Modifications :**
- Suppression du bloc "About this knowledge base" (migre vers PROJECT.md ## KB Maintenance)
- Ajout de `## Decision Layer` — mapping situation -> fichier a charger
- Reformulation du Quick Start
- Ajout du keyword `decision-layer`

### Version 1.2 - Tools convention
**Date:** 2026-05-30
**Raison:** Ajout de la convention tools.md et du dossier tools/.

**Modifications :**
- Ajout de `tools.md` dans la table conventions/

### Version 1.1 - Glossaire
**Date:** 2026-05-30
**Raison:** Ajout de la convention glossary.md.

**Modifications :**
- Ajout de `glossary.md` dans la table conventions/

### Version 1.0 - Creation
**Date:** 2026-05-30
**Raison:** Index de la knowledge base — point d'entree pour toutes les sessions.

**Contenu initial :**
- Table conventions/ avec keywords
- Table guides/ avec keywords
