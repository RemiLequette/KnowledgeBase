# Session Startup Workflow

**Execute this workflow at the START of every new session before answering any request.**

## Steps (in order)

### 1. Load Project Context
```
Check: Is there a Claude.md at the PROJECT ROOT?
If yes → Read it first (it contains critical setup)
If no → Skip to step 2
```

### 2. Load Knowledge Base
```
Read this file:
C:\Users\RemiLequette\Development\projects\claude-knowledge\INDEX.md

This tells you what conventions exist and when to load them.
```

### 3. Load Relevant Conventions
Based on the request or project type, load the relevant file(s) from:
```
C:\Users\RemiLequette\Development\projects\claude-knowledge\conventions/
```

Common triggers:
- **File operations** → Load `filesystem.md`
- **Database work** → Load `sqlite.md`
- **Browser/DOM issues** → Load `claude-chrome-mcp.md`
- **Thinking/reasoning** → Load `claude-structured-reasoning.md`
- **CSS/layout** → Load `commwise-layout.md`

### 4. Then Answer the Request
Now proceed with the actual task, informed by the knowledge base.

---

## Why This Matters

- **Consistency** — Same setup every time, no surprises
- **Prevents mistakes** — Like the "Can't find the folder" issue
- **Faster** — Knowledge is cached, not discovered ad-hoc
- **Respects user intent** — User invested time building this base

---

## Checklist

- [ ] Project has Claude.md → Read it
- [ ] Load INDEX.md from knowledge base
- [ ] Identify relevant conventions
- [ ] Load them before answering
- [ ] Proceed with request

---

## Exception

If this is a NEW project with no Claude.md, just load INDEX.md from the knowledge base and use judgment on which conventions apply.

---

## Keywords
startup, initialization, session, workflow, conventions, procedure, entry-point
