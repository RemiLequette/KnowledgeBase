# Forge — Roadmap

Sequenced development plan for Forge v2.
Objective: switch all KB file access to Forge as fast as possible, starting with the most-used formats.

*Document type: Guide*

## Keywords
forge, roadmap, milestones, plan, development, handlers, formats

## Milestones

### Milestone 1 — Format registry
*Goal: forge-formats.json v1 loads and dispatches correctly.*
*Status: Done*

- 1.1 `forge-formats.json` v1 — `extensions` block (SyntaxAdapter per extension) + `formats` (primitives, reusable types, file formats)
- 1.2 `format-registry.js` v2 — primitives skipped, reusable types stored but not registered, `fileNameExtension` required, `extends`+`handler` build error, extension-declared build error, SyntaxAdapter injected into `initFormat`
- 1.3 Unit tests — all load() and dispatch() behaviours covered

*Ref TODO: W5*

---

### Milestone 2 — MCP tools layer
*Goal: a generic, configurable MCP server loads tools from `forge-tools.json` and dispatches calls to tool handlers. Native format active. MVP-1 reached on completion.*
*Status: Done*

**Architecture — three config files, three responsibilities:**
- `forge.config.json` — root registry (where artifacts live)
- `forge-formats.json` — format registry (how artifacts are structured)
- `forge-tools.json` — MCP tool registry (which tools are exposed, via which handler)

**Generic MCP server** — reads `forge-tools.json` at startup, registers tools, dispatches calls to tool handler modules loaded dynamically via ESM `import()`. No hardcoded tool names. Designed for future extraction as a standalone reusable lib independent of Forge.

**Tool handlers** — one module per tool (or group). Receive the call payload, use `RootRegistry` + `FormatRegistry` to act, return the result.

**Architecture note:** all three layers (MCP server, tool handlers, format handlers) load dynamically. Adding a tool or format requires only a config entry + Forge restart (seconds) — no Claude session restart.

**Test strategy:**
- Unit — each tool handler tested in isolation with mock registries
- Integration — tool handler → registry → format handler chain on real files in `tests/fixtures/sandbox/`
- End-to-end — MCP server started, tool calls made via MCP protocol, responses validated

- 2.1 `forge-tools.json` v1 — declares all 9 tools with name, description, input schema, handler path
- 2.2 `mcp-server.js` — generic MCP server: reads `forge-tools.json`, loads tool handlers dynamically, dispatches calls
- 2.3 Navigation tool handlers — `forge_ls`, `forge_mkdir`, `forge_rmdir`, `forge_move`, `forge_rename`
- 2.4 Content tool handlers — `forge_read`, `forge_write`, `forge_create`, `forge_delete` (native fallback active)
- 2.5 `forge.js` — entry point: loads all three configs, wires registries, starts `mcp-server.js`
- 2.6 `forge_read` multi-file — read multiple paths in one call
- 2.7 `forge_ls` recursive with sizes — `depth=N`, size per entry
- 2.8 `forge_read` batch query — multiple dot-notation queries in one call

*Ref TODO: O49, O53, O48*

---

### Milestone 3 — Handlers (priority order: most-used first)
*Goal: all KB file types readable and writable via Forge.*

- 3.1 `md` — SyntaxAdapter + sequence, native fallback for plain Markdown
- 3.2 `doc` — extends md, Why/What/How structure
- 3.3 `todo-list` — extends doc, priority sections, item repeat
- 3.4 `changelog` / `log-item` — reusable types, lazy entries, dot-notation access
- 3.5 `js-clean` — structured JS files, shebang claim, function blocks

*Ref TODO: O24, O25*

---

### — MVP-1 — Native format for .md and .js
*Goal: forge_read / forge_write work on any .md or .js file via native format. No structured handler required. KB file access can switch to Forge.*
*Status: Done*

- Milestone 1 complete — format registry loads v2 grammar, handlers injected dynamically
- Milestone 2 complete — MCP tools layer, native fallback active
- No sequence handler, no MdSyntaxAdapter, no extends resolution needed
- Adding handlers later requires only `forge-formats.json` update + Forge restart — no Claude restart

---

### — MVP-2 — Structured formats: changelog, todo, js-clean
*Goal: token savings on the most-used KB file types. Lazy sections, dot-notation queries, write narrow.*

- Milestone 3 complete (handlers: doc, todo-list, changelog/log-item, js-clean)
- extends resolution (Sprint extends) complete
- MdSyntaxAdapter complete

---

### Post-MVP — Documentation & tooling

- `working-with-forge.md` v2 — rewrite for Forge v2 (formats, JSON payload, dot-notation, registry)
- Registry viewer — HTML tool, reads `forge://registry` via `forge_ls`
- Forge editor — rename `forge-browser.html` → `forge-editor.html`, add `forge_create`
- Extract `mcp-server.js` as a standalone reusable lib — independent of Forge, configurable via any `*-tools.json`

*Ref TODO: O52, O41, O45, O46*

---

### Future — Ideas

- `forge_read` subtree — `forge_read(path, query, depth=∞)`, returns a section and all its children recursively
- Separate `public/` to its own repository

*Ref TODO: O48 (part 2), O42*

---

## Changelog

### Version 1.4 - M2 done — MVP-1 reached
**Date:** 2026-06-12
**Reason:** All M2 steps delivered: forge-tools.json (2.1), mcp-server.js generic server (2.2), navigation tool handlers (2.3), content tool handlers (2.4), forge.js entry point updated (2.5). Native format active. MVP-1 reached.

**Changes:**
- Milestone 2: status WIP → Done
- MVP-1: status added — Done

---

### Version 1.3 - Milestone 2 — generic MCP server architecture
**Date:** 2026-06-12
**Reason:** Session design decision — MCP server becomes generic and configurable via `forge-tools.json`. Three-config architecture (roots / formats / tools). Designed for future extraction as standalone lib.

**Changes:**
- Milestone 2: goal, architecture, test strategy, and steps fully rewritten
- Post-MVP: extraction of `mcp-server.js` as standalone lib added

---

### Version 1.2 - Milestone 1 done + Milestone 2 enriched
**Date:** 2026-06-12
**Reason:** Milestone 1 livré en session. Milestone 2 enrichi avec la stratégie de test (unit/integration/e2e) et la note architecture sur le chargement dynamique des handlers. MVP-1 précisé en conséquence.

**Changes:**
- Milestone 1: status WIP → Done; détails mis à jour
- Milestone 2: architecture note ajoutée (chargement dynamique ESM); test strategy ajoutée (unit/integration/e2e); 2.3 précisé (native fallback active)
- MVP-1: bullet list mise à jour — chargement dynamique + pas de restart Claude

---

### Version 1.1 - MVP-1 and MVP-2 defined
**Date:** 2026-06-12
**Reason:** Session decision — MVP-1 targets native format for .md and .js (no handler needed, unblocks KB file access switch). MVP-2 targets structured formats for token savings (changelog, todo, js-clean).

**Changes:**
- Milestones: `### — MVP —` replaced by `### — MVP-1 —` and `### — MVP-2 —` with goals and scope

---

### Version 1.0 - Creation
**Date:** 2026-06-12
**Reason:** TODO backlog was scattering the Forge development plan across unordered items. Roadmap created to sequence milestones, separate MVP from post-MVP, and capture future ideas.
