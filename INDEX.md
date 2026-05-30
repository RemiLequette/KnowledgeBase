# Knowledge Base Index

## Quick Start

Point d'entrée de la knowledge base — à lire en début de chaque session.
Indique quels fichiers charger selon le type de tâche (fichiers, base de données, CSS, etc.).
Ne contient pas les conventions elles-mêmes — sert uniquement de carte de navigation.

## About this knowledge base

This repository captures conventions, patterns, and innovations discovered during work sessions with the designer. It is the canonical place to persist operational knowledge across Claude sessions.

**When to add here:**
- A tool behaves unexpectedly and a workaround is found — document it.
- A pattern proves reliable across multiple sessions — promote it.
- The designer explicitly asks to remember something technical — it belongs here, not in ephemeral memory.
- An innovation improves quality or reduces token cost noticeably — capture it.

**How to add:**
- Check `INDEX.md` first — the convention may already exist or belong in an existing file.
- Create a new file in `conventions/` if the topic is distinct enough to stand alone.
- Always update `INDEX.md` after adding or modifying a file — it is the entry point for every session.

**Format:** English only. Concise. Actionable. Prefer rules and examples over prose explanations.

---

## conventions/
Technical and tooling conventions.
**Load when:** working with files, tools, APIs, code patterns, or any technical setup.

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

---

## workflows/
Recurring processes and startup procedures.
**Load when:** Starting a new session, or executing a specific workflow.

| File | Summary | Keywords |
|------|---------|----------|
| session-startup.md | MANDATORY: Read INDEX.md, load project Claude.md, identify relevant conventions before answering. Checklist-based workflow. | startup, initialization, session, workflow, conventions |

---

## guides/
Setup and configuration guides for new projects.
**Load when:** Creating a new Claude Project, or setting up existing projects to use the knowledge base.

| File | Summary | Keywords |
|------|---------|----------|
| project-setup-process.md | Process to create a new Claude project. References best practices at each step. Includes scaffolding, file templates, checklist, and examples. | project-setup, process, initialization, configuration, best-practices, scaffolding |
| Claude.ai-best-practices.md | Design principles for Claude project structure | best-practices, structure, instructions, conventions, clarity, context, design-principles |
| audit-process.md | Process to verify project conformance to best practices. Rules of engagement: session dedication, corrections, guide updates, re-audit separation. Structured findings, proposals, approval workflow. Includes checkpoint + batching workflow. | audit, verification, best-practices, compliance, quality-assurance, process, methodology |
| guide-maintenance.md | Standards for maintaining all guides: update Table of Contents and Changelog with every modification. Required for all guides (project-setup, best-practices, audit-process). | maintenance, guides, documentation, changelog, discoverability, traceability, standards |

---

## Keywords
index, conventions, workflows, guides, navigation, discoverability, knowledge-base

---

## Index

| Terme | Occurrences |
|-------|-------------|

---

## Changelog

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
