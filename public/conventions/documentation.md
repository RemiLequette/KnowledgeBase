# Documentation Convention

Rules for all Markdown documents across all projects.

## Quick Start

Universal convention for all Markdown files (referred to as "documents" in the rest of this convention) — structure, headings, navigation, traceability.
Load when creating or modifying a document, or when auditing documentation conformance.
Does not cover the business content of documents — only their form and organization.
See [Tooling](#tooling) for why these rules are strict. See [Citations](#citations) for inter-document reference format.

## Keywords
documentation, markdown, headings, anchors, TOC, index, keywords, changelog, quick-start, convention, navigation, VS-Code, tooling, citations

## Table of Contents

1. [Document Structure](#document-structure)
2. [Section Structure](#section-structure)
3. [Language](#language)
4. [Numbering](#numbering)
5. [Quick Start Rule](#quick-start-rule)
6. [Keywords Rule](#keywords-rule)
7. [TOC Rule](#toc-rule)
8. [Index Rule](#index-rule)
9. [Changelog Rule](#changelog-rule)
10. [Citations](#citations)
11. [Tooling](#tooling)

---

## Document Structure
[up](#table-of-contents)

Canonical structure of any document. Elements must appear in this exact order.

```
# Title

Short description (1-2 lines, plain text, no markup)

*Language: ...*            <- optional, see Language

## Quick Start             <- mandatory, see Quick Start Rule
## Keywords                <- mandatory, see Keywords Rule
## Table of Contents       <- mandatory if more than 2 content sections, see TOC Rule

## Section 1               <- content sections
## Section 2
...

## Index                   <- mandatory, in TOC, see Index Rule
## Changelog               <- mandatory, NOT in TOC, see Changelog Rule
```

| Element | Status | Rule |
|---------|--------|------|
| `# Title` | Mandatory | Unique, plain text |
| Short description | Mandatory | 1-2 lines under title, no markup |
| Language declaration | Optional | Required only when not English — see [Language](#language) |
| `## Quick Start` | Mandatory | See [Quick Start Rule](#quick-start-rule) |
| `## Keywords` | Mandatory | See [Keywords Rule](#keywords-rule) |
| `## Table of Contents` | Conditional | Required if more than 2 content sections — see [TOC Rule](#toc-rule) |
| Content sections | At least 1 | See [Section Structure](#section-structure) |
| `## Index` | Mandatory | Included in TOC — see [Index Rule](#index-rule) |
| `## Changelog` | Mandatory | Excluded from TOC — see [Changelog Rule](#changelog-rule) |

**Standard section names are fixed in English regardless of document language** — see [Language](#language).

**Excluded from TOC count:** `## Quick Start`, `## Keywords`, `## Table of Contents`, `## Changelog`.

---

## Section Structure
[up](#table-of-contents)

### Headings

Headings are the basis for navigation anchors. Any non-standard character breaks anchors.

**Rule:** Headings (`#`, `##`, `###`) must consist only of:
- Alphanumeric characters
- Accented characters (`é`, `è`, `à`, `û`, etc.)
- Spaces
- Hyphens `-`

**Forbidden in headings:**
- Emojis
- Special punctuation (`.`, `:`, `!`, `?`, `—`, `'`, etc.)
- Symbols (`↑`, `⏸`, `✅`, etc.)
- Encoded characters (`%XX`)

**Uniqueness:** Each `##` heading must be unique within the document — duplicates break anchors.

#### Examples

| Incorrect | Correct |
|-----------|---------|
| `## 1. Overview ⏸️` | `## 1 - Overview` |
| `## Step 1: Load context` | `## Step 1 - Load context` |
| `## ✅ Results` | `## Results` |
| `## Layout — HTML↔scripts contract` | `## Layout - HTML and scripts contract` |

---

### Length and Splitting

A `##` section must cover a single topic, readable in one sitting.

If a section requires several distinct sub-topics, split it into separate sections. A section that is too long usually covers multiple subjects.

This rule also applies to readability for an AI Assistant: an overly large section increases loading cost without improving relevance.

---

### Subsections

Use `###` to structure internal content of a section without bloating the TOC — subsections do not appear in it.

If a `###` becomes an autonomous citation or navigation target, promote it to `##`.

---

## Language
[up](#table-of-contents)

The default language of all documents is **English**.

### Standard section names

The following section names are **fixed in English regardless of the document language**. Tools rely on these exact names to parse and process documents.

| Section | Fixed name |
|---------|------------|
| Quick Start | `## Quick Start` |
| Keywords | `## Keywords` |
| Table of Contents | `## Table of Contents` |
| Index | `## Index` |
| Changelog | `## Changelog` |

Content inside these sections may be written in any language. The section name itself must never be translated.

### Language exceptions

**Tooling-imposed names:** When external tools or systems impose predefined names in another language (section titles, field names, configuration keys), those names may be kept as-is. Declare the exception under the document title:

```markdown
# Document Title

*Language: English. Exception: [section name] uses French — imposed by [tool/system name].*
```

**Document in another language:** If a document is intentionally written in another language, declare it under the title with a short justification:

```markdown
# Document Title

*Language: French — this document targets a French-speaking team.*
```

---

## Numbering
[up](#table-of-contents)

### Usage

Numbers assigned to items (BP#1, Rule 3, etc.) serve two purposes:
- **Internal navigation** — orientation within a long document
- **Discussion** — quick reference during a conversation with a human

They are contextual tools, not stable identifiers.

### Rule

Never cite a numbered item from another document. To reference an external idea, cite the document or a section by its title.

**Correct ✅**
```
See guides/best-practices.md
See guides/best-practices.md — Instruction Minimalism
```

**Incorrect ❌**
```
Implements BP#1, BP#2, BP#8
See Rule 3
```

### No mandatory registry

Since numbers are not inter-document identifiers, no registry is required.

---

## Quick Start Rule
[up](#table-of-contents)

### Rule

Every document must begin with a `## Quick Start` describing it in 3 to 6 lines.

### Writing guidance

The Quick Start is the primary entry point for both humans and tools. It must be descriptive enough to allow relevance assessment without loading the full document.

- A search engine or AI tool uses it to decide whether to load this document at all
- A human uses it to decide whether to read further
- Keep it factual and specific — vague Quick Starts force full document loads

### Purpose

The Quick Start is an **orientation summary** — it answers the question "does this document concern me?"

Two types of readers have different needs:

**Human** — wants to quickly understand the theme and scope before deciding to read in detail. They scan, they do not read linearly.

**AI Assistant** — must decide at session start whether this document is relevant to the current task and worth loading into context. Each document loaded has a double cost: in **tokens** (limited context window) and in **relevance** (a context cluttered with irrelevant documents degrades response quality).

**Note:** When referring to an AI assistant in a document, do not use a specific name (Claude, Gemini, etc.) — use "AI Assistant".

The Quick Start must therefore answer:
- **Theme** — what this document is about
- **Scope** — what it covers and what it does not cover
- **Conditions** — in what situations it is useful to read or load it

Combined with `## Keywords`, it allows a human or an AI to decide in seconds whether the document is relevant.

### What the Quick Start is not

- Not an exhaustive summary of the content
- Not a list of sections (that is the role of the TOC)
- Not a step-by-step action guide
- Not a numbered enumeration of content ("X techniques", "Y principles") — these numbers diverge from actual content and provide no useful information to the reader

### Placement

Immediately after the `#` title and short description, before `## Keywords`.

### Format

```markdown
## Quick Start

[Theme: what this document is about]
[Scope: what it covers / does not cover]
[Conditions: when to load or read it]
```

---

## Keywords Rule
[up](#table-of-contents)

### Rule

Every document must have a `## Keywords` section placed after Quick Start, before the TOC.

### Format

```markdown
## Keywords
keyword-1, keyword-2, keyword-3
```

### Criteria

- Terms of 1 to 3 words, comma-separated
- Cover the subject, tools, and usage contexts
- Allow the document to be found by search in the KB

---

## TOC Rule
[up](#table-of-contents)

### Rule

Any document with more than 2 content `##` sections must have a TOC.

- The threshold is evaluated on content sections only — `## Quick Start`, `## Keywords`, `## Table of Contents`, and `## Changelog` are excluded from the count
- `## Index` is included in the count and must appear in the TOC
- Fixed title: `## Table of Contents`
- The TOC lists only top-level sections (`##`), not subsections (`###`)
- Placement: after `## Keywords`, before the first content `##`

### Anchor format

VS Code generates anchors according to these rules:
- All lowercase
- Spaces converted to hyphens `-`
- Accented characters preserved (`é`, `à`, `û`, etc.)
- Special characters removed (except hyphens)
- Apostrophes removed
- A hyphen surrounded by spaces (` - `) generates 3 hyphens in the anchor (`---`) — prefer titles without hyphens for cleaner anchors

| Heading | VS Code anchor |
|---------|---------------|
| `## Table of Contents` | `#table-of-contents` |
| `## Scripts` | `#scripts` |
| `## History Management` | `#history-management` |
| `## Step 1 - Loading` | `#step-1---loading` |
| `## 1. Overview` | `#1-overview` |
| `## 2. Layout - HTML and scripts` | `#2-layout---html-and-scripts` |

**Note:** GitHub uses different rules (accented characters are encoded as `%XX`). This convention targets VS Code only.

### When to use a TOC

A TOC is necessary when the document does not benefit from being read in one sitting — either because it is long, or because the reader needs to navigate to a specific section.

To be valid, a TOC must:
- Have the fixed title `## Table of Contents`
- List `##` sections with anchors matching the actual headings exactly
- Be accompanied by `[up]` return links under each section heading

### TOC format

```markdown
## Table of Contents

1. [Section title 1](#anchor-1)
2. [Section title 2](#anchor-2)
3. [Section title 3](#anchor-3)
```

### Return link

Each content `##` section carries a return link to the TOC, placed **on the line following the heading** (not in the heading — that would break the anchor).

```markdown
## My Section
[up](#table-of-contents)

Section content...
```

---

## Index Rule
[up](#table-of-contents)

### Rule

Every document must have a `## Index` section before `## Changelog`.

The index lists important terms with pointers to their occurrences in the text.

### Inline tags

Each occurrence to index is tagged with an HTML anchor:

```markdown
The notion of <a id="index-term-N">term</a> is important.
```

- ID format: `index-term-N` where `term` is the indexed word and `N` is the occurrence number
- The tag is invisible in Markdown preview
- The term text remains normally visible

### Index format

```markdown
## Index

| Term | Occurrences |
|------|-------------|
| term-1 | [1](#index-term-1), [2](#index-term-2) |
| term-2 | [1](#index-term2-1) |
```

### Full example

In the text:
```markdown
The <a id="index-convention-1">convention</a> for naming is strict.
...
This <a id="index-convention-2">convention</a> applies to all documents.
```

In the index:
```markdown
## Index

| Term | Occurrences |
|------|-------------|
| convention | [1](#index-convention-1), [2](#index-convention-2) |
```

---

## Changelog Rule
[up](#table-of-contents)

### Rule

Any document that evolves over time must have a `## Changelog` at the end, after `## Index`.

### Format

```markdown
## Changelog

### Version X.Y - Short title
**Date:** YYYY-MM-DD
**Reason:** Why this change.

**Changes:**
- Change 1
- Change 2
```

### Versioning

- `X.0` — major change (restructuring, important new rule)
- `X.Y` — minor addition or modification

---

## Citations
[up](#table-of-contents)

Inter-document citations must point to an identifiable, stable target. Numbers (`BP#1`, `Rule 3`) are not valid citation targets — they are contextual navigation tools, not stable identifiers.

### Citation forms

Use paths relative to the project root. Four forms, combinable:

```
see conventions/filesystem.md
see conventions/filesystem.md [section Optimal strategy by operation type]
see conventions/filesystem.md [keyword node]
see conventions/filesystem.md [index node-1]
```

| Form | Syntax | Target |
|------|--------|--------|
| Document | `see path/file.md` | The entire document |
| Section | `see path/file.md [section Section Title]` | A `##` heading |
| Keyword | `see path/file.md [keyword term]` | A term in `## Keywords` |
| Index | `see path/file.md [index term-N]` | A specific `## Index` anchor |

### Rule

Never cite by number. To reference an idea from another document, cite the document or section by its title.

**Correct ✅**
```
see guides/best-practices.md
see guides/best-practices.md [section Instruction Minimalism]
```

**Incorrect ❌**
```
Implements BP#1, BP#2
See Rule 3
```

---

## Tooling
[up](#table-of-contents)

The strict rules in this convention exist to support tooling built on top of the documentation structure. Three categories of tools depend on it:

**Viewers** — render documents as structured, navigable interfaces. They rely on section names, order, and heading format to build navigation trees, breadcrumbs, and section renderers. Any deviation breaks the rendering.

**AI Assistant tools (md-doc)** — allow AI Assistants to load or modify only the sections relevant to the current task, instead of loading the entire document. This reduces token consumption and improves precision. md-doc identifies sections by their exact name — which is why standard section names must never be translated or altered. See `conventions/md-doc-usage.md` for invocation and workflow.

**Automation** — mechanical tasks that should not consume AI tokens: rebuilding a TOC from actual headings, verifying conformance (missing sections, empty Keywords, duplicate headings), generating skeletons for new documents. These tools are more reliable and cheaper than asking an AI to do the same work.

All three depend on the same invariants: fixed section names, canonical order, unique headings, and standard anchor format.

---

## Index

| Term | Occurrences |
|------|-------------|
| anchor | [1](#index-anchor-1), [2](#index-anchor-2), [3](#index-anchor-3) |
| TOC | [1](#index-toc-1) |
| heading | [1](#index-heading-1) |

---

## Changelog

### Version 4.1 - md-doc-usage.md citation added
**Date:** 2026-05-31
**Reason:** Added reference to `conventions/md-doc-usage.md` in the Tooling section.

**Changes:**
- `## Tooling`: added `See conventions/md-doc-usage.md for invocation and workflow` to the md-doc paragraph

---

### Version 4.0 - Terminology, ordering, naming consistency
**Date:** 2026-05-31
**Reason:** "Markdown file" replaced by "document" throughout (except Quick Start definition). Sections reordered to match Document Structure order. TOC renamed to TOC Rule. Database Indexing removed; replaced by Tooling and Citations. File Structure renamed to Document Structure.

**Changes:**
- "Markdown file" -> "document" everywhere except Quick Start first line
- `## File Structure` renamed `## Document Structure`
- `## TOC` renamed `## TOC Rule`
- Sections reordered: Document Structure, Section Structure, Language, Numbering, Quick Start Rule, Keywords Rule, TOC Rule, Index Rule, Changelog Rule, Citations, Tooling
- Tooling moved to last position
- Citations moved just before Tooling
- TOC updated to match new order and names
- Keywords updated

---

### Version 3.4 - Tooling and Citations sections
**Date:** 2026-05-31
**Reason:** Database Indexing replaced by Tooling and Citations. Writing guidance added to Quick Start Rule.

**Changes:**
- Removed `## Database Indexing`
- Added `## Tooling`, `## Citations`
- Added `### Writing guidance` in Quick Start Rule

---

### Version 3.3 - Index included in TOC
**Date:** 2026-05-31

**Changes:**
- `## Index` removed from TOC exclusion list

---

### Version 3.2 - Standard section names
**Date:** 2026-05-31

**Changes:**
- `## Language`: added standard section names table

---

### Version 3.1 - File Structure section added
**Date:** 2026-05-31

**Changes:**
- Added `## File Structure` with canonical skeleton and status table

---

### Version 3.0 - Full translation to English
**Date:** 2026-05-31
**Reason:** Document was written in French, violating its own language convention.

**Changes:**
- Full content translated to English
- All section headings translated
- Language exception rule added

---

### Version 2.6 - Section structure
**Date:** 2026-05-30

**Changes:**
- Added `### Length and Splitting`, `### Subsections`

---

### Version 2.5 - Merge markdown-toc.md
**Date:** 2026-05-30

**Changes:**
- Anchor examples, GitHub vs VS Code note, judgment-based TOC rule

---

### Version 2.4 - Database indexing and typed citations
**Date:** 2026-05-30

**Changes:**
- Added `## Database Indexing` with citation format table

---

### Version 2.3 - Numbering reformulated
**Date:** 2026-05-30

**Changes:**
- Numbering redefined as contextual tool, registry removed

---

### Version 2.2 - Quick Start numbered enumerations forbidden
**Date:** 2026-05-30

**Changes:**
- No numbered enumeration of content in Quick Start

---

### Version 2.1 - Language rule and Quick Start reformulated
**Date:** 2026-05-30

**Changes:**
- Added `## Language`, reformulated `## Quick Start Rule`

---

### Version 2.0 - Index added and structure reorganized
**Date:** 2026-05-30

**Changes:**
- Added `## Index Rule`, new canonical structure

---

### Version 1.0 - Creation
**Date:** 2026-05-30
**Reason:** Centralize all documentation rules in a universal convention.
