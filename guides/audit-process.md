# Project Audit Process

## Quick Start

Processus d'audit pour vérifier la conformité d'un projet à ses best practices.
Utiliser sur demande explicite uniquement — pas automatique.
Couvre : chargement des critères, identification des éléments, table d'audit, batches de déviations, rapport final.

If you only need the essentials:

1. Load the project's best practices guide (it's the source of truth)
2. Create an audit table: compare each element against the practices
3. For each issue found: choose one → (fix now / add to TODO / document as intentional deviation / propose best practice update)

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
  - [Checkpoint: Proceed to Deviations?](#%EF%B8%8F-checkpoint-proceed-to-deviations)
  - [Step 5: Group Deviations into Coherent Batches](#step-5-group-deviations-into-coherent-batches)
  - [Step 6: Review and Apply Deviations by Batch](#step-6-review-and-apply-deviations-by-batch-apply-rule-3)
  - [Step 7: Prepare Session Summary](#step-7-prepare-session-summary)
  - [Step 8: Recommend Re-audit](#step-8-recommend-re-audit-if-needed)
- [Output Format](#output-format)
- [New in This Process](#new-in-this-process-batching--checkpoints)
- [Changelog](#changelog)
- [Keywords](#keywords)

---

Simple, generic process for auditing a project's conformance to its best practices.

---

## When to Run

**On explicit request only.** Not automatic, not part of session startup.

User says:
> "Audit this project. Use: C:\...\guides\audit-process.md"

---

## Rules of Engagement

### Rule 1: Session Dedication

An audit session is **dedicated to auditing**.

If diverging into other work (scope creep), remind user:
> "This is an audit session. Should we stay focused on the audit, or save this for another time?"

Keep the session focused and clear.

---

### Rule 2: Corrections During Audit

Corrections **CAN** be applied during the audit session.

**Use judgment:**
- Small, obvious fixes → apply immediately ✅
- Complex changes → add to project's TODO list ❓
- Uncertain → propose, don't apply

Ask user: **"Apply this now or add to TODO?"**

(Reuse project's existing TODO list if it has one)

---

### Rule 3: Review Deviations

When a deviation from best practices is found, **discuss with user and make your best proposal:**

#### **3a: Already Documented?**

Is this deviation already documented in `DEVIATIONS.md` or project notes?

- **YES** → Report briefly in audit findings, move on
- **NO** → Continue to 3b

---

#### **3b: Make Your Best Proposal**

Discuss the deviation with the user. Choose the best path forward:

##### **Is it a simple fix?** (typo, file name, trivial issue)

**Action:** Fix immediately in this audit session ✅

Example: "Claude.md has typo 'Claudee' → fix to 'Claude'"

Apply the fix, document in audit report.

---

##### **Is it a complex change?** (requires thought, implementation time)

**Action:** Add to project's backlog/TODO/ticket system ⏳

Example: "Project structure needs refactoring → add to backlog"

Ask: **"Should I add this to your TODO list?"**

Document in audit report as "Deferred to backlog."

---

##### **Is it a justified deviation?** (intentional, contextual, documented reason)

**Action:** Accept and document in `DEVIATIONS.md` 📝

Ask: **"Should we document this as an intentional deviation?"**

Create/update `DEVIATIONS.md`:

```markdown
# Intentional Deviations

## Deviation 1: Best Practice #1 (Instruction Minimalism)

**Status:** Documented & Accepted

**Deviation:** Project instructions are 8 lines instead of 2-3

**Rationale:** 
Complex data pipeline requires detailed setup instructions 
that cannot be condensed further without losing critical information.

**Impact:** None — instructions are still clear and actionable.

**Documented by:** [user/date]
```

---

##### **Is the best practice itself flawed?** (the principle might be wrong for some contexts)

**Action:** Propose updating the best practices guide ⚡

Ask: **"Should we reconsider this best practice?"**

Example: "Best Practice #11 says 2-3 lines, but complex projects need more. Should we update BP#11?"

If user agrees:
1. Document proposed change
2. Schedule best practices update for next session
3. Note this in audit report

---

### Rule 4: Improvements to Guides

During audit, you may discover improvements to:
- **a) The Best Practices Guide** itself
- **b) The Audit Process Guide** itself

**ALWAYS:**
1. Clarify which one (a or b)
2. Ask approval: "Shall I update [X]?"
3. Propose the change with rationale
4. Document timestamp and reason
5. Apply only after explicit approval

---

### Rule 5: Re-audit Separation

If corrections justify a follow-up audit:

1. **PROPOSE** re-audit at session end
2. **NEVER** do it in the same session
3. **INSIST:** "Let's schedule this for a fresh session"

**WHY:** Session memory interferes with objectivity.  
Each audit needs clean context to be truly neutral.

---

## Steps

### Step 1: Load Conformance Criteria

Read the project's **best practices guide**.

Example:
```
C:\Users\RemiLequette\Development\projects\[PROJECT]\guides\[GUIDE-NAME].md
```

This guide is the **source of truth** for what constitutes good practice.

The audit process verifies conformance to this source — nothing else.

**Scope rule:** The audit process is generic. It defines *how* to audit, not *what* to audit. The list of auditable elements (Step 2) is always derived from the project's best practices guide — never hardcoded in this process. Do not add project-specific or convention-specific items to this guide.

---

### Step 2: Identify Auditable Elements

List **all** elements that need to be audited.

Typical elements include:
- Project configuration files (e.g., Claude.md, context.md)
- Desktop/UI instructions or settings
- Project folder structure
- Documentation files
- Setup procedures

Ask user: **"Is this list complete?"**

---

### Step 3: Verify Each Element Against Best Practices

For each element, check it against the best practices guide.

Mark status:
- ✅ = Compliant
- ⚠️ = Minor deviation
- ❌ = Major deviation (needs fixing)

Create audit table:

| # | Element | Best Practice | Status | Notes |
|---|---------|---|---|---|
| 1 | [element name] | [practice #] | ✅/⚠️/❌ | [specific finding] |
| 2 | ... | ... | ... | ... |
| N | ... | ... | ... | ... |

---

### Step 4: Present Findings

Show the audit table + detailed notes for non-compliant items:

```
## Audit Results

[Table from Step 3]

## Issues Found

### Issue 1: [Element Name]
**Best Practice:** [#] — [Practice Name]
**Severity:** ⚠️ Minor / ❌ Major
**Current State:** [quote or description]
**Problem:** [explanation of non-conformance]

### Issue 2: [...]
```

---

### ⏸️ **CHECKPOINT: Proceed to Deviations?**

**Stop here.** Findings are presented.

Ask user explicitly:
> **"The audit results are ready. Would you like me to proceed with reviewing and treating the deviations? (Yes/No)"**

Wait for approval before continuing to Step 5.

If **No**: Session ends here. Findings are documented, no corrections applied.
If **Yes**: Proceed to Step 5 to group deviations into batches.

---

### Step 5: Group Deviations into Coherent Batches

Group all deviations by **logical similarity** to improve clarity and focus:

**Grouping criteria:**
- **Same best practice** (e.g., all #14 Keywords issues together)
- **Common problem description** (e.g., "Missing Keywords section")
- **Shared solution** (e.g., "Add `## Keywords`" to all)
- **Readability** (batch fits on screen without excessive scrolling)

**Do NOT group by:**
- Random combinations
- Arbitrary batch sizes

**Example grouping:**
```
Batch 1: Keywords Missing (Best Practice #14)
- filesystem.md
- sqlite.md
- commwise-layout.md
- claude-chrome-mcp.md
- session-startup.md
→ Solution: Add "## Keywords" section with relevant terms

Batch 2: Quick Start Section Missing (Best Practice #15)
- audit-process.md
- best-practices.md
→ Solution: Add "## Quick Start" section with essentials
```

**Present batches to user for clarity** before proceeding to Step 6.

### Ordre de traitement des batches

Traiter les batches dans cet ordre, du plus simple au plus complexe :

1. **Fix immédiats** — corrections appliquées directement dans la session
2. **Déviations documentées** — examinées et validées, ou requalifiées en fix / TODO / mise à jour de BP
3. **Ajouts à la TODO** — examinés et validés, ou requalifiés
4. **Mises à jour de best practice** — examinées en dernier

Si un batch est trop grand pour tenir sur l'écran, le découper par thème.

---

### Step 6: Review and Apply Deviations by Batch (Apply Rule 3)

For **each batch**, follow this workflow:

1. **Present the batch:**
   - Batch name (common description)
   - List of issues in this batch
   - Shared solution

2. **Apply Rule 3 to the entire batch:**
   - Is it a simple fix? → Propose all corrections for this batch
   - Is it complex? → Add all to TODO
   - Is it a justified deviation? → Document all in DEVIATIONS.md
   - Update to best practice? → Note for update

3. **Ask for approval:**
   > **"Shall I apply this batch? (Yes / Add to TODO / Defer)"**

4. **Execute or defer the entire batch** (not item by item)

5. **Move to next batch** and repeat

**Why batching improves the process:**
- ✅ Fewer decision points (one per batch, not one per issue)
- ✅ Better focus (one theme at a time)
- ✅ Clearer communication (shared solution explained once)
- ✅ Improved readability (fits on screen)
- ✅ Faster workflow (batch corrections together)

---

### Step 7: Prepare Session Summary

Create final audit report:

```
# Audit Report: [PROJECT_NAME]

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

## Deviations Reviewed
[Deviations found, documented, or accepted]

## Corrections Proposed
[Corrections from Step 6]

## Corrections Applied
[What was applied immediately]

## Corrections Deferred
[Added to TODO or saved for review]

## Documented Deviations
[Intentional deviations now in DEVIATIONS.md]

## Guide Updates Proposed
[If any improvements to best practices or this audit process]

## Next Steps
[Any re-audit recommendations or follow-up]
```

---

### Step 8: Recommend Re-audit (If Needed)

If significant corrections were applied:

**Propose:** "These changes justify a re-audit to verify they're correct. Shall we schedule that for your next session?"

**CRITICAL:** Do NOT run the re-audit now. Insist on a fresh session with clean context.

---

## Output Format

Use the summary format from Step 7.

**Always include:**
- Audit table (elements × best practices)
- Issues found (one per section, with context)
- Deviations grouped into batches (by logical similarity)
- Batches reviewed (approvals, deferrals, documented deviations)
- Corrections proposed per batch (before/after with rationale)
- What was applied immediately (by batch)
- What was deferred to TODO (by batch)
- What was documented as intentional deviation
- Any guide updates proposed
- Recommendation for re-audit (if applicable)

---

## New in This Process: Batching & Checkpoints

**Checkpoint after Step 4:** User must explicitly approve proceeding to deviation review. This prevents "audit drift" into unplanned corrections.

**Batching (Step 5-6):** Deviations are grouped by logical similarity (same best practice, shared solution, common description). Each batch is presented and approved as a unit, not item-by-item. This improves:
- **Clarity** — fewer decision points
- **Focus** — one theme per batch
- **Readability** — batches fit on screen
- **Efficiency** — batch corrections together

---

## Changelog

### Version 2.2 - Regle de perimetre du guide
**Date:** 2026-05-30
**Rationale:** Prevenir les ajouts de contenu projet-specifique dans ce guide generique. La liste des elements auditables derive toujours des best practices du projet, jamais de ce guide.

**Changes:**
- Step 1 : ajout d'une "Scope rule" explicite — ce guide definit *comment* auditer, pas *quoi* auditer

---

### Version 2.1 — Ordre de traitement des batches
**Date:** 2026-05-30
**Rationale:** Le guide définissait comment grouper les déviations mais pas dans quel ordre traiter les batches. Ajout d'un ordre explicite par complexité croissante.

**Changes:**
- Ajout de la section "Ordre de traitement des batches" dans Step 5
- Ordre : fix immédiats → déviations documentées → TODO → mises à jour de BP
- Possibilité de découper un batch trop grand par thème

**Benefit:** Sessions plus fluides — on se débarrasse d'abord de ce qui est certain et rapide, puis on examine les cas qui demandent une décision.

---

### Version 2.0 — Batching & Checkpoints
**Date:** 2026-05-29  
**Rationale:** Improve UX and clarity during deviation review. Reduce message volume. Enable user control via checkpoints.

**Changes:**
- Added **Checkpoint after Step 4** — Explicit user approval required before proceeding to deviation review
- Restructured **Step 5** — New step to group deviations into coherent batches (by logical similarity, shared solution, readability)
- Restructured **Step 6** — Treat deviations by batch instead of one-by-one. Single approval per batch.
- Renumbered **Steps 7-8** (formerly Steps 9-10)
- Updated **Output Format** section to reflect batching workflow
- Added **"New in This Process"** section for visibility

**Benefit:** Fewer decision points, better focus, improved readability. Sessions stay within viewport limits.

---

## Keywords
audit, verification, conformance, process, methodology, neutral, best-practices, project, exhaustive, deviations, pragmatic

---

## Index

| Terme | Occurrences |
|-------|-------------|
