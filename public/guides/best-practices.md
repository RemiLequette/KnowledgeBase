# AI-Assisted Project Best Practices

## Quick Start

Best practices for structuring AI-assisted projects — the reference used by audits and project setups.
They complement the conventions: where a convention defines the "how", a best practice defines the "why" and the design intent.
Most best practices are standalone principles that did not fit naturally into a single convention.
Load when auditing a project or setting up a new one.

---

## Table of Contents

1. [Bootstrap File Minimalism](#1-bootstrap-file-minimalism)
2. [No Circular References](#2-no-circular-references)
3. [Reference External Knowledge via Decision Layer](#3-reference-external-knowledge-via-decision-layer)
4. [Imperative Rules with Comments](#4-imperative-rules-with-comments)
5. [Minimal Project-Specific Overrides](#5-minimal-project-specific-overrides)
6. [Structure: Top-Down, Linear](#6-structure-top-down-linear)
7. [Documentation: Brief, Actionable](#7-documentation-brief-actionable)
8. [Project Naming & Transportability](#8-project-naming--transportability)
9. [Documentation Convention](#9-documentation-convention)
10. [Testing — TDD and debug distinction](#10-testing--tdd-and-debug-distinction)
- [Guide Maintenance Standards](#guide-maintenance-standards)
- [Quick Checklist](#quick-checklist)
- [Index](#index)
- [Changelog](#changelog)
- [Keywords](#keywords)

---

## 1. Bootstrap File Minimalism
[up](#table-of-contents)

**Principle:** Keep the bootstrap file minimal. Details belong in `PROJECT.md`.

See `conventions/project-structure.md` — Bootstrap Files section — for the canonical template and rules.

**Anti-Pattern ❌**
```
Your project folder is: ...
Load these 5 files from here...
Then load these conventions...
Now read this...
Also remember these rules...
```

WHY: A bloated bootstrap file is hard to maintain and obscures the entry point. The bootstrap file is the only place with absolute paths — everything else flows from there.

---

## 2. No Circular References
[up](#table-of-contents)

**Principle:** A file must never instruct the AI Agent to read itself.

**Anti-Pattern ❌**
```
Read PROJECT.md (this file), then proceed.
```

**Correct Pattern ✅**
```
PROJECT.md is loaded by the bootstrap chain.
It does not reference itself.
```

WHY: Circular references create infinite loops or silent failures at session start.

---

## 3. Reference External Knowledge via Decision Layer
[up](#table-of-contents)

**Principle:** Conventions are loaded on demand by the decision layer in `INDEX.md` — not pre-loaded exhaustively in the bootstrap file or `PROJECT.md`.

**Correct Pattern ✅**
The bootstrap file loads `INDEX.md`. The decision layer in `INDEX.md` matches the current task to the relevant convention and loads only what is needed.

**Anti-Pattern ❌**
```
Always load:
- conventions/filesystem.md
- conventions/sqlite.md
- conventions/claude-structured-reasoning.md
- conventions/claude-chrome-mcp.md
...
```

WHY: Pre-loading everything wastes context window. The decision layer exists precisely to make loading selective and task-driven.

**Exception:** A convention that must always load regardless of the task can be listed explicitly in `## AI Agent Setup` in `PROJECT.md`. This should be rare.

---

## 4. Imperative Rules with Comments
[up](#table-of-contents)

**Principle:** Every rule imposed on the AI Agent must include a WHY comment.

**Correct Pattern ✅**
```markdown
Always ask before modifying files in `data/`.

WHY: This folder contains raw input data. Accidental modification is unrecoverable.
```

**Anti-Pattern ❌**
```markdown
Do not modify files in data/.
```

WHY: Without context, the AI Agent cannot judge edge cases correctly. A rule without a reason is opaque to future sessions and other agents.

---

## 5. Minimal Project-Specific Overrides
[up](#table-of-contents)

**Principle:** Avoid project-local rules and conventions if possible. Use the knowledge base instead.

If a rule or convention is truly specific to one project:
- Add it to `## AI Agent Setup` in `PROJECT.md`
- Or create a local `conventions/` folder in the project and reference it there

**When to use local overrides (rare):**
- The rule is unique to this project and will not be reused
- The rule is too narrow to belong in the shared knowledge base
- The deviation from standard behavior must be explicit and justified

**Anti-Pattern ❌**
```markdown
## AI Agent Setup

Always load:
- conventions/filesystem.md
- conventions/sqlite.md
- conventions/documentation.md
- conventions/glossary.md
...
```

WHY: Duplicating knowledge base conventions in every project defeats the purpose of a shared knowledge base and creates maintenance burden.

---

## 6. Structure: Top-Down, Linear
[up](#table-of-contents)

**Principle:** The bootstrap chain must flow top-to-bottom without backtracking.

**Correct Pattern ✅**
```
1. Bootstrap file loads INDEX.md
2. INDEX.md decision layer loads relevant conventions
3. Bootstrap file loads PROJECT.md
4. AI Agent proceeds with the user request
```

**Anti-Pattern ❌**
```
1. Read PROJECT.md
2. Go back and read INDEX.md
3. Return to PROJECT.md for the AI Agent Setup section
4. Also read this other file first
```

WHY: Backtracking creates confusion, increases token usage, and makes session startup unpredictable.

---

## 7. Documentation: Brief, Actionable
[up](#table-of-contents)

**Principle:** Every instruction in project files must be clear and directly executable by the AI Agent.

**Correct Pattern ✅**
```markdown
Always use the `filesystem` MCP tool for file reads.

WHY: Claude's bash tool reads from its Linux container, not your local machine.
```

**Anti-Pattern ❌**
```markdown
You should probably use the filesystem tool when reading files,
though in some cases the other tool might work too,
so use your judgment depending on the situation...
```

WHY: Ambiguous instructions produce inconsistent behavior across sessions.

---

## 8. Project Naming & Transportability
[up](#table-of-contents)

**Principle:** Projects must be renameable and relocatable without breaking references.

### Rule 1: Canonical name in PROJECT.md

The canonical project name is defined explicitly in `PROJECT.md ## Purpose`.
The folder name is a filesystem-friendly approximation (lowercase, hyphens) — it may differ slightly.

### Rule 2: No project name in subfolder names

**Incorrect ❌**
```
my-project/my-project-src/
my-project/docs/my-project-guide.md
```

**Correct ✅**
```
my-project/src/
my-project/docs/guide.md
```

WHY: Subfolder names containing the project name break when the project is renamed.

### Rule 3: No absolute paths inside the project

File references inside the project must be relative to the project root.
The only absolute paths are in the bootstrap file (project folder, KB folder).

**Incorrect ❌**
```markdown
See: C:\Users\RemiLequette\Development\projects\my-project\docs\guide.md
```

**Correct ✅**
```markdown
See: `docs/guide.md`
```

WHY: Absolute internal paths break when the project is moved to a different location.

### Rule 4: Project name in metadata only

The project name appears in headers and metadata — not scattered through content.

**Incorrect ❌**
```markdown
my-project is a tool for processing data.
When you start my-project, it will...
To configure my-project, edit...
```

**Correct ✅**
```markdown
# my-project

## Purpose
This project processes customer data.
```

WHY: When renaming, you replace the name in one metadata line — not throughout the content.

### What Gets Audited
- Canonical project name stated in `PROJECT.md ## Purpose`
- No project name in subfolder names (except root folder)
- No absolute paths inside the project
- Project name not scattered through content

---

## 9. Documentation Convention
[up](#table-of-contents)

**Principle:** All Markdown files in any project follow a single documentation convention.

See `conventions/documentation.md` for the full specification.

Covers: file structure, headings, TOC, Keywords, Index, Changelog, Quick Start.

WHY: A single convention makes all files auditable and consistent across projects without adaptation.

---

## 10. Testing — TDD and debug distinction
[up](#table-of-contents)

**Principle:** In TDD, write the test and the implementation together — no need to witness the red state. Only run tests once, to confirm green. Reserve the red→green cycle for bug fixes.

**New feature (TDD) ✔**
1. Write the test
2. Write the implementation
3. Run — confirm green

**Bug fix ✔**
1. Write a test that reproduces the bug — confirm red
2. Fix the implementation
3. Run — confirm green

WHY: Witnessing red on a new feature adds no value — the code does not exist yet, of course it fails. The red→green discipline matters for bugs: it proves the test actually caught the regression before the fix.

**Anti-pattern ❌**
Running tests after writing only the test, before writing the implementation, for every new feature. This wastes a round trip and adds no signal.

---

## Guide Maintenance Standards
[up](#table-of-contents)

All guides in the knowledge base follow standardized maintenance rules.
See `guides/guide-maintenance.md` for the full specification.

Required for every modification to any guide: update TOC and Changelog.

---

## Quick Checklist
[up](#table-of-contents)

- [ ] Bootstrap file is minimal — follows template in `conventions/project-structure.md`?
- [ ] No circular references in `PROJECT.md` or bootstrap file?
- [ ] Conventions loaded via decision layer, not pre-loaded exhaustively?
- [ ] All rules have WHY comments?
- [ ] Project-specific overrides are minimal and justified?
- [ ] Bootstrap chain flows top-down without backtracking?
- [ ] Instructions are clear and directly executable?
- [ ] Canonical project name in `PROJECT.md ## Purpose`?
- [ ] No project name in subfolder names?
- [ ] No absolute paths inside the project?
- [ ] Project name not scattered through content?
- [ ] All Markdown files follow `conventions/documentation.md`?
- [ ] Tests follow TDD discipline — run once to confirm green; red→green only for bug fixes?

---

## Index

| Terme | Occurrences |
|-------|-------------|

---

## Changelog

### Version 1.9 — BP#10 Testing TDD and debug distinction
**Date:** 2026-06-12
**Reason:** Session observation — red state on new features adds no value. Captured the distinction between TDD (test + impl together, run once) and bug fix (red→green proves the test catches the regression).

**Changes:**
- TOC: BP#10 added
- Content: `## 10. Testing — TDD and debug distinction` added
- Quick Checklist: TDD item added

---

### Version 1.8 — Refactoring complet
**Date:** 2026-05-31
**Raison:** Suppression de Claude.md. Generalisation AI-assisted. Elimination des doublons avec les conventions. BP#8 (absolute paths) supprimee (incorrecte). 15 BP -> 9 BP. Quick Start reecrit en anglais sans liste.

**Modifications :**
- Titre : "Claude.ai Best Practices" -> "AI-Assisted Project Best Practices"
- Quick Start : reecrit en anglais, principes generaux, sans liste
- BP#1 : "Instruction Minimalism" -> "Bootstrap File Minimalism" — pointeur vers project-structure.md
- BP#2 : "Separate Claude-Specific" supprimee (migree dans project-structure.md) ; "No Circular References" devient BP#2
- BP#3 : "Reference External Knowledge via Decision Layer" — standalone enrichi
- BP#4 : "Imperative Rules with Comments" — standalone
- BP#5 : "Minimal Project-Specific Overrides" — fusion BP#6 + BP#7
- BP#6 : "Structure: Top-Down, Linear" — standalone
- BP#7 : "Documentation: Brief, Actionable" — standalone
- BP#8 : "Project Naming & Transportability" — fusion BP#11 + BP#11a + BP#11b
- BP#8 ancienne (File Paths Always Absolute) : supprimee (incorrecte)
- BP#9 : "Documentation Convention" — pointeur vers conventions/documentation.md
- BP#10-15 : supprimes (couverts par conventions/project-structure.md)
- Quick Checklist : mise a jour complete
- Keywords : mis a jour

---

### Version 1.7 — Suppression session-startup
**Date:** 2026-05-31
**Raison:** session-startup.md supprime.

---

### Version 1.0 — Initial Release
**Date:** 2026-05-29
**Raison:** 15 design principles pour structurer les projets Claude.

---

## Keywords
best-practices, project-structure, ai-assisted, conventions, audit, design-principles, naming, transportability, documentation
