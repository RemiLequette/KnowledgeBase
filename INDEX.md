# Knowledge Base Index

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
| sqlite.md | One statement per call, DELETE before INSERT, always verify after writes, update schema.sql after DDL | sqlite, MCP, SQL, database, schema, write, query |
| commwise-layout.md | `max-height` is the only reliable way to constrain flex children overridden by CommWise `!important` rules | CommWise, flex, layout, max-height, viewport, CSS, override |
| claude-chrome-mcp.md | Use Claude in Chrome MCP for live DOM diagnostics and JS fix validation — eliminates layout guesswork | Chrome, MCP, browser, DOM, debug, javascript, inspect, layout |
