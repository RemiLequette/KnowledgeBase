# Modular Architecture Convention

## Quick Start
Architecture convention for modular single-page applications.
Defines four concepts — Core, IService, Assembly, Framework — and the project documents required to apply this convention.
Load when designing a new application following this convention, or when reasoning about where a concept, module, or service belongs.
Does not list concrete modules, service implementations, or named assemblies — those belong to the project docs referenced in each section.

## Keywords
architecture, modular, core, component, IService, assembly, framework, interface, dependency-injection, module-types, src-layout, convention

## Table of Contents

1. [1 - Overview](#1---overview)
2. [2 - Core Modules](#2---core-modules)
3. [3 - Components](#3---components)
4. [4 - IService Interfaces](#4---iservice-interfaces)
5. [5 - Assemblies](#5---assemblies)
6. [6 - src Layout](#6---src-layout)
7. [7 - Framework Convention](#7---framework-convention)
8. [Index](#index)

## 1 - Overview
[up](#table-of-contents)
An application following this convention is structured around four concepts.

**Core** — the framework-agnostic business logic of the application. Core is composed of Modules that depend only on abstract service interfaces (IService) — never on concrete implementations. Modules are grouped into Components, which describe the application's sub-domains and drive assembly composition. Core is the portable, ownable heart of the application.

**IService** — the interface pattern for any external capability required by Core. Each IService is an abstraction: Core programs against the interface; the concrete implementation is injected at assembly time. Multiple implementations of an IService can exist; one is selected per assembly.

**Assembly** — a named, buildable configuration: one host framework + one or more Components + one concrete IService implementation per IService consumed by those Components. How Core is packaged and served is an assembly concern, not a Core concern.

**Framework** — both a build-time and a runtime concept. At build time, it assembles the selected modules and service implementations into an executable version. At runtime, it provides the application shell and may expose services to modules through coupled IService implementations. A framework defines its own convention — consumed by the build tool — which lists the IService implementations it provides and any artifacts it requires.

Each concept has a dedicated project document:
- Modules → see the project Module Registry
- IService interfaces and implementations → see the project IService docs
- Assemblies → see the project Assemblies doc

## 2 - Core Modules
[up](#table-of-contents)
Core is decomposed into modules. Each module has a type that determines how it is loaded and ordered at runtime.

### Fundamental UI Choice

Core is a single-page web application. Its UI is built on native HTML/CSS/JavaScript — no framework-specific toolkit, no virtual DOM, no component framework. This keeps Core portable: any host capable of rendering a web page can host it.

### Module Types

| Type | Content | Role |
|---|---|---|
| script | JavaScript only | Business logic, data, services — no markup |
| style | CSS only | Visual definition — layout, colors, typography |
| div | HTML + embedded script | UI components — structure, interaction, event wiring |

### Module Order

Modules are ordered. The order is significant: it defines the sequence in which scripts are executed, styles are applied, and HTML fragments are injected to reconstruct the page. Module order is defined in the project Module Registry.

The project Module Registry is the authoritative source for all modules: identity, type, layer, responsibility, dependencies, and testability. Naming convention: `{ProjectName}_Modules.md`.

## 3 - Components
[up](#table-of-contents)
A Component is a named group of modules. It is a logical grouping — not a deployment unit, not a package boundary. Its purpose is dual: architectural description (naming sub-domains of the application) and assembly composition (selecting a set of modules to include in a build).

Components are defined in the project Module Registry alongside the modules themselves.

### Component rules

- Every module belongs to exactly one Component — no module may be unassigned, no module may appear in more than one Component.
- Components do not overlap — the sets of modules they contain are disjoint.
- Components are named — the name reflects the sub-domain or capability they represent (e.g. core, ai, ui).
- An assembly selects one or more Components. The set of modules in the assembly is the union of all modules in the selected Components.
- An assembly must provide an IService implementation for every IService consumed by any module in its selected Components — no more, no less.

### Component registry

Components are defined in the project Module Registry (`{ProjectName}_Modules.md`), alongside the module entries. Each Component lists its member modules.

## 4 - IService Interfaces
[up](#table-of-contents)
An IService is an abstraction boundary between Core and any external capability. Core calls the interface — it never depends on a concrete implementation.

### IService rules

- Core modules call the interface only — never a concrete implementation directly.
- Each IService has a dedicated project doc (`{ProjectName}_Service_{IServiceName}.md`) specifying its API and listing its implementations.
- A concrete implementation may depend on the host framework or external tools; Core never does.

### Identifying an IService

An external capability warrants an IService when:
- It could be replaced by a different implementation (e.g. different rendering library, different storage backend).
- Its concrete implementation would introduce a framework or platform dependency into Core.

The list of IService interfaces defined for the project is maintained in the project Assemblies doc.

## 5 - Assemblies
[up](#table-of-contents)
An assembly is a named, buildable configuration: one host framework + one or more Components + one concrete implementation per IService consumed by those Components.

The project Assemblies doc (`{ProjectName}_Assemblies.md`) defines:
- The list of available frameworks and their module block model.
- The list of concrete IService implementations and their framework constraints.
- The named assemblies: selected Components, selected framework, and IService implementation per consumed IService.
- The source synchronisation convention between `src/` and the host framework.

## 6 - src Layout
[up](#table-of-contents)
The repository source tree reflects three concerns: Core, services, and framework artifacts.

```
src/
  {component-name}/        # One folder per Component — matches component names exactly
    module-a.js
    module-b.js
  services/
    IServiceName/
      interface.js             # IService abstract definition
      implementation-1/        # A concrete implementation
      implementation-2/        # Another concrete implementation (optional)
  frameworks/
    framework-name/            # One folder per framework (only if needed)
```

Each Component has its own folder under `src/`. The folder name matches the Component name exactly. Every module file lives in its Component folder — no module files at the `src/` root.

Each IService has its own folder under `services/`. The interface definition (`interface.js`) is always present. Concrete implementations are subfolders — one per implementation.

`src/frameworks/` is optional at the repo level — it only appears if at least one framework requires artifacts. See section 7 for the framework convention.

## 7 - Framework Convention
[up](#table-of-contents)
A framework is the host shell that packages and serves the application. Its only requirement from this convention: it must allow the repository to be synchronised with it to produce an executable version.

How the framework achieves this — its block model, its build pipeline, its tooling — is defined by the framework's own convention, not by this document.

A framework may provide coupled IService implementations (e.g. an AI proxy, an auth service). Its convention lists which IServices it provides. The project Assemblies doc takes this into account when defining named assemblies.

If a framework requires artifacts — synchronisation tracker, configuration, scripts, or coupled IService implementations — it places them in `src/frameworks/{framework-name}/`. The framework convention defines what goes there and how it is organised. A framework that has no such need (e.g. a simple concatenator) requires no entry under `src/frameworks/`.

Multiple framework folders may coexist in `src/frameworks/` — one per framework, each reflecting the state of the last assembly built against it.

## Index

| Term | Occurrences |
|------|-------------|

## Changelog

### Version 4.1 - Component exclusivity + src layout per component
**Date:** 2026-06-01
**Reason:** Components must be disjoint and exhaustive. src/ structure reflects components directly.

**Changes:**
- Section 3 - Component rules: "a module may belong to multiple components" replaced by exclusivity rule (exactly one component per module, no overlap)
- Section 6 - src Layout: flat `src/core/` replaced by one folder per component; rule added that no module files live at `src/` root

### Version 4.0 - Moved to KB as reusable convention
**Date:** 2026-06-01
**Reason:** Extracted from DDScope project and promoted to KB-level convention. All content was already generic — only title and Quick Start updated.

**Changes:**
- Title: "DDScope — Architecture ToBe" → "Modular Architecture Convention"
- Quick Start: DDScope-specific note removed; rewritten as a generic load condition
- File moved from `ddscope/docs/DDScope_Architecture_ToBe.md` to `knowledgebase/public/conventions/modular-architecture.md`

### Version 3.7 - Component concept added
**Date:** 2026-06-01
**Reason:** Component is a missing first-level concept — groups modules for assembly composition and architectural description.

**Changes:**
- Overview: Component concept added
- Section 3 - Components added: definition, rules, registry pointer
- Section 5 - Assemblies: assembly now selects Components, not individual modules; IService coverage rule tied to selected Components
- TOC: renumbered — Components inserted as section 3; IService→4, Assemblies→5, src Layout→6, Framework Convention→7
- Section 6: self-reference corrected (section 6→7)
- Keywords: component added

### Version 3.6 - Framework provides IService implementations
**Date:** 2026-06-01

**Changes:**
- Overview: Framework definition updated — lists the IServices it provides; convention consumed by the build tool
- Section 6: IService implementations added as possible framework artifacts in `src/frameworks/{framework-name}/`; paragraph added on framework-provided IServices and their relation to Assemblies doc

### Version 3.5 - IService and Framework concept corrections
**Date:** 2026-06-01

**Changes:**
- IService: "injected at application init" → "injected at assembly time"
- Framework: redefined as both build-time and runtime concept

### Version 3.4 - Framework concept added to Overview
**Date:** 2026-06-01

**Changes:**
- Section 1 - Overview: Framework concept added

### Version 3.3 - Framework Convention section + src/frameworks/
**Date:** 2026-06-01

**Changes:**
- Section 7 - Framework Convention added
- Section 6 - src Layout: `src/frameworks/` added

### Version 3.0 - Réécriture convention-first
**Date:** 2026-06-01
**Reason:** Document rewritten as a pure architecture convention — all project-specific content removed.
