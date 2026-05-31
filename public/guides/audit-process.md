# Project Audit Process

## Quick Start

Generic process for auditing a project's conformance to its best practices.
Use on explicit request only — not automatic, not part of session startup.
Covers: loading criteria, identifying auditable elements, audit table, deviation batches, final report.

If you only need the essentials:

1. Load the project's best practices guide (source of truth)
2. Create an audit table: compare each element against the practices
3. For each issue found: choose one → fix now / add to TODO / document as intentional deviation / propose best practice update

---

## Table of Contents

- [When to Run](#when-to-run)
- [Rules of Engagement](#rules-of-engagement)
  - [Rule 1: Session Dedication](#rule-1-session-dedication)
  - [Rule 2: Corrections During Audit](#rule-2-corrections-during-audit)
  - [Rule 3: Review Deviations](#rule-3-review-deviations)
  - [Rule 4: Improvements to Guides](#rule-4-improvements-to-guides)
  - [Rule 5: Re-audit Separation](#rule-5-re-audit-separation)
- [Steps](#steps)
  - [Step 1: Load Conformance Criteria](#step-1-load-conformance-criteria)
  - [Step 2: Identify Auditable Elements](#step-2-identify-auditable-elements)
  - [Step 3: Verify Each Element Against Best Practices](#step-3-verify-each-element-against-best-practices)
  - [Step 4: Present Findings](#step-4-present-findings)
  - [Checkpoint: Proceed to Deviations?](#checkpoint-proceed-to-deviations)
  - [Step 5: Group Deviations into Coherent Batches](#step-5-group-deviations-into-coherent-batches)
  - [Step 6: Review and Apply Deviations by Batch](#step-6-review-and-apply-deviations-by-batch)
  - [Step 7: Prepare Session Summary](#step-7-prepare-session-summary)
  - [Step 8: Recommend Re-audit](#step-8-recommend-re-audit-if-needed)
- [Output Format](#output-format)
- [Batching & Checkpoints](#batching--checkpoints)
- [Index](#index)
- [Changelog](#changelog)
- [Keywords](#keywords)

---

## When to Run

**On explicit request only.** Not automatic, not part of session startup.

User says:
> "Audit this project. Use: `[KB-PUBLIC]/guides/audit-process.md`"

---

## Rules of Engagement

### Rule 1: Session Dedication

An audit session is **dedicated to auditing**.

If diverging into other work (scope creep), remind user:
> "This is an audit session. Should we stay focused on the audit, or save this for another time?"

---

### Rule 2: Corrections During Audit

Corrections **CAN** be applied during the audit session.

**Use judgment:**
- Small, obvious fixes → apply immediately ✅
- Complex changes → add to project's TODO list ⏳
- Uncertain → propose, don't apply

Ask user: **"Apply this now or add to TODO?"**

---

### Rule 3: Review Deviations

When a deviation from best practices is found, discuss with user and make your best proposal.

#### 3a: Already Documented?

Is this deviation already documented in `DEVIATIONS.md` or project notes?

- **YES** → Report briefly in audit findings, move on
- **NO** → Continue to 3b

#### 3b: Make Your Best Proposal

Choose the best path forward:

##### Is it a simple fix? (typo, file name, trivial issue)

**Action:** Fix immediately ✅

Apply the fix, document in audit report.

##### Is it a complex change? (requires thought, implementation time)

**Action:** Add to project's TODO ⏳

Ask: **"Should I add this to your TODO list?"**

Document in audit report as "Deferred to backlog."

##### Is it a justified deviation? (intentional, contextual, documented reason)

**Action:** Accept and document in `DEVIATIONS.md` 📝

Ask: **"Should we document this as an intentional deviation?"**

Create/update `DEVIATIONS.md`:

```markdown
# Intentional Deviations

## Deviation: [Best Practice Name]

**Status:** Documented & Accepted

**Deviation:** [description]

**Rationale:** [why this deviation is justified in this context]

**Impact:** [None / Low / Medium — explanation]

**Documented by:** [user/date]
```

##### Is the best practice itself flawed?

**Action:** Propose updating the best practices guide ⚡

Ask: **"Should we reconsider this best practice?"**

If user agrees:
1. Document proposed change
2. Schedule best practices update for next session
3. Note in audit report

---

### Rule 4: Improvements to Guides

During audit, you may discover improvements to the best practices guide or this audit process guide.

**Always:**
1. Clarify which one
2. Ask approval: "Shall I update [X]?"
3. Propose the change with rationale
4. Apply only after explicit approval

---

### Rule 5: Re-audit Separation

If corrections justify a follow-up audit:

1. **Propose** re-audit at session end
2. **Never** do it in the same session

WHY: Session memory interferes with objectivity. Each audit needs clean context.

---

## Steps

### Step 1: Load Conformance Criteria

Read the project's **best practices guide** — it is the source of truth for what constitutes good practice.

The audit verifies conformance to this source — nothing else.

**Scope rule:** This guide defines *how* to audit, not *what* to audit. The list of auditable elements (Step 2) is always derived from the project's best practices guide — never hardcoded here.

---

### Step 2: Identify Auditable Elements

List all elements that need to be audited. Derive this list from the best practices guide loaded in Step 1.

Typical elements include:
- Bootstrap file content and structure
- `PROJECT.md` — all required sections
- Project folder structure
- Documentation files
- Mandatory files presence (`GLOSSARY.md`, `TODO.md`, `README.md`)

Ask user: **"Is this list complete?"**

---

### Step 3: Verify Each Element Against Best Practices

For each element, check it against the best practices guide.

Mark status:
- ✅ = Compliant
- ⚠️ = Minor deviation
- ❌ = Major deviation

Create audit table:

| # | Element | Best Practice | Status | Notes |
|---|---------|---------------|--------|-------|
| 1 | [element name] | [practice name] | ✅/⚠️/❌ | [specific finding] |
| 2 | ... | ... | ... | ... |

**Note:** Reference best practices by name, not by number — names are stable, numbers change.

---

### Step 4: Present Findings

Show the audit table and detailed notes for non-compliant items:

```
## Audit Results

[Table from Step 3]

## Issues Found

### Issue 1: [Element Name]
**Best Practice:** [Practice Name]
**Severity:** ⚠️ Minor / ❌ Major
**Current State:** [description]
**Problem:** [explanation of non-conformance]
```

---

### Checkpoint: Proceed to Deviations?

**Stop here.** Findings are presented.

Ask user explicitly:
> **"The audit results are ready. Would you like me to proceed with reviewing and treating the deviations? (Yes/No)"**

Wait for approval before continuing.

If **No**: Session ends here. Findings documented, no corrections applied.
If **Yes**: Proceed to Step 5.

---

### Step 5: Group Deviations into Coherent Batches

Group all deviations by logical similarity:

**Grouping criteria:**
- Same best practice (e.g., all "Imperative Rules with Comments" issues together)
- Common problem description (e.g., "Missing Keywords section")
- Shared solution (e.g., "Add `## Keywords`" to all affected files)
- Readability (batch fits on screen without excessive scrolling)

**Processing order** — from simplest to most complex:
1. Immediate fixes — applied directly in session
2. Documented deviations — examined, validated, or reclassified
3. TODO additions — examined, validated, or reclassified
4. Best practice updates — examined last

If a batch is too large, split it by sub-theme.

**Example grouping:**
```
Batch 1: Missing Keywords section ("Documentation Convention" best practice)
- conventions/filesystem.md
- conventions/sqlite.md
→ Solution: Add "## Keywords" section with relevant terms

Batch 2: Missing Quick Start section ("Documentation: Brief, Actionable" best practice)
- guides/audit-process.md
- guides/best-practices.md
→ Solution: Add "## Quick Start" section
```

Present batches to user before proceeding to Step 6.

---

### Step 6: Review and Apply Deviations by Batch

For **each batch**, follow this workflow:

1. **Present the batch:** name, list of issues, shared solution
2. **Apply Rule 3** to the entire batch
3. **Ask for approval:** > **"Shall I apply this batch? (Yes / Add to TODO / Defer)"**
4. **Execute or defer the entire batch** — not item by item
5. **Move to next batch** and repeat

---

### Step 7: Prepare Session Summary

```
# Audit Report: [PROJECT-NAME]

## Summary
- Total elements audited: X
- Compliant: X
- Minor issues: Y
- Major issues: Z
- Documented deviations: N

## Audit Results
[Audit table from Step 3]

## Issues Found
[Issues from Step 4]

## Corrections Applied
[What was applied immediately, by batch]

## Corrections Deferred
[Added to TODO, by batch]

## Documented Deviations
[Intentional deviations now in DEVIATIONS.md]

## Guide Updates Proposed
[Improvements to best practices or this audit process, if any]

## Next Steps
[Re-audit recommendation or follow-up]
```

---

### Step 8: Recommend Re-audit (If Needed)

If significant corrections were applied:

> "These changes justify a re-audit to verify they're correct. Shall we schedule that for your next session?"

**Never** run the re-audit in the same session. Insist on fresh context.

---

## Output Format

Always include:
- Audit table (elements × best practices, referenced by name)
- Issues found (one per section, with context)
- Deviations grouped into batches (by logical similarity)
- Corrections applied (by batch)
- Corrections deferred to TODO (by batch)
- Intentional deviations documented
- Guide updates proposed (if any)
- Re-audit recommendation (if applicable)

---

## Batching & Checkpoints

**Checkpoint after Step 4:** User must explicitly approve proceeding to deviation review. This prevents unplanned corrections.

**Batching (Steps 5-6):** Deviations are grouped by logical similarity. Each batch is presented and approved as a unit — not item by item.

Benefits:
- Fewer decision points
- One theme per batch
- Batches fit on screen
- Corrections applied together

---

## Index

| Terme | Occurrences |
|-------|-------------|

---

## Changelog

### Version 2.3 - Cleanup and generalization
**Date:** 2026-05-31
**Rationale:** Remove all French content. Remove references to Claude.md and context.md. Reference best practices by name instead of number. Update typical auditable elements to reflect current project structure (PROJECT.md, bootstrap file). General cleanup.

**Changes:**
- Quick Start: translated to English
- Step 2: "Claude.md, context.md" replaced by "Bootstrap file, PROJECT.md"
- Step 3: added note — reference best practices by name, not number
- Step 5: "Ordre de traitement des batches" translated and integrated; batch example updated with practice names instead of numbers
- Rule 3: DEVIATIONS.md template updated — practice name instead of number
- Changelog v2.2 and v2.1: translated to English

---

### Version 2.2 - Audit scope rule
**Date:** 2026-05-30
**Rationale:** Prevent project-specific content from being added to this generic guide. The list of auditable elements always derives from the project's best practices guide, never from this guide.

**Changes:**
- Step 1: added explicit scope rule

---

### Version 2.1 - Batch processing order
**Date:** 2026-05-30
**Rationale:** The guide defined how to group deviations but not in what order to process batches. Added explicit order by increasing complexity.

**Changes:**
- Added batch processing order in Step 5: immediate fixes → documented deviations → TODO → best practice updates
- Added option to split oversized batches by sub-theme

---

### Version 2.0 - Batching & Checkpoints
**Date:** 2026-05-29
**Rationale:** Improve UX during deviation review. Reduce message volume. Enable user control via checkpoints.

**Changes:**
- Added checkpoint after Step 4
- Restructured Step 5: group deviations into coherent batches
- Restructured Step 6: treat deviations by batch
- Updated output format to reflect batching workflow
- Added "Batching & Checkpoints" section

---

## Keywords
audit, verification, conformance, process, methodology, best-practices, deviations, batching, checkpoints, report
