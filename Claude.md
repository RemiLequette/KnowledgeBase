# Claude Knowledge Base

## About This Project
This is the **knowledge base itself** — a centralized repository of conventions, workflows, and guides for managing Claude projects systematically.

**Read context:**
- C:\Users\RemiLequette\Development\projects\claude-knowledge\PROJECT.md

**For Claude Sessions:**
Follow:
- C:\Users\RemiLequette\Development\projects\claude-knowledge\workflows\session-startup.md

---

## What This Project Contains

- **conventions/** — Technical and tooling standards
- **workflows/** — Recurring processes (startup, audits, etc.)
- **guides/** — Setup and best practices documentation

---

## Conventions This Project Defines

**Standard conventions:**
- `conventions/filesystem.md` — MCP filesystem tool usage
- `conventions/sqlite.md` — SQLite operations and patterns
- `conventions/claude-chrome-mcp.md` — Browser automation with Claude in Chrome
- `conventions/claude-structured-reasoning.md` — Reasoning techniques and thinking strategies
- `conventions/commwise-layout.md` — CSS layout patterns for CommWise projects

**Workflows:**
- `workflows/session-startup.md` — Canonical startup procedure (read INDEX.md → load conventions)

**Guides:**
- `guides/project-setup.md` — How to create and configure new Claude projects
- `guides/Claude.ai-best-practices.md` — 11 design principles for Claude project structure
- `guides/audit-process.md` — How to audit projects for best practices compliance

---

## Maintenance Rules for This KB

When modifying any guide file in `guides/`, follow the standards in:

**→ `guides/guide-maintenance.md`**

This file specifies how to update the Table of Contents and Changelog for every guide modification.

---

## Quick Start: Use in Your Project

**Step 1:** In Claude Desktop, set instructions to:
```
Your project folder is: C:\Users\RemiLequette\Development\projects\[YOUR_PROJECT]

Read Claude.md at the root of your project folder first.
```

**Step 2:** Create `Claude.md` in your project with:
```markdown
Read and follow:
C:\Users\RemiLequette\Development\projects\claude-knowledge\workflows\session-startup.md
```

The knowledge base loads automatically from there.

**That's it.** No other setup needed.
