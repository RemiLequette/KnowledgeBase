# Guide Maintenance Standards

## Quick Start

Standards de maintenance pour tous les guides de la knowledge base.
Charger quand on modifie un guide (audit-process.md, best-practices.md, project-setup-process.md).
Deux règles obligatoires : mettre à jour la TOC et ajouter une entrée au Changelog.

Maintenance rules for all guides in the knowledge base.

---

## When to Apply These Rules

**Whenever you modify any guide file:**
- `guides/project-setup-process.md`
- `guides/best-practices.md`
- `guides/audit-process.md`

These rules ensure consistency, traceability, and navigability across all guides.

---

## Rule 1: Update the Table of Contents

If you **added, removed, or renamed** any section in the guide:

**Update the TOC at the beginning** to reflect the current structure.

**Why:** The TOC is the reader's navigation tool. If it's out of sync with the document, the guide becomes unreliable.

---

## Rule 2: Update the Changelog

**Always add a new entry** when modifying a guide.

**What to include:**
- **Version number** (increment from previous: 1.0 → 1.1 → 2.0)
- **Date** (YYYY-MM-DD)
- **What changed** (specific sections modified, added, or removed)
- **Why** (rationale for the change)

**Format:**
```markdown
## Changelog

### Version X.Y — [Brief Title]
**Date:** YYYY-MM-DD  
**Rationale:** [Why this change was made]

**Changes:**
- [Specific change 1]
- [Specific change 2]
- ...
```

**Example:**
```markdown
### Version 2.0 — Batching & Checkpoints
**Date:** 2026-05-29  
**Rationale:** Improve UX and clarity during deviation review. Reduce message volume.

**Changes:**
- Added Checkpoint after Step 4
- Restructured Step 5-6 for batch processing
- Updated Output Format section
```

---

## Rule 3: Update the Decision Layer

Whenever you **add or significantly change** a convention, guide, or tool:

**Add or update the corresponding trigger** in the Decision Layer table of `public/INDEX.md`.

**Why:** The Decision Layer is the entry point for every AI-assisted session. A convention that has no trigger is invisible — it will not be loaded even when relevant.

**What to check:**
- Does a trigger exist for the new file?
- Does the trigger wording match the situations where the file should be loaded?
- Is the trigger specific enough to avoid loading the file unnecessarily?

---

## Why Both Rules Matter

| Element | Purpose |
|---------|---------|
| **TOC** | Shows current document structure (navigation & discoverability) |
| **Changelog** | Shows historical record of modifications (traceability & intent) |

**Both must stay in sync** for the knowledge base to be trustworthy.

If a guide has outdated TOC but up-to-date Changelog (or vice versa), readers lose confidence.

---

## Who Needs This

**You** (every Claude session modifying guides)  
**Future Audits** of other projects (they'll read audit-process.md + best-practices.md)  
**Maintainers** (anyone keeping this KB up-to-date)

---

## Referenced By

- `Claude.md` — Maintenance rules for this KB
- `best-practices.md` → Best Practice #12 (Audit Section in Project Metadata)

---

## Keywords
maintenance, guides, documentation, changelog, TOC, discoverability, traceability, standards, consistency

---

## Index

| Terme | Occurrences |
|-------|-------------|

---

## Changelog

### Version 1.0 - Creation
**Date:** 2026-05-30
**Raison:** Standards de maintenance pour tous les guides de la knowledge base.

**Contenu initial :**
- Rule 1 : mettre a jour la TOC
- Rule 2 : mettre a jour le Changelog
