# Project Setup Process

Step-by-step process for creating a new Claude project that conforms to best practices from the start.

This guide implements the principles defined in: `guides/Claude.ai-best-practices.md`

---

## Table of Contents

- [For Claude Assistance](#for-claude-assistance)
  - [Rule 1: Session Dedication](#rule-1-session-dedication)
  - [Rule 2: Follow Steps Sequentially](#rule-2-follow-steps-sequentially)
  - [Rule 3: Generate Templates](#rule-3-generate-templates)
  - [Rule 4: Propose Audit at End](#rule-4-propose-audit-at-end)
- [Quick Start](#quick-start)
- [Step 1: Create Project Folder Structure](#step-1-create-project-folder-structure)
- [Step 2: Set Claude Desktop Instructions](#step-2-set-claude-desktop-instructions-minimal)
- [Step 3: Create Claude.md](#step-3-create-claudemd)
- [Step 4: Create PROJECT.md](#step-4-create-projectmd)
- [Step 5: Create README.md](#step-5-create-readmemd)
- [Step 6: Identify Relevant Conventions](#step-6-identify-relevant-conventions)
- [Step 7: Test in Claude](#step-7-test-in-claude)
- [Troubleshooting](#troubleshooting)
- [Related Best Practices](#related-best-practices)
- [Changelog](#changelog)
- [Keywords](#keywords)

---

## For Claude Assistance

**Setup sessions are dedicated.** One session = one new project setup.

User says:
> "Help me set up a new Claude project called [PROJECT_NAME]"

Claude should follow **Rules of Engagement:**

### Rule 1: Session Dedication

This is a setup session. Stay focused on project creation.

If user diverges (wants to start building code, explore tools, etc.):
> "This is a setup session. Should we stay focused on project creation, or save that for another session?"

Keep the session focused.

---

### Rule 2: Follow Steps Sequentially

Guide through steps 1-7 in order:
1. Create project folder
2. Set Claude Desktop instructions
3. Create Claude.md
4. Create PROJECT.md (with Audit section)
5. Create README.md
6. Identify relevant conventions
7. Test in Claude

Don't skip steps or jump ahead.

---

### Rule 3: Generate Templates

For each file (Claude.md, PROJECT.md, README.md):
- Show the template
- Explain what each section means
- Ask for confirmation before creating
- Customize for the specific project

---

### Rule 4: Propose Audit at End (Separate Session)

At the end of setup, recommend:

> "Your new project is ready! Before using it in earnest, would you like to audit it against best practices? Let's schedule that for your next session for a fresh perspective."

**NEVER run the audit in the same setup session.** 

WHY: Session memory interferes with objectivity. Audit needs clean context.

---

## Quick Start

```
1. Create project folder
2. Set Claude Desktop instructions (minimal)
3. Create Claude.md
4. Create PROJECT.md with Audit section
5. Create README.md for humans
6. Test in Claude
```

---

## Step 1: Create Project Folder Structure

Create the basic folder structure:

```
C:\Users\RemiLequette\Development\projects\[PROJECT_NAME]/
├── Claude.md                    ← Instructions for Claude sessions
├── PROJECT.md                   ← Project metadata & audit info
├── README.md                    ← Documentation for humans
├── src/                         ← Your project files
└── ...
```

See **Best Practice #9** (Top-Down, Linear structure).

---

## Step 2: Set Claude Desktop Instructions (Minimal)

In Claude.ai or Claude Desktop project settings, set instructions to:

```
Your project folder is: C:\Users\RemiLequette\Development\projects\[PROJECT_NAME]

Read Claude.md at the root of your project folder first.
```

**That's it. Keep it 2-3 lines max.**

See **Best Practice #11** (Minimal & Pointing) and **Best Practice #1** (Instruction Minimalism).

---

## Step 3: Create Claude.md

In your project root, create `Claude.md`:

```markdown
# [PROJECT_NAME]

Read and follow this first:
C:\Users\RemiLequette\Development\projects\claude-knowledge\workflows\session-startup.md

---

## Project-Specific Setup

[Add any project-specific instructions here]

Examples:
- Required conventions to load from knowledge base
- File paths that matter for this project
- Tools that are forbidden/required
- Custom workflows or patterns unique to this project
```

See **Best Practice #2** (Separate Claude-Specific from Generic Context).

---

## Step 4: Create PROJECT.md

Create `PROJECT.md` with project metadata:

```markdown
# [PROJECT_NAME]

## Purpose
Brief description of what this project does.

## Structure
- `src/` — source code
- `docs/` — documentation
- etc.

## How to Use
Instructions for humans working on this project.

---

## Audit

To audit this project's conformance to best practices:

1. Read: `C:\Users\RemiLequette\Development\projects\claude-knowledge\guides\audit-process.md`
2. Verify against: `C:\Users\RemiLequette\Development\projects\claude-knowledge\guides\Claude.ai-best-practices.md`

See `audit-process.md` for the complete process.
```

See **Best Practice #2** (Generic Context) and **Best Practice #12** (Audit Section in PROJECT.md).

---

## Step 5: Create README.md

Create `README.md` for human navigation:

```markdown
# [PROJECT_NAME]

## Quick Navigation

**Getting started with Claude?**
- See: `Claude.md`

**How to audit this project?**
- See: `PROJECT.md` → Audit section

**What are the rules/best practices?**
- See: `guides/Claude.ai-best-practices.md` (knowledge base)

## What This Project Is

[Brief, human-friendly description]

## Structure

```
[PROJECT_NAME]/
├── Claude.md
├── PROJECT.md
├── README.md
├── src/
└── ...
```
```

See **Best Practice #13** (README.md for Human Navigation).

---

## Step 6: Identify Relevant Conventions

Before configuring Claude.md with conventions, check the knowledge base:

```
C:\Users\RemiLequette\Development\projects\claude-knowledge\INDEX.md
```

Identify which conventions apply to your project:

| Type | Convention | Load in Claude.md? |
|------|-------------|-------------------|
| File operations | `filesystem.md` | Usually yes |
| Database work | `sqlite.md` | If using SQLite |
| Browser/DOM | `claude-chrome-mcp.md` | If web-based |
| Reasoning | `claude-structured-reasoning.md` | If complex analysis |
| CSS/Layout | `commwise-layout.md` | If CommWise project |
| Other | Check INDEX.md | As needed |

Reference them in your `Claude.md` via `session-startup.md`.

See **Best Practice #4** (Reference External Knowledge Correctly).

---

## Step 7: Test in Claude

Start a Claude session in your project and verify:

- [ ] Claude reads `Claude.md` automatically
- [ ] `session-startup.md` loads
- [ ] Correct conventions are loaded
- [ ] First request works as expected

---

## Checklist: New Project Setup

- [ ] Create folder: `C:\Users\RemiLequette\Development\projects\[PROJECT_NAME]`
- [ ] Create `Claude.md` (minimal, references session-startup.md)
- [ ] Create `PROJECT.md` (with Audit section)
- [ ] Create `README.md` (for humans)
- [ ] Set Claude Desktop instructions (2-3 lines, point to Claude.md)
- [ ] Identify relevant conventions from knowledge base
- [ ] Test: Start a Claude session, verify it loads correctly
- [ ] (Optional) Create folder structure (`src/`, `docs/`, etc.)

---

## Examples

### Minimal Project

**Claude Project Instructions:**
```
Your project folder is: C:\Users\RemiLequette\Development\projects\my-data-analysis

Read Claude.md at the root of your project folder first.
```

**Claude.md:**
```markdown
# My Data Analysis Project

Read and follow:
C:\Users\RemiLequette\Development\projects\claude-knowledge\workflows\session-startup.md

## Setup

This project analyzes data using SQLite.
The sqlite.md convention should be loaded automatically.
```

**PROJECT.md:**
```markdown
# My Data Analysis

## Purpose
Analyze customer transaction data.

## Audit

To audit this project:
1. Read: `C:\Users\RemiLequette\Development\projects\claude-knowledge\guides\audit-process.md`
2. Verify against: `C:\Users\RemiLequette\Development\projects\claude-knowledge\guides\Claude.ai-best-practices.md`
```

**README.md:**
```markdown
# My Data Analysis Project

Quick links:
- **How to use Claude?** → See `Claude.md`
- **How to audit?** → See `PROJECT.md` → Audit
- **What are the rules?** → See knowledge base best practices
```

### Complex Project

**Claude.md:**
```markdown
# Complex Application

Read and follow:
C:\Users\RemiLequette\Development\projects\claude-knowledge\workflows\session-startup.md

## Project-Specific Rules

**ALWAYS:**
- Load `rules/tool-modification-protocol.md`
- Ask before modifying files
- Use `filesystem.md` for all file operations

**LOAD THESE CONVENTIONS:**
- `filesystem.md` (file operations)
- `claude-structured-reasoning.md` (complex analysis)
- Custom: `conventions/myapp-patterns.md` (project-local)

## Critical Files
- `src/core.py` — main logic (never delete)
- `config.json` — configuration (ask before modifying)
```

---

## Troubleshooting

**Q: Claude doesn't load the knowledge base automatically**  
A: Check that Claude.md references `session-startup.md` correctly. Verify the path is absolute and exact.

**Q: I want to add a custom rule/convention**  
A: Add a new file to `conventions/` in the knowledge base and reference it in your Claude.md.

**Q: How do I disable a rule for one project?**  
A: Don't reference it in that project's Claude.md. Rules are opt-in per project.

**Q: Can I have project-local conventions?**  
A: Yes, create a `conventions/` folder in your project and reference them in Claude.md with absolute paths.

**Q: Step 2 instructions look different from what I read elsewhere**  
A: This guide follows Best Practice #11 (Minimal & Pointing). Always use minimal, 2-3 line instructions pointing to Claude.md.

---

## Related Best Practices

This process implements these best practices:

- **#1** — Instruction Minimalism
- **#2** — Separate Claude-Specific from Generic Context
- **#8** — File Paths: Always Absolute
- **#9** — Structure: Top-Down, Linear
- **#11** — Claude Project Instructions: Minimal & Pointing
- **#12** — Audit Section in Project Metadata
- **#13** — README.md for Human Navigation

See `guides/Claude.ai-best-practices.md` for all 15 practices.

---

## Changelog

### Version 1.0 — Initial Release
**Date:** 2026-05-29  
**Status:** Stable

Initial version of the project setup process guide. Documents the standard 7-step workflow for creating new Claude projects that conform to best practices.

---

## Keywords
project-setup, process, initialization, configuration, scaffolding, best-practices, workflow, new-project, checklist, claude-assisted
