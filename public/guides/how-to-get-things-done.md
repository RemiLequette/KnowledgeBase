# How to Get Things Done

A practical guide for running effective AI-assisted working sessions.

*Document type: Guide*

## Quick Start

This guide (aka GTD) describes how to structure a working session with an AI Assistant to produce a clear, concrete result.
A session maps to a chat — one objective, one log, one closure.
Applies to any AI-assisted project.
This guide is a framework, not a procedure — adapt it to your context.

## Keywords
working-session, productivity, scoping, execution, closure, WIP, todo, context, anti-patterns, AI-assisted, chat, log

## Table of Contents

1. [Why this guide exists](#why-this-guide-exists)
2. [The session model](#the-session-model)
3. [Phase 1 - Scoping](#phase-1---scoping)
4. [Phase 2 - Execution](#phase-2---execution)
5. [Phase 3 - Closure](#phase-3---closure)
6. [Anti-patterns](#anti-patterns)
7. [Index](#index)

## Why this guide exists
[up](#table-of-contents)

An AI-assisted session without structure drifts. You start with one objective and end with three open threads, half-written files, and a saturated context. The AI does not lose the thread mid-session — but it does not recenter either. That is the human's role.

This guide provides a repeatable frame so that every session produces a result that is clear, deliverable, and properly closed.

Underlying conviction: **effective collaboration practices with an AI resemble those with a human collaborator** — clear intent, defined scope, explicit feedback, clean closure.

## The session model
[up](#table-of-contents)

### A session is a chat

A session maps exactly to a chat in your AI tool. This gives you three things for free:
- a **start** — the first message
- an **end** — the last message before closing
- a **log** — the full conversation, readable after the fact

The AI tool names the chat automatically from the first message. **The quality of your first message determines the quality of your log.** A vague opening produces a vague title. A focused opening produces a useful archive entry. You can rename it manually afterwards, but it is always better to be right the first time.

### One objective, not one hour

A session is defined by its objective, not its duration. It ends when the objective is reached — or when a conscious decision is made to stop.

There is a structural reason to keep sessions short: the context window degrades over time. Decisions made early in a long session become blurry. A focused session on a single objective is more reliable than a long session covering several.

### The project is the frame

A session does not happen in a vacuum. It takes place inside a project with its own history, files, and conventions. Two artifacts anchor every session to its project:

- **TODO** — the ordered backlog of what remains to be done
- **WIP** — the set of all items in `[WIP]` state in `TODO.md` (see `conventions/todo-list.md`). Represents what is currently in progress, potentially incomplete, to be resumed.

The WIP is the bridge between sessions. A session closes by updating it. The next session may start by exploring it if no idea what to do next, once decided rename the chat ;-).

## Phase 1 - Scoping
[up](#table-of-contents)

Before producing anything, align on what the session is for.

### Explore the project context

Start by reading the project state:
- PROJECT.mdl hopefully it is in the context
- What is the current WIP? What was left incomplete?
- What does the TODO say about the target area?
- What conventions or specs are relevant?

Do not rely on memory. Read the documentation.

### Define the objective

State the session objective explicitly in the first message or early in the conversation. It becomes the chat title and the anchor for everything that follows.

A good objective is concrete and deliverable: *"Write the scoping section of the working session guide"* — not *"work on the guide"*.

### Use the AI's knowledge

Before designing a solution, ask open questions. The AI has broad knowledge from training — domain concepts, patterns, analogies, prior art. A well-placed open question often surfaces ideas that refine the objective before any work begins.

Example: asking *"What is your view on session duration?"* produced a structural insight (context window degradation) that shaped the session model in this very guide.

Do that before sharing your ideas or you risk steering is answers. Sure he will steer yours, but you are better at objectivity.

Then follow with a healthy debate, give each other feedback, reformulate to check clarity.

### Validate before acting

The scoping conversation may not be finished. **No document is modified until the human gives an explicit go.** Design in the chat first — write to disk second.

## Phase 2 - Execution
[up](#table-of-contents)

### Stay on objective

The scoped objective is the reference. If a new idea, a side task, or an interesting tangent appears — capture it in the TODO rather than pursuing it now. Capture keeps the idea without breaking the session.

### Propose and challenge before acting

Both can propose. Both can challenge. The human decides. For any file modification:
1. Either side proposes what to do and why
2. Human confirms
3. AI acts

This applies to all writes: new files, edits, deletes.

### One thing at a time

Complete one deliverable before starting the next. A session with one finished result is worth more than a session with three things half-done.

### Watch for context drift

As the session grows, the AI's grip on early decisions weakens. Signals of drift: the AI repeats something already decided, contradicts an earlier choice, or produces something that does not fit the objective. When this happens — restate the objective, summarize the decisions made, and continue.

## Phase 3 - Closure
[up](#table-of-contents)

A session is not over when the last file is written. It is over when the project state reflects what happened.

### Confirm the deliverable

Verify that the objective is met. If it is not fully met, that is fine — but say so explicitly.

### Update the project state

- **WIP** — mark completed items done; update or create WIP entries for anything left in progress
- **TODO** — add any new items captured during the session
- **Changelog** — update relevant files if the session produced lasting changes

### If it is not written it does not exist

A conversation is not a record. Insights, decisions, and workarounds discovered during a session exist only in the chat — and the chat is not the project. When the session closes, anything not written to a file is gone.

This applies to both sides: the human should not rely on the AI retaining anything across sessions, and the AI should never say "I will remember this." There is nothing to remember. There is only what is written.

The reflex: when something worth keeping surfaces — a decision, a finding, a convention exception — write it down before closing. A TODO item, a Changelog entry, a convention update. The form does not matter. The trace does.

### Post-mortem

Before closing, take a moment to reflect: did the session go well? What could have been done better? A short exchange — a few lines in the chat — is enough. It feeds the next session and improves the practice over time.

### Close the chat

The AI Assistant will suggest closure when the objective is reached. The human decides. Continuing after closure is fine — for loose ends, ideas, or post-mortem notes.

As the AI tool names the chat automatically from the first user message, a concrete and specific first message already produces a good title — do not suggest renaming in that case.

If the first message was a question of orientation (*"what's the WIP?"*, *"let's pick a TODO"*) rather than a scoped objective, the AI Assistant should suggest a replacement chat title based on what was actually accomplished. The human renames the chat manually — the AI cannot do it directly.

Closing the chat will vot create a closure, the human can come bak to a chat after a few days, the AI will not notice, it has to be triggered by the human, or validated on AI proposal. Note also that conducting multiple chats in parallel may not be the healthiest practise.

## Anti-patterns
[up](#table-of-contents)

### Scope drift
The session starts on objective A and gradually shifts to B, then C. No single step feels wrong — the drift is cumulative. Fix: restate the objective at the first sign of drift.

### Premature file writes
Files are modified before the design conversation is finished. The result is a half-baked artifact that costs more to undo than to prevent. Fix: design in the chat, write on explicit go.

### Vague first message
The chat opens with *"let's continue the project"* or *"help me with the guide"*. The AI names the chat accordingly. The log is useless as an archive. Fix: open with a concrete, specific objective, at least state it early.

### Context overload
Too many topics in one session saturates the context window. Early decisions become unreliable. Fix: one objective per session, split if needed.

### Hierarchy of Concern violation (aka HOC)

Two failure modes, same root cause: mixing levels.

The first: burying a structural concern alongside a trivial remark. *"Your architecture choice will make the whole feature impossible to scale — also, you have a typo on line 3."* Both in the same answer, same weight. The typo gets noticed; the architecture issue gets lost.

The second: responding to a high-level question with implementation details. The human asks whether the approach is sound — the AI answers with code. The strategic question goes unanswered.

Fix: address the highest-concern level first, fully, before going lower. If the approach is wrong, say so before reviewing the implementation. If the implementation has a critical flaw, name it before commenting on style.

### No closure
The session ends when energy runs out, not when the objective is reached. The WIP is not updated, the memory is lost. Fix: explicit closure, even a brief one.

### Unanchored session
The session starts without reading the project state — TODO, WIP, relevant files. The AI works from the conversation alone, disconnected from project history. Fix: always start by reading the project context.

## Index

| Term | Occurrences |
|------|-------------|

## Changelog

### Version 1.4 - Memory rule and HOC anti-pattern
**Date:** 2026-06-06
**Reason:** Two additions pending in W1: memory rule (if it is not written it does not exist) and Hierarchy of Concern anti-pattern (do not mix levels of detail in the same answer).

**Changes:**
- `### If it is not written it does not exist`: new sub-section added in Phase 3 - Closure, after Update the project state
- `### Hierarchy of Concern violation (aka HOC)`: new anti-pattern added

---

### Version 1.3 - Close the chat — rename trigger clarified
**Date:** 2026-06-06
**Reason:** AI was suggesting chat rename even when the first message was already a concrete objective. Rule clarified: a specific first message produces a good title automatically — suggest rename only when the first message was an orientation question.

**Changes:**
- `### Close the chat`: explicit rule added — do not suggest renaming if first message was a scoped objective

---

### Version 1.2 - WIP definition aligned with todo-list convention
**Date:** 2026-06-06
**Reason:** WIP was described as a separate artifact. Clarified: WIP = set of `[WIP]` items in `TODO.md`, with reference to `conventions/todo-list.md`.

**Changes:**
- `### The project is the frame`: WIP definition updated with reference to convention

---

### Version 1.1 - Closure enriched
**Date:** 2026-06-06
**Reason:** Two additions to Phase 3: (1) Prepare the next session now explicitly covers reviewing WIP + TODO and drafting the opening message of the next session as a concrete, titlable objective; (2) Close the chat now includes a suggestion to rename the chat if the first message was a question of orientation rather than a scoped objective.

**Changes:**
- `### Prepare the next session`: rewritten — review WIP + TODO, draft next opening message, example added
- `### Close the chat`: added — suggest chat rename if first message was orientation-only

---

### Version 1.0 - Creation
**Date:** 2026-06-06
**Reason:** New guide — practical framework for running effective AI-assisted working sessions. Covers session model (chat = session), three phases (scoping, execution, closure), and anti-patterns.
