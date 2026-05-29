# Claude.ai Best Practices

## Quick Start

The 15 principles in 60 seconds:

1. Keep instructions minimal (2-3 lines)
2. Separate generic context from Claude-specific setup
3. Never use circular references
4. Always use absolute paths (never relative)
5. Add WHY comments to rules
6. Load conventions systematically via session-startup
7. Use minimal, custom rules only when truly unique
8. File structure: top-down, linear (no backtracking)
9. Instructions must be clear and actionable
10. Minimal desktop instructions → point to Claude.md
11. Have an Audit section in PROJECT.md
12. Provide README.md for human navigation
13. Add Keywords to all files for discoverability
14. Structure guides as: Quick Start → Full Details
15. Best practices = foundation for audit and setup processes

*For full details on each principle, see sections below.*

---

## Table of Contents

- [Quick Start](#quick-start)
- [Principles](#principles)
  - [1. Instruction Minimalism](#1-instruction-minimalism)
  - [2. Separate Claude-Specific from Generic Context](#2-separate-claude-specific-from-generic-context)
  - [3. No Circular References](#3-no-circular-references)
  - [4. Reference External Knowledge Correctly](#4-reference-external-knowledge-correctly)
  - [5. Imperative Rules with Comments](#5-imperative-rules-with-comments)
  - [6. Explicit Conventions List](#6-explicit-conventions-list-optional-but-recommended)
  - [7. Minimal Custom Rules](#7-minimal-custom-rules)
  - [8. File Paths: Always Absolute](#8-file-paths-always-absolute)
  - [9. Structure: Top-Down, Linear](#9-structure-top-down-linear)
  - [10. Documentation: Brief, Actionable](#10-documentation-brief-actionable)
  - [11. Claude Project Setup](#11-claude-project-setup)
  - [11a. Documentation Naming Consistency](#11a-documentation-naming-consistency)
  - [11b. Project Transportability & Renaming](#11b-project-transportability--renaming)
  - [12. Audit Section in Project Metadata](#12-audit-section-in-project-metadata)
  - [13. README.md for Human Navigation](#13-readmemd-for-human-navigation)
  - [14. Keywords for Discoverability](#14-keywords-for-discoverability)
  - [15. Structure: Quick Start + Deep Dive](#15-structure-quick-start--deep-dive)
- [Guide Maintenance Standards](#guide-maintenance-standards)
- [Quick Checklist](#quick-checklist)
- [Examples](#examples)
- [Changelog](#changelog)
- [Keywords](#keywords)

---

Guidelines for structuring Claude projects to ensure consistency, clarity, and maintainability.

---

## 1. Instruction Minimalism

**Principle:** Keep Claude Project instructions minimal. Details belong in Claude.md.

### Claude Project Instructions (in UI)
Should be 2-3 lines max:
```
Your project folder is: C:\Users\RemiLequette\Development\projects\[PROJECT_NAME]

Read Claude.md at the root of your project folder first.
```

### Why
- Easier to read and update
- Clear entry point (Claude.md)
- Not cluttered with implementation details

### Anti-Pattern ❌
```
Your project folder is: ...
Load these 5 files from here...
Then load these conventions...
Now read this...
Also remember these rules...
```

---

## 2. Separate Claude-Specific from Generic Context

**Principle:** Split project knowledge into two categories:

### Generic Context (any AI assistant)
File: **`context.md`** (or `PROJECT.md`)

Contains:
- Project description & purpose
- Business rules & constraints
- Key paths & folder structure
- Requirements/scope
- Domain-specific knowledge

**Who reads it:** Any AI system, humans, future maintainers

### Claude-Specific Setup
File: **`Claude.md`**

Contains:
- IMPERATIVE: Read context.md first (with comment explaining why)
- Reference to `session-startup.md`
- Claude-specific conventions to load
- Anything unique to Claude's workflow

**Who reads it:** Claude, at the start of every session

### Example Structure

#### context.md
```markdown
# Project Context

## Purpose
This is a data pipeline project that processes customer transactions.

## Rules (for any AI assistant)
- Never modify `config.json` without explicit approval
- Always verify SQL before executing on production
- Customer data is PII — handle carefully

## Structure
- `src/` — Python source code
- `data/` — Data files (never commit sensitive data)
- `sql/` — SQL scripts
- `.env` — Environment variables (never read/display)

## Key Constraints
- Must support Python 3.10+
- Database: PostgreSQL 14+
- No external API calls without approval
```

#### Claude.md
```markdown
# Claude Instructions

**FIRST: Read project context**
- C:\Users\RemiLequette\Development\projects\[PROJECT]\context.md

WHY: This file contains project knowledge relevant to any AI system.
Separating it from Claude-specific setup keeps the project portable and clear.

**THEN: Load Claude-specific setup**
- C:\Users\RemiLequette\Development\projects\claude-knowledge\workflows\session-startup.md

---

## Claude-Specific Setup

This project uses:
- `filesystem.md` convention (file operations)
- `sqlite.md` convention (database queries)
- Standard tool modification protocol
```

### Why This Matters
✅ Project is understandable by other AI systems (Claude, GPT, etc.)  
✅ Clear separation of concerns  
✅ Easier to maintain & update  
✅ Portable knowledge  

---

## 3. No Circular References

**Principle:** Don't read a file from within itself.

### Anti-Pattern ❌
Claude.md says:
```
Read and follow:
1. Claude.md (this file)
2. Then do other things
```

Or:
```
Read Claude.md
Then read Claude.md again
```

### Correct Pattern ✅
```
Read context.md
Then read workflows/session-startup.md
Then proceed
```

---

## 4. Reference External Knowledge Correctly

**Principle:** Load knowledge from knowledge base systematically, not ad-hoc.

### Correct Pattern ✅
Claude.md specifies:
```
Read: workflows/session-startup.md

This workflow automatically loads:
- INDEX.md (conventions overview)
- Relevant conventions based on project type
- Rules that apply
```

### Anti-Pattern ❌
```
Load filesystem.md
Load sqlite.md
Load claude-structured-reasoning.md
Load rules/tool-modification-protocol.md
Load ...
```

Reason: Session-startup.md already has this logic. Duplicate loading is inefficient.

---

## 5. Imperative Rules with Comments

**Principle:** When imposing a rule, explain WHY it exists.

### Correct Pattern ✅
```markdown
**ALWAYS follow this before modifying files:**
C:\...\claude-knowledge\rules\tool-modification-protocol.md

WHY: This ensures we don't make destructive changes without confirmation,
protecting the integrity of the project.
```

### Anti-Pattern ❌
```markdown
Load tool-modification-protocol.md
```

Reason: Future Claude (or another AI) won't understand the intent.

---

## 6. Explicit Conventions List (Optional but Recommended)

**Principle:** If a project deviates from standard conventions, list them explicitly.

### Example
```markdown
## Conventions This Project Uses

Standard:
- `filesystem.md` — file operations
- `rules/tool-modification-protocol.md` — all file modifications

Custom:
- `conventions/myproject-sql-patterns.md` — domain-specific SQL (local to this project)
```

### Why
- Clarity for next session or hand-off
- Easy to audit what's loaded
- Prevents forgotten conventions

---

## 7. Minimal Custom Rules

**Principle:** Avoid project-local rules if possible. Use knowledge base instead.

### Correct Pattern ✅
```
All rules are in: C:\...\claude-knowledge\rules\
Projects reference them from there.
```

### When to Use Local Rules (Rare)
Only if rule is:
- Truly unique to this project
- Won't be reused in other projects
- Not generic enough for knowledge base

Example (rare):
```
# Local Rule: Database Connection
This project uses PostgreSQL. Always use psycopg2, never raw SQL strings.
```

---

## 8. File Paths: Always Absolute

**Principle:** Use full, absolute paths in Claude.md. No relative paths.

### Correct ✅
```
C:\Users\RemiLequette\Development\projects\claude-knowledge\workflows\session-startup.md
```

### Incorrect ❌
```
./knowledge/workflows/session-startup.md
../claude-knowledge/workflows/session-startup.md
~/projects/claude-knowledge/...
```

Reason: Relative paths break when folder structure changes or is accessed from different locations.

---

## 9. Structure: Top-Down, Linear

**Principle:** Claude.md should flow top-to-bottom without backtracking.

### Correct ✅
```
1. Read context.md (generic project knowledge)
2. Read session-startup.md (Claude setup)
3. [Optional project-specific additions]
4. [Then proceed to request]
```

### Incorrect ❌
```
1. Read Claude.md rules
2. Then go back and read context.md
3. Then return to Claude setup
4. Oh wait, also read this other thing
```

---

## 10. Documentation: Brief, Actionable

**Principle:** Each instruction should be clear and executable.

### Correct ✅
```
Read: C:\...\context.md

This contains project rules and structure.
Relevant to any AI assistant.
```

### Incorrect ❌
```
You should probably read the context file
if you want to understand the project better,
though you might already know some of it,
so only read the parts you don't know...
```

---

## 11. Claude Project Setup

**Principle:** Instructions saved in Claude Desktop should be minimal, point to Claude.md, AND define the project name clearly.

The project name must be:
- **Defined explicitly in the Claude Desktop instructions** (visible entry point)
- **Used consistently** in Claude.md, PROJECT.md, README.md, and folder structure
- **In a standard format** (lowercase, hyphens, no spaces)

### Template for Setup Process

When creating a new Claude project, use this template for instructions:

```
Project name: [PROJECT-NAME]

Your project folder is: C:\Users\RemiLequette\Development\projects\[PROJECT-NAME]

Read Claude.md at the root of your project folder first.
```

**Replace `[PROJECT-NAME]`** with the actual project name (e.g., `my-data-pipeline`, `report-generator`)..

### Correct Pattern ✅

**Example: Project named "my-data-pipeline"**

In Claude Desktop project settings:
```
Project name: my-data-pipeline

Your project folder is: C:\Users\RemiLequette\Development\projects\my-data-pipeline

Read Claude.md at the root of your project folder first.
```

Then in `Claude.md`, `PROJECT.md`, and `README.md`, reference the same name:
- `# my-data-pipeline`
- Folder: `.../projects/my-data-pipeline`
- Consistent references throughout

### Why
- ✅ Project name is visible immediately (in instructions)
- ✅ Easy for setup process to generate correct paths
- ✅ No ambiguity about which project you're working on
- ✅ Consistent across all files

### Anti-Pattern ❌

```
Claude Desktop: "Your project folder is: C:\\...\\[PROJECT-NAME]"
Claude.md: "# My Project"
README.md: "Project: MyProject"
Folder: "my_project"
```

Or worse:
```
Claude Desktop: (no project name mentioned)
Your project folder is: C:\\Users\\...\\some-folder

Read Claude.md
```

Reason: Inconsistent or missing naming creates confusion.

### What Gets Audited
When auditing a project:
- Verify project name is clearly stated in Claude Desktop instructions
- Verify the same name appears in Claude.md, PROJECT.md, README.md
- Flag any inconsistencies or divergences

---

## 11a. Documentation Naming Consistency

**Principle:** The project name defined in Claude Desktop instructions must be used consistently across all documentation files.

The project name must appear identically in:
- **Claude Desktop instructions** (source of truth)
- **Claude.md** — Project header or metadata
- **PROJECT.md** — Project title section  
- **README.md** (if present) — Project title and headers

### Correct Pattern ✅

**Claude Desktop instructions:**
```
Project name: my-data-pipeline

Your project folder is: C:\Users\RemiLequette\Development\projects\my-data-pipeline

Read Claude.md at the root of your project folder first.
```

**Claude.md:**
```markdown
# Claude Instructions — my-data-pipeline

Project: my-data-pipeline
```

**PROJECT.md:**
```markdown
# my-data-pipeline

## Purpose
This project...
```

**README.md:**
```markdown
# my-data-pipeline

Quick navigation for my-data-pipeline project.
```

### Why
- ✅ Reader always knows which project they're working on
- ✅ No confusion between similar projects
- ✅ Easy to search for project across files
- ✅ Professional, consistent appearance

### What Gets Audited
When auditing a project:
- Search for the project name in Claude.md, PROJECT.md, README.md
- Verify it's spelled and formatted identically everywhere
- Flag any variations (uppercase, underscores, different names)

---

## 11b. Project Transportability & Renaming

**Principle:** Projects should be easily renamed or moved to different locations in the file system without breaking references or requiring manual fixes.

This requires three rules:

### Rule 1: No Project Name in File Paths

**Incorrect ❌**
```
C:\Users\RemiLequette\Development\projects\my-data-pipeline\my-data-pipeline-src\â‘¦
C:\Users\RemiLequette\Development\projects\my-data-pipeline\docs\my-data-pipeline-guide.md
```

**Correct ✅**
```
C:\Users\RemiLequette\Development\projects\my-data-pipeline\src\â‘¦
C:\Users\RemiLequette\Development\projects\my-data-pipeline\docs\guide.md
```

**Why:** If you rename the project, folder names with the project name break internal references.

### Rule 2: No Absolute File References

**Incorrect ❌**
```markdown
Read: C:\Users\RemiLequette\Development\projects\my-data-pipeline\Claude.md
Execute: C:\Users\RemiLequette\Development\projects\my-data-pipeline\scripts\setup.sh
```

**Correct ✅**
```markdown
Read: Claude.md (in project root)
Execute: ./scripts/setup.sh
```

**Why:** Absolute paths break when moving the project to a different location. Use relative paths from project root.

### Rule 3: Easy Identification of Project Name in Documentation

**For replacement purposes:** Project name should appear in a predictable, consistent location in metadata/headers - NOT scattered through content.

**Correct ✅**
```markdown
# Project Name: my-data-pipeline

## Purpose
This project processes customer data.
It contains... (no mention of "my-data-pipeline" in content)
```

```markdown
Project: my-data-pipeline

Setup instructions:
1. Clone the repository
2. Run setup.sh
(project name only in metadata line)
```

**Incorrect ❌**
```markdown
# my-data-pipeline Data Processing System

my-data-pipeline is a tool for processing data.
When you start my-data-pipeline, it will...
To configure my-data-pipeline, edit...
(project name scattered throughout)
```

**Why:** When renaming, you only need to replace the project name in ONE metadata line, not hunt through all the content.

### What Gets Audited
When auditing a project:
- ✅ Verify folder names don't include project name (except the root folder)
- ✅ Verify all file references are relative (no absolute paths)
- ✅ Verify project name appears ONLY in metadata lines, not in content
- ✅ Flag any violations that would break renaming/relocation

### Benefit
- ✅ Rename project by changing one metadata line
- ✅ Move project anywhere in file system
- ✅ No broken references or manual fixes needed
- ✅ Reusable template for new projects

---

## 12. Audit Section in Project Metadata

**Principle:** Make auditing discoverable and standard.

Every project should have a clear **Audit section** in `PROJECT.md` (or equivalent metadata file):

```markdown
## Audit

To audit this project's conformance to best practices:

1. Read: `guides/audit-process.md` — The audit methodology
2. Verify against: `guides/[PROJECT]-best-practices.md` — This project's standards

See `guides/audit-process.md` for the complete process.
```

### Why
- Makes auditing an expected, regular practice
- Clarifies where to find audit guidance
- Signals that the project is self-aware about quality
- Enables systematic improvements

---

## 13. README.md for Human Navigation

**Principle:** Make the project accessible to non-technical stakeholders.

Every project should have a **README.md** file at the root that:
- Explains the project in plain language
- Provides quick navigation (links to key files)
- Is readable by humans, not just Claude
- Acts as entry point for team members

### Correct ✅
```markdown
# Project Name

Quick navigation:
- **Getting started?** → See `guides/setup.md`
- **How to audit?** → See `guides/audit-process.md`
- **Best practices?** → See `guides/best-practices.md`

## What This Is
[Brief, human-friendly explanation]
```

### Incorrect ❌
No README, or only technical documentation.

### Why
- Knowledge base is useless if humans can't navigate it
- Demonstrates the project is maintained and organized
- First impression matters
- Bridges gap between technical and non-technical stakeholders

---

## 14. Keywords for Discoverability

**Principle:** Make the knowledge base searchable and indexed.

Every guide and major file should have a **Keywords section**:

```markdown
---

## Keywords
audit, verification, conformance, process, methodology, project
```

### Guidelines
- Keywords are 1-3 word terms, comma-separated
- Should be searchable within the knowledge base
- Help discover related documents
- Consistent across the entire knowledge base

### Why
- Makes the KB navigable without central index
- Helps future maintenance (what matches these keywords?)
- Supports discoverability and cross-referencing
- Minimal overhead, maximum value

---

## 15. Structure: Quick Start + Deep Dive

**Principle:** Respect different reading styles.

Every guide should be structured as:

1. **Quick Start** — Minimal, actionable steps (3-5 lines)
2. **Full Details** — Comprehensive reference (everything needed)
3. **Examples** — Concrete, realistic scenarios
4. **Keywords** — For discoverability

### Correct ✅
```markdown
# My Guide

## Quick Start
[3-5 line instructions that work immediately]

## Full Details
[Comprehensive explanation, edge cases, rationale]

## Examples
[Real-world examples]

## Keywords
[...]
```

### Incorrect ❌
```markdown
# My Guide

Long prose explanation...
Eventually you find what you need...
But it takes scrolling...
No examples...
No keywords...
```

### Why
- Users can get started immediately (Quick Start)
- Experts can find depth when needed (Full Details)
- Everyone wins
- Supports both lazy and thorough readers

---

## Guide Maintenance Standards

All guides in the knowledge base (including this one) follow standardized maintenance rules:

**→ `guides/guide-maintenance.md`**

These rules ensure:
- ✅ Table of Contents stays in sync with document structure
- ✅ Changelog documents every modification with rationale
- ✅ Guides remain navigable and trustworthy

**Required:** Every modification to any guide must follow these standards. This applies to:
- `project-setup-process.md`
- `Claude.ai-best-practices.md` (this file)
- `audit-process.md`

See `guides/guide-maintenance.md` for complete standards.

---

## Quick Checklist

- [ ] Claude Project instructions are 2-3 lines max?
- [ ] Claude Project instructions point to Claude.md?
- [ ] `context.md` exists and contains generic project knowledge?
- [ ] `Claude.md` starts with: "Read context.md first"?
- [ ] `Claude.md` references `session-startup.md`?
- [ ] All external paths are absolute, not relative?
- [ ] No circular references (files don't reference themselves)?
- [ ] Rules have WHY comments explaining intent?
- [ ] No duplication between Claude.md and context.md?
- [ ] Structure flows top-to-bottom?
- [ ] Instructions are actionable?
- [ ] Desktop instructions and Claude.md work together (not duplicate)?
- [ ] `README.md` exists for human navigation?
- [ ] `PROJECT.md` has Audit section?
- [ ] All files have Keywords section?
- [ ] All guides follow Quick Start + Deep Dive structure?

---

## Examples

See `guides/project-setup-process.md` for full project setup examples including:
- Minimal project
- Complex project

Both follow these best practices.

---

## Changelog

### Version 1.2 — Refined BP #11 & Added BP 11a & 11b: Project Naming & Portability Strategy
**Date:** 2026-05-29  
**Rationale:** Clarify that project name is defined in Claude Desktop instructions (not in docs). Provide template for setup process. Add rules for naming consistency and project transportability.

**Changes:**
- Restructured BP #11: name now defined in Claude Desktop instructions (visible entry point)
- Added explicit line to template: **`Project name: [PROJECT-NAME]`** (makes naming crystal clear)
- Added template with `[PROJECT-NAME]` placeholder for setup process to fill
- Renamed from "Claude Project Instructions: Minimal & Pointing" to "Claude Project Setup"
- Added BP 11a: "Documentation Naming Consistency" (new)
  - Specifies that project name must appear identically in Claude.md, PROJECT.md, README.md
  - Provides examples for each file
  - Clear audit criteria
- Added BP 11b: "Project Transportability & Renaming" (new)
  - Rule 1: No project name in folder paths (only in root)
  - Rule 2: No absolute file references (use relative to project root)
  - Rule 3: Project name only in metadata/headers, not scattered in content
  - Enables easy renaming and relocation
  - Clear audit criteria
- Updated audit criteria for BP 11, 11a, and 11b
- Updated anti-pattern to show both inconsistent AND missing project names

**Benefit:** Crystal clear single source of truth (Claude Desktop instructions). Easy template for setup. Guaranteed consistency across all files. Projects can be renamed or moved without breaking anything.

---

### Version 1.1 — Enhanced BP #11: Claude Project Setup
**Date:** 2026-05-29  
**Rationale:** Add explicit project naming consistency across Claude Desktop, folder structure, and documentation.

**Changes:**
- Renamed BP #11 from "Claude Project Instructions: Minimal & Pointing" to "Claude Project Setup"
- Added requirement: project name must be clearly defined in the project
- Added requirement: project name must match Claude Desktop project name
- Added requirement: project name must be used consistently in paths and documentation
- Added 3-step pattern with concrete example (`my-data-pipeline`)
- Updated audit criteria to verify naming consistency

**Benefit:** Eliminates confusion when working with multiple projects; makes project identification unambiguous.

---

### Version 1.0 — Initial Release
**Date:** 2026-05-29  
**Status:** Stable

Initial version documenting the 15 core design principles for structuring Claude projects. These principles form the foundation for all project audits and setup processes in the knowledge base.

---

## Keywords
best-practices, project-structure, instructions, conventions, context, separation-of-concerns, clarity, audit, discoverability, README, documentation, navigation, keywords
