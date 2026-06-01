# Project Setup Process

Step-by-step process for creating a new AI-assisted project that conforms to best practices from the start.

This guide implements the principles defined in: `guides/best-practices.md`
For the canonical project structure, see: `conventions/project-structure.md`

---

## Table of Contents

- [Project Setup Process](#project-setup-process)
  - [Table of Contents](#table-of-contents)
  - [For AI Assistant](#for-ai-assistant)
    - [Rule 1: Session Dedication](#rule-1-session-dedication)
    - [Rule 2: Follow Steps Sequentially](#rule-2-follow-steps-sequentially)
    - [Rule 3: Generate Templates](#rule-3-generate-templates)
    - [Rule 4: Propose Audit at End (Separate Session)](#rule-4-propose-audit-at-end-separate-session)
  - [Quick Start](#quick-start)
  - [Step 1: Create Project Folder](#step-1-create-project-folder)
  - [Step 2: Configure the Bootstrap File](#step-2-configure-the-bootstrap-file)
    - [Template — Claude (Claude.ai project instructions)](#template--claude-claudeai-project-instructions)
  - [Step 3: Create PROJECT.md](#step-3-create-projectmd)
  - [Step 4: Create README.md](#step-4-create-readmemd)
  - [Step 5: Identify Relevant Conventions](#step-5-identify-relevant-conventions)
  - [Step 6: Test the Session](#step-6-test-the-session)
  - [Checklist](#checklist)
  - [Examples](#examples)
    - [Minimal Project](#minimal-project)
    - [Project with AI Agent Setup overrides](#project-with-ai-agent-setup-overrides)
  - [Troubleshooting](#troubleshooting)
  - [Related Best Practices](#related-best-practices)
  - [Index](#index)
  - [Changelog](#changelog)
    - [Version 1.2 — Suppression Claude.md + generalisation AI-assisted](#version-12--suppression-claudemd--generalisation-ai-assisted)
    - [Version 1.1 — Suppression session-startup](#version-11--suppression-session-startup)
    - [Version 1.0 — Initial Release](#version-10--initial-release)
  - [Keywords](#keywords)

---

## For AI Assistant

**Setup sessions are dedicated.** One session = one new project setup.

User says:
> "Help me set up a new project called [PROJECT_NAME]"

The AI Assistant should follow these **Rules of Engagement:**

### Rule 1: Session Dedication

This is a setup session. Stay focused on project creation.

If user diverges (wants to start building, explore tools, etc.):
> "This is a setup session. Should we stay focused on project creation, or save that for another session?"

---

### Rule 2: Follow Steps Sequentially

Guide through steps 1-6 in order:
1. Create project folder
2. Configure the bootstrap file
3. Create PROJECT.md
4. Create README.md
5. Identify relevant conventions
6. Test the session

Don't skip steps or jump ahead.

---

### Rule 3: Generate Templates

For each file (PROJECT.md, README.md):
- Show the template
- Explain what each section means
- Ask for confirmation before creating
- Customize for the specific project

For the bootstrap file:
- Generate the ready-to-copy-paste text
- Ask the user to configure it manually in their orchestrator tool

---

### Rule 4: Propose Audit at End (Separate Session)

At the end of setup, recommend:

> "Your new project is ready! Before using it in earnest, would you like to audit it against best practices? Let's schedule that for your next session for a fresh perspective."

**NEVER run the audit in the same setup session.**

WHY: Session memory interferes with objectivity. Audit needs clean context.

---

## Quick Start

Guide étape par étape pour créer un nouveau projet AI-assisted conforme aux best practices.
Utiliser quand on initialise un nouveau projet : structure de dossiers, bootstrap file, PROJECT.md, README.md.
Une session dédiée par projet — ne pas mélanger setup et développement.

```
1. Create project folder
2. Configure the bootstrap file (copy-paste template below)
3. Create PROJECT.md
4. Create README.md
5. Identify relevant conventions
6. Test the session
```

---

## Step 1: Create Project Folder

Create the project root folder:

```
[project-root]/
├── PROJECT.md         <- Project metadata + AI Agent Setup
├── README.md          <- Human navigation
├── GLOSSARY.md        <- Project terminology (create later if needed)
└── TODO.md            <- Active backlog (create later if needed)
```

**Rules:**
- Folder name: lowercase, hyphens, no spaces (e.g. `my-data-analysis`)
- The canonical project name is defined in `PROJECT.md` — it may differ slightly from the folder name
- Location: anywhere on your filesystem — defined in the bootstrap file

See `conventions/project-structure.md` for the full structure convention.

---

## Step 2: Configure the Bootstrap File

The bootstrap file initializes the agent session. It is configured manually in the orchestrator tool.

Generate the text below (substituting actual values) and copy-paste it into the orchestrator.

### Template — Claude (Claude.ai project instructions)

```
My name is [USER-NAME].
You are [AI-NAME], my AI Assistant helping me with my project

use the filesystem MCP tool to read files
Read [FULL-PATH-KNOWLEDGE-BASE-PUBLIC]\public\INDEX.md
It gives you access to important skills to answer my requests

Read [FULL-PATH-PROJECT]\PROJECT.md
It gives you important information about my project

Please greet me with my project name and your name and role

```

**Example (filled in):**
```
My name is Remi.
You are Claude, my AI Assistant helping me with my project

use the filesystem MCP tool to read files
Read C:\Users\RemiLequette\Development\projects\knowledgebase\public\INDEX.md
It gives you access to important skills to answer my requests

Read C:\Users\RemiLequette\Development\projects\knowledgebase\PROJECT.md
It gives you important information about my project

Please greet me with my project name and your name and role

```

See `conventions/project-structure.md` — Bootstrap Files section — for the full specification.

---

## Step 3: Create PROJECT.md

`PROJECT.md` is the single entry point for the AI Agent at session start.

```markdown
# [PROJECT-NAME]

## Purpose

[PROJECT-NAME] — [brief description of what this project does]

## Structure

[Describe your folder layout and key files]

---

## AI Agent Setup

AI Assistant: Claude

[Leave empty if no project-specific overrides needed]

---

## Audit

To audit this project's conformance to best practices:

1. Read: `[KB-PUBLIC-PATH]/guides/audit-process.md`
2. Verify against: `[KB-PUBLIC-PATH]/guides/best-practices.md`

---

## Glossary

See `GLOSSARY.md` at project root.

---

## Keywords
[project keywords]

---

## Index

| Terme | Occurrences |
|-------|-------------|

---

## Changelog

### Version 1.0 - Creation
**Date:** [DATE]
**Raison:** Initial project setup.
```

See **Best Practice #12** (Audit Section in PROJECT.md).

---

## Step 4: Create README.md

`README.md` is for human navigation — plain language, quick links.

```markdown
# [PROJECT-NAME]

## What This Project Is

[Brief, human-friendly description]

## Quick Navigation

- **Project metadata & AI setup** → `PROJECT.md`
- **How to audit this project?** → `PROJECT.md` → Audit section
- **Project terminology** → `GLOSSARY.md`
- **Active tasks** → `TODO.md`

## Structure

[Describe your folder layout]
```

See **Best Practice #13** (README.md for Human Navigation).

---

## Step 5: Identify Relevant Conventions

Check the knowledge base decision layer (`INDEX.md`) to identify which conventions apply.

| Type | Convention | Always load in AI Agent Setup? |
|------|------------|-------------------------------|
| File operations | `conventions/filesystem.md` | Usually yes |
| Database work | `conventions/sqlite.md` | If using SQLite |
| Browser/DOM | `conventions/claude-chrome-mcp.md` | If web-based |
| Reasoning | `conventions/claude-structured-reasoning.md` | If complex analysis |
| CSS/Layout | `conventions/commwise-layout.md` | If CommWise project |
| Other | Check `INDEX.md` decision layer | As needed |

If a convention should always load regardless of the task, add it explicitly to `## AI Agent Setup` in `PROJECT.md`.

See **Best Practice #4** (Reference External Knowledge Correctly).

---

## Step 6: Test the Session

Start a new agent session in your project and verify:

- [ ] AI Agent reads `INDEX.md` automatically (via bootstrap file)
- [ ] AI Agent reads `PROJECT.md` automatically
- [ ] Correct conventions are loaded per decision layer
- [ ] First request works as expected

---

## Checklist

- [ ] Create project folder (lowercase, hyphens, no spaces)
- [ ] Configure bootstrap file in orchestrator (copy-paste template from Step 2)
- [ ] Create `PROJECT.md` (with Purpose, AI Agent Setup, Audit, Glossary sections)
- [ ] Create `README.md` (human navigation)
- [ ] Identify relevant conventions — add to `## AI Agent Setup` if always-load
- [ ] Test: start a session, verify bootstrap chain loads correctly
- [ ] (Later) Create `GLOSSARY.md` and `TODO.md` when needed

---

## Examples

### Minimal Project

**Bootstrap file (Claude.ai):**
```
My name is Remi Lequette.
You are Claude, my AI Assistant.

Project folder: C:\Users\RemiLequette\Development\projects\my-data-analysis
Knowledge Base folder: C:\Users\RemiLequette\Development\projects\knowledgebase\public

Use the `filesystem` MCP tool to read INDEX.md from the Knowledge Base folder.
Then use the `filesystem` MCP tool to read PROJECT.md at the root of the project folder.

WHY: filesystem MCP reads from your local machine, not Claude's Linux container.
INDEX.md bootstraps the session and loads shared conventions.
PROJECT.md loads project metadata and AI Agent Setup.
```

**PROJECT.md:**
```markdown
# my-data-analysis

## Purpose

my-data-analysis — Analyze customer transaction data using SQLite.

## Structure

- `data/` — raw data files
- `reports/` — generated reports

---

## AI Agent Setup

AI Assistant: Claude

---

## Audit

To audit this project:
1. Read: `C:\Users\RemiLequette\Development\projects\knowledgebase\public\guides\audit-process.md`
2. Verify against: `C:\Users\RemiLequette\Development\projects\knowledgebase\public\guides\best-practices.md`

---

## Glossary

See `GLOSSARY.md` at project root.

---

## Keywords
data-analysis, sqlite, transactions

---

## Index

| Terme | Occurrences |
|-------|-------------|

---

## Changelog

### Version 1.0 - Creation
**Date:** 2026-05-31
**Raison:** Initial project setup.
```

**README.md:**
```markdown
# my-data-analysis

## What This Project Is

Analyzes customer transaction data. Produces reports from SQLite queries.

## Quick Navigation

- **Project metadata & AI setup** → `PROJECT.md`
- **How to audit?** → `PROJECT.md` → Audit section
- **Terminology** → `GLOSSARY.md`
- **Tasks** → `TODO.md`
```

### Project with AI Agent Setup overrides

**PROJECT.md — AI Agent Setup section:**
```markdown
## AI Agent Setup

AI Assistant: Claude

### Always load
- `conventions/filesystem.md` — all file operations
- `conventions/claude-structured-reasoning.md` — complex analysis

### Critical files
- `config.json` — configuration (ask before modifying)
- `data/schema.sql` — database schema (never delete)
```

---

## Troubleshooting

**Q: AI Agent doesn't load the knowledge base automatically**
A: Check that the bootstrap file references `INDEX.md` with the `filesystem` MCP tool. Verify the path is absolute and exact.

**Q: I want a convention to always load for this project**
A: Add it explicitly to `## AI Agent Setup` in `PROJECT.md` under `### Always load`.

**Q: Can I have project-local conventions?**
A: Yes, create a `conventions/` folder in your project and reference them in `## AI Agent Setup` with paths relative to the project root.

**Q: The bootstrap template looks different from what I read elsewhere**
A: The canonical template is in `conventions/project-structure.md` — Bootstrap Files section. This guide generates a filled-in version of that template.

---

## Related Best Practices

- **#1** — Instruction Minimalism
- **#4** — Reference External Knowledge Correctly
- **#8** — File Paths: Always Absolute
- **#9** — Structure: Top-Down, Linear
- **#12** — Audit Section in Project Metadata
- **#13** — README.md for Human Navigation

See `guides/best-practices.md` for all practices.

---

## Index

| Terme | Occurrences |
|-------|-------------|

---

## Changelog

### Version 1.2 — Suppression Claude.md + generalisation AI-assisted
**Date:** 2026-05-31
**Raison:** Claude.md supprime. Bootstrap file remplace les instructions Claude Desktop comme concept generique. Steps reorganises (6 au lieu de 7). Templates mis a jour (PROJECT.md avec AI Agent Setup, README.md sans reference a Claude.md). Generalisation "Claude project" -> "AI-assisted project".

**Modifications :**
- Titre et descriptions : generalises
- For AI Assistant : "For Claude Assistance" renomme, steps mis a jour
- Step 2 : "Set Claude Desktop Instructions" -> "Configure the Bootstrap File" ; template mis a jour avec exemple rempli
- Step 3 : "Create Claude.md" supprime ; PROJECT.md template enrichi (AI Agent Setup, Glossary, Keywords, Index, Changelog)
- Step 4 : README.md template sans reference a Claude.md
- Step 5 : "Load in Claude.md?" -> "Always load in AI Agent Setup?"
- Step 6 : verification mise a jour (PROJECT.md au lieu de Claude.md)
- Checklist : mise a jour complete
- Examples : Minimal et Complex refaits sans Claude.md
- Troubleshooting : mise a jour
- Keywords : claude-assisted -> ai-assisted

---

### Version 1.1 — Suppression session-startup
**Date:** 2026-05-31
**Raison:** session-startup.md supprime. Bootstrap passe directement par INDEX.md.

---

### Version 1.0 — Initial Release
**Date:** 2026-05-29
**Raison:** Guide de setup initial — workflow 7 etapes pour creer un nouveau projet Claude.

---

## Keywords
project-setup, process, initialization, configuration, scaffolding, best-practices, workflow, new-project, checklist, ai-assisted, bootstrap
