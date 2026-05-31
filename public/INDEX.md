# Knowledge Base Index

## Quick Start

Entry point for every Claude session in any project.
Read this file first, then load only the conventions relevant to the current task.
Does not contain the conventions themselves — navigation map only.

---

## Session Bootstrap

Execute these steps at the start of every session, before considering any user input.

1. **Greet the user** — introduce yourself with the name given to you, remind the project folder and knowledge base folder.
2. **Load the knowledge base** — state "Loading knowledge base...", then read this file (`INDEX.md`). Apply the Decision Layer below based on the current task.
3. **Load the project context** — state "Loading project context...", then read `PROJECT.md` at the root of the project folder.
4. **State the project** — state the project name and its purpose. If the project is unknown, report it clearly instead.

**If no `PROJECT.md` exists at the project root:** report it as a serious issue, contact Remi Lequette, and stop.

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

**Exception:** The Knowledge Base folder is accessible (defined in project instructions).
Never browse it freely — load only what the decision layer instructs.

WHY: Prevents context pollution, unnecessary file reads, and unintended exposure of unrelated projects.
The active project is defined by the project folder stated in the Claude project instructions.

---

## Decision Layer — What to load

Match the current task against the triggers below. Load only the files that match.

| Trigger | Load |
|---------|------|
| Reading, writing, copying local files | `conventions/filesystem.md` |
| Creating or editing a `.md` file | `conventions/documentation.md` |
| SQL query, database read/write, schema change | `conventions/sqlite.md` |
| CommWise layout, CSS, flex, viewport constraints | `conventions/commwise-layout.md` |
| CommWise modal, overlay, disabled button | `conventions/commwise-modals.md` |
| Live DOM debug, JS validation in browser | `conventions/claude-chrome-mcp.md` |
| Complex analysis, structured reasoning, multi-step problem | `conventions/claude-structured-reasoning.md` |
| `file://` HTML page with persistent storage | `conventions/indexeddb-file-protocol.md` |
| Creating or auditing a GLOSSARY.md | `conventions/glossary.md` |
| Node.js automation script, cross-project tool | `conventions/tools.md` |
| Creating or managing a TODO.md | `conventions/todo.md` |
| Setting up or auditing Claude project structure or instructions | `conventions/project-structure.md` |
| Setting up a new Claude project | `guides/project-setup-process.md` |
| Auditing a project for conformance | `guides/audit-process.md` |
| Updating a guide file | `guides/guide-maintenance.md` |

**If no trigger matches:** proceed without loading additional files.

---

## conventions/
Technical and tooling conventions.

| File | Summary | Keywords |
|------|---------|----------|
| filesystem.md | Use `filesystem` for reads, `edit-file-lines` for writes, `node` for mechanical copy/replace ops (zero tokens) | filesystem, MCP, read, write, copy, node, regex, files |
| documentation.md | Convention universelle pour tous les fichiers Markdown — structure, titres, TOC, Keywords, Index, Changelog, Quick Start, citations | markdown, documentation, TOC, titres, ancres, keywords, index, changelog, quick-start, citations |
| sqlite.md | One statement per call, DELETE before INSERT, always verify after writes, update schema.sql after DDL | sqlite, MCP, SQL, database, schema, write, query |
| commwise-layout.md | `max-height` is the only reliable way to constrain flex children overridden by CommWise `!important` rules | CommWise, flex, layout, max-height, viewport, CSS, override |
| commwise-modals.md | Modal open/close requires both `dds-hidden` (display) and `visible` (opacity/visibility) + mandatory reflow between. Disabled buttons need ID-level CSS override. | CommWise, modal, overlay, dds-hidden, visible, disabled, button, CSS, trap |
| claude-chrome-mcp.md | Use Claude in Chrome MCP for live DOM diagnostics and JS fix validation — eliminates layout guesswork | Chrome, MCP, browser, DOM, debug, javascript, inspect, layout |
| claude-structured-reasoning.md | 8 core techniques for clearer thinking: thinking tags, step-by-step decomposition, chain-of-thought, roles, structure, adversarial framing, constraints, reference-based | thinking-tags, chain-of-thought, structured-reasoning, prompting, clarity, analysis, constraints |
| indexeddb-file-protocol.md | IndexedDB replaces localStorage for `file://` HTML pages — Chrome blocks localStorage in file:// context; IndexedDB works reliably. Includes reusable async snippet and migration table. | IndexedDB, localStorage, file-protocol, browser-storage, persistence, patch, HTML |
| glossary.md | Convention pour GLOSSARY.md dans chaque projet — domaines, termes, references croisees, chargement selectif par un AI Assistant. Section ## Glossary obligatoire dans PROJECT.md. | glossaire, glossary, terminologie, domaines, definitions, conformite, audit |
| tools.md | Node.js script-based tools — when to use, structure, standard interface (args, stdout, exit codes), invocation via commands MCP, output rules, catalogue. | tools, scripts, node, automation, token-efficiency, commands-mcp, cross-project |
| todo.md | Lightweight backlog for any project — format, states, archiving, AI Assistant role. Two files: TODO.md (active) + TODO-archive.md (done). | todo, backlog, tasks, priority, archiving, session |
| project-structure.md | Canonical structure for any Claude project — folder layout, mandatory files, Claude project instructions template, bootstrap chain. | project-structure, claude-project, instructions, template, bootstrap, scaffold |

---

## guides/
Setup and configuration guides for new projects.

| File | Summary | Keywords |
|------|---------|----------|
| project-setup-process.md | Process to create a new Claude project. References best practices at each step. Includes scaffolding, file templates, checklist, and examples. | project-setup, process, initialization, configuration, best-practices, scaffolding |
| best-practices.md | Design principles for Claude project structure | best-practices, structure, instructions, conventions, clarity, context, design-principles |
| audit-process.md | Process to verify project conformance to best practices. Rules of engagement: session dedication, corrections, guide updates, re-audit separation. Structured findings, proposals, approval workflow. Includes checkpoint + batching workflow. | audit, verification, best-practices, compliance, quality-assurance, process, methodology |
| guide-maintenance.md | Standards for maintaining all guides: update Table of Contents and Changelog with every modification. Required for all guides (project-setup, best-practices, audit-process). | maintenance, guides, documentation, changelog, discoverability, traceability, standards |

---

## Keywords
index, conventions, workflows, guides, navigation, discoverability, knowledge-base, decision-layer, scope

---

## Index

| Terme | Occurrences |
|-------|-------------|

---

## Changelog

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
- Table workflows/ avec keywords
- Table guides/ avec keywords
