# Glossary — claude-knowledge

## Quick Start

Glossary of key terms for the claude-knowledge project.
Organized by domain. Read each domain description to assess relevance before loading its terms.
Does not cover project-specific business rules — only the knowledge base's own vocabulary.

## Keywords
glossary, knowledge-base, convention, workflow, guide, session, audit, markdown, domain, best-practice, brand, RTFM, TDD, fail-fast

## Table of Contents

1. [Knowledge Base](#knowledge-base)
2. [Session](#session)
3. [Documentation](#documentation)
4. [Audit](#audit)
5. [Editorial Principles](#editorial-principles)
6. [Design Principles](#design-principles)

---

## Knowledge Base
[up](#table-of-contents)

Terms related to the structure and organization of the knowledge base itself: files,
folders, entry points, navigation. Relevant for any task involving adding or reorganizing
content within the project.

### Convention
**Definition:** Markdown file in `conventions/` describing a technical rule or expected
tool behavior. Conventions are universal — they apply to all projects that load this
knowledge base.  
**See also:** Guide, Workflow, Best Practice

### Best Practice
**Definition:** Design principle defined in `guides/best-practices.md` governing
how Claude projects should be structured and maintained. Best practices are universal across
all projects. Each best practice may have an associated convention that implements it
concretely.  
**See also:** Convention, Guide, Audit

### Guide
**Definition:** Markdown file in `guides/` describing a process or procedure (setup,
audit, maintenance). A guide is action-oriented, not rule-oriented.  
**See also:** Convention, Workflow

### Spec
**Definition:** Purely descriptive document — describes architecture, internals, or design
without prescribing auditable behavior. A spec has nothing to audit. Specs are never listed
in the Decision Layer — they are loaded explicitly when needed.  
**See also:** Convention, Litmus Test

### Workflow
**Definition:** Recurring sequence of steps to execute in a specific order,
documented as a Markdown file. Currently not used — the session bootstrap is handled
directly by `INDEX.md`.  
**See also:** Convention, Guide

### INDEX.md
**Definition:** Entry point of the knowledge base. Lists all conventions, workflows,
and guides with their keywords. Always read first at session startup.

### CLAUDE.md
**Definition:** File placed at the root of a Claude project. Contains project-specific
setup instructions, read with top priority at session start.

### PROJECT.md
**Definition:** Project metadata file. Describes purpose, structure, project decisions,
and references GLOSSARY.md and the audit procedure.

### GLOSSARY.md
**Definition:** File placed at the root of each project. Defines the project's business
and technical terms, organized by domain.

---

## Session
[up](#table-of-contents)

Terms related to the lifecycle of a working session between an AI Assistant and the user.
Relevant for understanding context loading, session continuity, and knowledge persistence.

### GTD (Get Things Done)
**Definition:** Practical framework for running effective AI-assisted working sessions —
three phases (scoping, execution, closure), session model (one chat = one objective), and
anti-patterns to avoid. See `guides/how-to-get-things-done.md` for the full guide.  
**See also:** Scope Drift, WIP

### Scope Drift
**Definition:** Anti-pattern where a session gradually shifts from its stated objective
to a different topic, one step at a time. No single step feels wrong — the drift is
cumulative. The session may produce real value but misses its original goal.
See GTD → Anti-patterns.  
**See also:** GTD

### Session Startup
**Definition:** Sequence executed at the start of every Claude session. The Claude
project instructions load `INDEX.md` directly (bootstrap + decision layer), then
`PROJECT.md` for project-specific setup.  
**See also:** [Knowledge Base — INDEX.md](#indexmd)

### Context Window
**Definition:** Token limit available within a Claude session. Selective loading of
conventions is designed to preserve this resource.

### Selective Loading
**Definition:** Strategy of loading only the conventions relevant to the current task,
identified via keywords in INDEX.md.

### WIP
**Definition:** Set of all `[WIP]` items in `TODO.md`. Represents what is currently in
progress across sessions. The bridge between sessions — a session closes by reviewing WIP,
the next session opens by reading it. See `conventions/todo-list.md`.  
**See also:** GTD, todo-list.md

---

## Documentation
[up](#table-of-contents)

Terms related to the format and writing rules for Markdown files in the project.
Relevant for any task involving creating or modifying files in the knowledge base.

### Quick Start
**Definition:** Mandatory section at the top of every Markdown file. Contains 3 to 6
lines describing what the file covers, when to load it, and what it does not cover.

### Keywords
**Definition:** Mandatory section in every Markdown file. List of terms allowing an
AI Assistant to quickly assess the relevance of a file for a given task.

### Index (section)
**Definition:** `## Index` section present in every Markdown file. Table listing
important terms with pointers to their occurrences within that specific file.
Complementary to GLOSSARY.md which has project-wide scope.

### Changelog
**Definition:** Mandatory `## Changelog` section in every Markdown file. Tracks
modifications: version, date, reason, and content changed.

### TOC (Table of Contents)
**Definition:** `## Table of Contents` section required in any Markdown file with more
than 2 content sections. Lists `##`-level sections with anchor links. Each content
section carries a return link to the TOC.

---

## Audit
[up](#table-of-contents)

Terms related to the process of verifying project conformance to best practices.
Relevant only during a dedicated audit session or documentation review.

### Audit
**Definition:** Dedicated session to verify a project's conformance to best practices
defined in `guides/best-practices.md`. Produces structured findings and
correction proposals submitted for approval.  
**See also:** [Knowledge Base — Best Practice](#best-practice), Conformance, Deviation

### Deviation
**Definition:** Gap between the current state of a file or project and the best
practices. Can be minor (format) or major (missing structure). Accepted deviations
must be documented in `DEVIATIONS.md`.

### Conformance
**Definition:** State of a project where every file respects the conventions and best
practices defined in the knowledge base.

---

## Editorial Principles
[up](#table-of-contents)

Named principles governing how KB documents are written and structured. Relevant when
creating or reviewing documentation, triggers, or any content directed at AI Assistants.

### Streisand Effect
**Definition:** Phenomenon where explicitly warning against something draws more attention
to it than silence would. Applied to KB documentation: never signal to an AI Assistant
what it should not load — the absence of a trigger is sufficient. Named after Barbara
Streisand whose lawsuit to suppress a photo of her home caused millions of views.  
**See also:** Decision Layer

### RTFM (Read The Friendly Manual)
**Definition:** Principle enforced by Forge requiring an AI Assistant to call
`forge_describe` before any read or write operation. Ensures the AI understands the type
and capabilities of an artifact before interacting with it. The acronym is a playful
reframing of the classic "Read The F***ing Manual." An application of Fail Fast, Fail Clear
and Constrain, Don't Forbid.  
**See also:** Forge, FAL, Brand, Fail Fast Fail Clear, Constrain Don't Forbid

### WWH (Why-What-How)
**Definition:** Content hierarchy mandatory for every document in the KB. Every document
must answer three questions in order: *Why* does this exist (context, motivation), *What*
it covers (scope, content), *How* to use it (actionable instructions). Prevents documents
that describe without guiding, or guide without justifying.  
**See also:** documentation-style.md, Quick Start

### Litmus Test
**Definition:** A simple binary question used to classify a document without ambiguity.
In the KB, two litmus tests are used: (1) *Convention or Guide?* — "what would you need
to audit it?" — if an artifact, it's a convention; if a log, it's a guide.
(2) *Convention or Spec?* — "does it have anything to audit?" — if yes, it's a convention;
if no (purely descriptive), it's a spec. Specs are never listed in the Decision Layer —
they are loaded explicitly when needed.  
**See also:** Convention, Guide, Spec, Decision Layer

---

## Design Principles
[up](#table-of-contents)

Named engineering and design principles applied in the KB and Forge. Relevant when
designing new features, constraints, or error handling.

### TDD (Test Driven Development)
**Definition:** Practice of writing the spec or test before writing the code. In the KB
context: document the principle in `forge.md` before implementing it in `forge.js`. The
spec is the contract; the implementation fulfills it.  
**See also:** forge.md

### Brand
**Definition:** Principle enforcing that only FALs issued by Forge are valid. Forge
maintains a registry of all FALs it has emitted — a FAL constructed manually is never in
the registry and is rejected with a hint: *"This FAL was not issued by Forge — call
forge_ls to obtain a valid FAL."* Named after the branding iron mark that certifies the
origin of livestock — only the owner can brand, and an unbranded animal is suspect. An
application of Constrain, Don't Forbid and Fail Fast, Fail Clear.  
**See also:** FAL, RTFM, Constrain Don't Forbid, Fail Fast Fail Clear

### Constrain, Don't Forbid
**Definition:** Design principle — when data integrity is at stake, prefer a mechanical
constraint that makes violation impossible over a documented rule that relies on compliance.
A rule can be ignored or misunderstood; a constraint cannot be bypassed. RTFM and Brand
are both applications of this principle in Forge.  
**See also:** Brand, RTFM, Fail Fast Fail Clear

### Fail Fast, Fail Clear
**Definition:** Design principle — when a constraint is violated, fail immediately and
return an error that contains its own correction. Not just "no" but "no, and here is what
to do next." RTFM and Brand are both applications: `"Call forge_describe(fal) first"` and
`"This FAL was not issued by Forge — call forge_ls to obtain a valid FAL."` The error is
the manual.  
**See also:** RTFM, Brand, Constrain Don't Forbid

---

## Index

| Term | Occurrences |
|------|-------------|

---

## Changelog

### Version 1.3 - Design Principles domain
**Date:** 2026-06-07
**Reason:** Four design principles emerged from Forge design sessions — TDD, Brand,
Constrain Don't Forbid, Fail Fast Fail Clear. Added new domain Design Principles.
RTFM entry updated with cross-references to new principles.

**Changes:**
- TOC: `Design Principles` added
- Keywords: brand, TDD, fail-fast added
- Editorial Principles: RTFM updated — See also enriched
- Design Principles: new domain with TDD, Brand, Constrain Don't Forbid, Fail Fast Fail Clear

---

### Version 1.2 - GTD, Scope Drift, WIP
**Date:** 2026-06-07
**Reason:** Three session concepts missing from the glossary — useful for human readers
and as cross-references. GTD points to the guide; Scope Drift points to GTD; WIP points
to todo-list convention.

**Changes:**
- Session: GTD, Scope Drift, WIP added
- Session: Session Startup — reference corrected (Claude.md → PROJECT.md)

---

### Version 1.1 - Editorial Principles domain
**Date:** 2026-06-07
**Reason:** Four named principles accumulated in the KB without a glossary entry —
Streisand Effect, RTFM, WWH, Litmus Test. Added new domain Editorial Principles.
Spec entry added to Knowledge Base domain.

**Changes:**
- TOC: `Editorial Principles` added
- Knowledge Base: `Spec` entry added
- Editorial Principles: new domain with Streisand Effect, RTFM, WWH, Litmus Test

---

### Version 1.0 - Initial creation
**Date:** 2026-05-30
**Reason:** Initial glossary for the claude-knowledge project.

**Content:**
- Domain Knowledge Base: Convention, Best Practice, Guide, Workflow, INDEX.md, CLAUDE.md, PROJECT.md, GLOSSARY.md
- Domain Session: Session Startup, Context Window, Selective Loading
- Domain Documentation: Quick Start, Keywords, Index (section), Changelog, TOC
- Domain Audit: Audit, Deviation, Conformance
