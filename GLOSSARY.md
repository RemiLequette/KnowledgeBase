# Glossary — claude-knowledge

## Quick Start

Glossary of key terms for the claude-knowledge project.
Organized by domain. Read each domain description to assess relevance before loading its terms.
Does not cover project-specific business rules — only the knowledge base's own vocabulary.

## Keywords
glossary, knowledge-base, convention, workflow, guide, session, audit, markdown, domain, best-practice

## Table of Contents

1. [Knowledge Base](#knowledge-base)
2. [Session](#session)
3. [Documentation](#documentation)
4. [Audit](#audit)

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

### Session Startup
**Definition:** Sequence executed at the start of every Claude session. The Claude
project instructions load `INDEX.md` directly (bootstrap + decision layer), then
`Claude.md` for project-specific setup.  
**See also:** [Knowledge Base — INDEX.md](#indexmd)

### Context Window
**Definition:** Token limit available within a Claude session. Selective loading of
conventions is designed to preserve this resource.

### Selective Loading
**Definition:** Strategy of loading only the conventions relevant to the current task,
identified via keywords in INDEX.md.

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

## Index

| Term | Occurrences |
|------|-------------|

---

## Changelog

### Version 1.0 - Initial creation
**Date:** 2026-05-30
**Reason:** Initial glossary for the claude-knowledge project.

**Content:**
- Domain Knowledge Base: Convention, Best Practice, Guide, Workflow, INDEX.md, CLAUDE.md, PROJECT.md, GLOSSARY.md
- Domain Session: Session Startup, Context Window, Selective Loading
- Domain Documentation: Quick Start, Keywords, Index (section), Changelog, TOC
- Domain Audit: Audit, Deviation, Conformance
