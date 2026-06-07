### Version 1.3 - Critical priority level
**Date:** 2026-06-07
**Reason:** The `TODO.md` convention already includes a `## Critical` section, but the tool ignored it — critical items fell through to the default priority. Added full support so the tool is consistent with the format.

**Changes:**
- What / Item model: `priority` updated — `critical` added as first value
- How / Markdown parsing: `## Critical` added to recognized section headers
- How / Markdown serialization: `## Critical` added as first open section (before `## High priority`)
- How / Board layout: swimlanes updated — Critical / High / Normal / Low
- How / Card design: Critical card style documented — red-tinted background + bright red border

---

### Version 1.2 - How to install in a project
**Date:** 2026-06-05
**Reason:** The guide covered architecture and features in detail but gave no step-by-step installation instructions for a new project. Added a dedicated section written for an AI Assistant, with explicit file paths, exact variable names to edit in the bootstrap, and ordered steps.

**Changes:**
- Added `## How to install in a project` between `## How` and `## Index`
- Section structured as 4 ordered steps: register allowed root, create TODO.md, copy and configure bootstrap, bookmark app URL
- Bootstrap copy source (`<kb>/todo-bootstrap.html`) and the two variables to edit (`TODO_PATH`, `TOOL_ABS`) named explicitly
- `todo-tool.html` location in KB clarified — shared, never copied
- Table of Contents updated (entry 4 added, Index renumbered to 5)

---

### Version 1.1 - Full WWH with feature-level decomposition
**Date:** 2026-06-04
**Reason:** Initial guide was too high-level. Expanded to cover every feature with its own Why/What/How so the tool can be regenerated from scratch from this document alone.

**Changes:**
- Why: added per-feature rationale sections (kanban layout, card indexes, transaction model, trash zone, explicit archiving, persistent splitter, diff tooltip)
- What: full item model, card index algorithm, complete operation list, persistence model, transaction model, dirty tracking
- How: full technical reference — architecture, file access, parsing, serialization, board layout, card design, effort icons, drag-and-drop (inter-lane + intra-lane positional), popover, diff tooltip, archive view, add form, configuration, state management summary

---

### Version 1.0 - Creation
**Date:** 2026-06-04
**Reason:** Guide for the HTML todo list tool — rationale, model, and architecture.

**Content:**
- Why: token efficiency, reliability, access friction, transaction model rationale
- What: item model, operations, source of truth, concurrency assumption, transaction model
- How: bootstrap architecture, file access via local server, configuration, save behavior, availability indicator