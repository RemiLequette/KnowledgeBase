# Structured Reasoning & Clear Thinking

## Quick Start

Techniques pour guider un AI Assistant vers un raisonnement plus délibéré et structuré. Charger quand une tâche requiert analyse complexe, prise de décision, ou vérification de qualité de réponse.

## Core Techniques

### 1. Explicit Thinking Tags
Use `<thinking>` tags to trigger internal reasoning without showing it to the user.

**Pattern:**
```
User request + explicit instruction:
"Before answering, think through this step-by-step (don't show the thinking)."
```

**Result:** Claude uses internal reasoning to organize thoughts before producing cleaner output.

**Keywords:** thinking, internal reasoning, planning, scratch space

---

### 2. Step-by-Step Decomposition
Break complex problems into numbered, sequential steps.

**Pattern:**
```
"Approach this in 3 steps:
1. [First understanding/analysis]
2. [Middle evaluation/planning]
3. [Final decision/recommendation]"
```

**When to use:** Multi-part analysis, decision-making, research synthesis, problem-solving

**Effect:** Forces linear thinking, reduces jumping around, catches contradictions early

---

### 3. Chain of Thought (CoT)
Ask Claude to show intermediate reasoning explicitly in the output.

**Pattern:**
```
"Let me think about this:
- First, I need to understand X because...
- Second, this means Y...
- Therefore, Z..."
```

**When to use:** Educational content, explanations where reasoning matters, verification tasks

**Note:** Opposite of thinking tags—*show* the reasoning here

---

### 4. Role-Based Reasoning
Assign Claude a role that enforces specific thinking patterns.

**Patterns:**
```
- "You are a Socratic tutor — ask clarifying questions"
- "You are a skeptical analyst — challenge assumptions"
- "You are a system designer — think in terms of components and flows"
- "You are a copyeditor — focus only on clarity and precision"
```

**Effect:** Role constrains the reasoning style, reduces confusion, focuses depth

---

### 5. Structured Output Format
Request a specific format to force organized thinking.

**Patterns:**
```
"Respond in this structure:
## Problem Statement
## Root Cause
## Options (list 3+)
## Recommendation + Rationale"
```

**Benefits:** 
- Prevents rambling
- Ensures completeness
- Easier to verify reasoning

---

### 6. Adversarial Framing
Ask Claude to argue *against* the obvious conclusion.

**Pattern:**
```
"What's the strongest argument AGAINST [conclusion]? 
Present it as if you believed it."
```

**Effect:** 
- Surfaces hidden assumptions
- Tests reasoning robustness
- Reveals weak points

---

### 7. Constraint-Based Thinking
Add artificial limits that force creative or careful reasoning.

**Patterns:**
```
- "Answer in 1 sentence"
- "Explain as if to a 10-year-old"
- "Use only these 3 concepts: X, Y, Z"
- "No jargon allowed"
```

**Effect:** Forces distillation to essence, catches unclear thinking immediately

---

### 8. Reference-Based Reasoning
Ask Claude to ground thinking in specific documents or sources.

**Pattern:**
```
"Based only on [file/document], explain how..."
```

**Effect:** 
- Reduces hallucination
- Keeps reasoning concrete
- Easier to verify

---

## Prompting for Complex Analysis

### Pattern: The "Think First" Instruction
```
THINK FIRST (use <thinking> tags):
1. What do I actually know vs. assume?
2. What's missing or unclear?
3. What are edge cases or exceptions?

THEN ANSWER clearly.
```

---

### Pattern: The "Error Check"
```
Now, review your answer for:
- Logical gaps
- Unsupported claims
- Contradictions
- Missing nuance

Fix any issues.
```

---

### Pattern: The "Three Perspectives"
```
Address this from 3 angles:
1. [Perspective A] — what does it see?
2. [Perspective B] — what does it see?
3. [Perspective C] — what does it see?

Then synthesize.
```

---

## Anti-Patterns (What Breaks Clear Thinking)

| Anti-Pattern | Effect | Fix |
|---|---|---|
| Vague requests | Scattered reasoning | Add constraints, structure, examples |
| No thinking space | Shallow answers | Use thinking tags or CoT |
| Too many goals at once | Confused priorities | Break into separate requests |
| Conflicting instructions | Contradictory output | Clarify intent, rank by priority |
| No output format | Rambling | Specify structure (headers, bullet points) |
| Hidden assumptions | Wrong reasoning path | Ask "What are we assuming here?" |

---

## Effectiveness Indicators

✅ **Clear thinking is happening if:**
- Claude catches its own contradictions
- Answers are concise but complete
- Reasoning is shown (when requested)
- Edge cases are acknowledged
- Sources/assumptions are explicit

❌ **Unclear thinking if:**
- Output wanders between topics
- Claims lack support
- Same point repeated in different words
- Contradictions not acknowledged
- Output is longer but not more useful

---

## Quick Cheat Sheet

| Goal | Technique | Template |
|------|-----------|----------|
| Internal clarity | Thinking tags | "Before you answer, think..." |
| Show work | Chain of Thought | "Let me work through this..." |
| Reduce scatter | Structure | "Organize as: [format]" |
| Test robustness | Adversarial | "Argue against this..." |
| Ground in reality | Constraint | "Explain in 1 sentence..." |
| Check quality | Error review | "Review for gaps..." |

---

## Examples

### Example 1: Complex Decision
**Request:**
```
THINK FIRST (internal only):
- What options exist?
- What are the trade-offs?
- What am I uncertain about?

THEN give me a recommendation with:
- Top choice
- Why (3 reasons)
- Main risk
- When I'd reconsider
```

**Result:** Organized, decisive, acknowledges uncertainty.

### Example 2: Technical Explanation
**Request:**
```
Explain how [X] works.
Use this structure:
1. Analogy (what's familiar)
2. How it actually works (the details)
3. Why it matters (the impact)
4. One thing people get wrong (the edge case)
```

**Result:** Intuitive, accurate, memorable.

### Example 3: Writing Quality Check
**Request:**
```
Review this text for clarity:
- Is every sentence clear on its own?
- Is there any jargon that should be plain language?
- Is the argument linear or does it loop?
- What would a skeptic find unclear?

Then rewrite with fixes.
```

**Result:** Tighter, clearer, stronger writing.

---

## Keywords
structured-reasoning, thinking-tags, chain-of-thought, prompting, clarity, reasoning-patterns, analysis, decomposition, constraints, verification

---

## Index

| Terme | Occurrences |
|-------|-------------|

---

## Changelog

### Version 1.0 - Creation
**Date:** 2026-05-30
**Raison:** Convention raisonnement structure — 8 techniques pour un thinking plus delibere.

**Contenu initial :**
- 8 techniques : thinking tags, decomposition, CoT, roles, structure, adversarial, contraintes, reference
- Patterns avances : Think First, Error Check, Three Perspectives
- Anti-patterns et indicateurs d'efficacite