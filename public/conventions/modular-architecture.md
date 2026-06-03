# Modular Architecture Convention

## Quick Start
Architecture convention for modular single-page applications.
Defines six concepts — Core, IService, Component, Page, Stylesheet, Assembly, Framework — and the project documents required to apply this convention.
Load when designing a new application following this convention, or when reasoning about where a concept, module, or service belongs.
Does not list concrete modules, service implementations, or named assemblies — those belong to the project docs referenced in each section.

## Keywords
architecture, modular, core, component, page, stylesheet, IService, assembly, framework, interface, dependency-injection, module-types, repository-layout, fragments, styles, convention

## Table of Contents

1. [1 - Overview](#1---overview)
2. [2 - Core Modules](#2---core-modules)
3. [3 - Components](#3---components)
4. [4 - Page](#4---page)
5. [5 - Stylesheet](#5---stylesheet)
6. [6 - IService Interfaces](#6---iservice-interfaces)
7. [7 - Assemblies](#7---assemblies)
8. [8 - Repository Layout](#8---repository-layout)
9. [9 - Framework Convention](#9---framework-convention)
10. [Index](#index)

## 1 - Overview
[up](#table-of-contents)
An application following this convention is structured around four concepts.

**Core** — the framework-agnostic business logic of the application. Core is composed of Modules that depend only on abstract service interfaces (IService) — never on concrete implementations. Modules are grouped into Components, which describe the application's sub-domains and drive assembly composition. Core is the portable, ownable heart of the application.

**IService** — the interface pattern for any external capability required by Core. Each IService is an abstraction: Core programs against the interface; the concrete implementation is injected at assembly time. Multiple implementations of an IService can exist; one is selected per assembly.

**Component** — a named group of modules for assembly composition. See section 3.

**Page** — an ordered sequence of HTML fragments that defines the UI structure of one application. An assembly contains exactly one Page. See section 4.

**Stylesheet** — an ordered set of CSS files associated with a Page. An assembly contains exactly one Stylesheet. See section 5.

**Assembly** — a named, buildable application: one framework + one Page + one Stylesheet + one or more Components + one concrete IService implementation per IService consumed. One assembly = one deployable application. See section 7.

**Framework** — both a build-time and a runtime concept. At build time, it assembles the selected artifacts into an executable version. At runtime, it provides the host shell and may expose services through coupled IService implementations. A framework defines its own convention listing the IService implementations it provides and any artifacts it requires.

Each concept has a dedicated project document:
- Modules and Components → see the project Module Registry
- Pages and Stylesheets → see the project Views Registry
- IService interfaces and implementations → see the project IService docs
- Assemblies → see the project Assemblies doc

## 2 - Core Modules
[up](#table-of-contents)
Core is decomposed into modules. Each module has a type that determines how it is loaded and ordered at runtime.

### Fundamental UI Choice

Core is a single-page web application. Its UI is built on native HTML/CSS/JavaScript — no framework-specific toolkit, no virtual DOM, no component framework. This keeps Core portable: any host capable of rendering a web page can host it.

### Module Types

A **module** is a JavaScript unit with a declared responsibility, a public API, and testability as a first-class property. Only `script` blocks qualify as modules.

| Type | Content | Role |
|---|---|---|
| script | JavaScript only | Business logic, data, services — no markup. **Modules.** |

`style` and `div` blocks are **not modules** — they are presentation artifacts with distinct rules. See section 6 - Repository Layout.

### Module Order

Modules are ordered. The order is significant: it defines the sequence in which scripts are executed. Module order is defined in the project Module Registry.

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

## 4 - Page
[up](#table-of-contents)
A Page is an ordered sequence of HTML fragments that reconstructs a complete UI. Fragments are concatenated in position order at build time — order is semantically significant; a misplaced fragment corrupts the DOM.

**One assembly = one Page.** A Page is not a route or a view inside an application — it is the entire HTML structure of one deployable application. Multiple applications may exist in a project, each with its own Page and assembly.

Fragments are not modules — they have no testable API and are not subject to Component rules. Their registry is the project Views Registry.

### Page registry

Pages and their fragments are defined in the project Views Registry (`{ProjectName}_Views.md`).

## 5 - Stylesheet
[up](#table-of-contents)
A Stylesheet is an ordered set of CSS files associated with a Page. CSS files are applied in position order — order matters for cascade and specificity.

**One assembly = one Stylesheet.** A Stylesheet is always paired with its Page in the same assembly.

Styles are not modules — they have no testable API and are not subject to Component rules. Their registry is the project Views Registry alongside Pages.

### Stylesheet registry

Stylesheets and their CSS files are defined in the project Views Registry (`{ProjectName}_Views.md`), alongside Pages.

## 6 - IService Interfaces
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

## 7 - Assemblies
[up](#table-of-contents)
An assembly is a named, buildable application: one framework + one Page + one Stylesheet + one or more Components + one concrete implementation per IService consumed by those Components.

**One assembly = one deployable application.** Different assemblies in the same project produce different applications — each with its own Page, Stylesheet, and selected Components.

The project Assemblies doc (`{ProjectName}_Assemblies.md`) defines:
- The list of available frameworks and their block model.
- The list of concrete IService implementations and their framework constraints.
- The named assemblies: selected Page, Stylesheet, Components, framework, and IService implementation per consumed IService.
- The source synchronisation convention between the repository and the host framework.

## 8 - Repository Layout
[up](#table-of-contents)
The repository separates four concerns at the top level: modules, fragments, styles, and framework artifacts.

```
src/                         # JavaScript modules only — testable (Vitest)
  {component-name}/          # One folder per Component — matches component names exactly
    module-a.js
    module-b.js
  services/
    IServiceName/
      interface.js             # IService abstract definition
      implementation-1/        # A concrete implementation
      implementation-2/        # Another concrete implementation (optional)
fragments/                   # HTML fragments — one folder per Page
  {page-name}/               # Matches Page name exactly
    fragment-NNN-name.html   # NNN = position; order is semantically significant
styles/                      # CSS files — one folder per Stylesheet
  {stylesheet-name}/         # Matches Stylesheet name exactly
    style-NNN-name.css       # NNN = position; order is semantically significant
frameworks/                  # Framework deployment artifacts (sync trackers, config, scripts)
  {framework-name}/
```

### src/ — modules only

Only JavaScript module files live under `src/`. Each Component has its own folder; the folder name matches the Component name exactly. No module files at the `src/` root.

Each IService has its own folder under `src/services/`. The interface definition (`interface.js`) is always present. Concrete implementations are subfolders.

### fragments/ — HTML page structure

Fragments are ordered HTML files. They are concatenated in position order to produce the page. Order is semantically significant — a misplaced fragment corrupts the DOM. Fragment files are named with a position prefix (`fragment-NNN-name.html`) to make order explicit in the filesystem.

Fragments are not modules — they have no testable API. They are first-class artifacts of the presentation layer.

### styles/ — CSS

CSS files are ordered by position prefix (`style-NNN-name.css`). Order matters for cascade and specificity.

Styles are not modules — they have no testable API.

### frameworks/ — deployment artifacts

`frameworks/` is optional — it only appears if at least one framework requires artifacts. See section 7 for the framework convention.

## 9 - Framework Convention
[up](#table-of-contents)
A framework is the host shell that packages and serves the application. Its only requirement from this convention: it must allow the repository to be synchronised with it to produce an executable version.

How the framework achieves this — its block model, its build pipeline, its tooling — is defined by the framework's own convention, not by this document.

A framework may provide coupled IService implementations (e.g. an AI proxy, an auth service). Its convention lists which IServices it provides. The project Assemblies doc takes this into account when defining named assemblies.

If a framework requires artifacts — synchronisation tracker, configuration, scripts, or coupled IService implementations — it places them in `frameworks/{framework-name}/`. The framework convention defines what goes there and how it is organised. A framework that has no such need requires no entry under `frameworks/`.

Multiple framework folders may coexist in `frameworks/` — one per framework, each reflecting the state of the last assembly built against it.

## Index

| Term | Occurrences |
|------|-------------|

## Changelog

### Version 6.0 - Page, Stylesheet concepts added — Assembly redefined
**Date:** 2026-06-01
**Reason:** Fragments and styles need first-class registry and assembly concepts. A Page is an ordered sequence of fragments defining one application's UI. A Stylesheet is its paired CSS set. One assembly = one Page + one Stylesheet + Components + Services. Views Registry introduced as the registry for Pages and Stylesheets.

**Changes:**
- Overview: Page, Stylesheet, Assembly, Framework definitions updated; Views Registry referenced
- Section 4 - Page added: definition, one-assembly-one-page rule, registry pointer
- Section 5 - Stylesheet added: definition, paired with Page, registry pointer
- Section 6 - IService: renumbered from 4
- Section 7 - Assemblies: renumbered from 5; redefined as framework + Page + Stylesheet + Components + Services
- Section 8 - Repository Layout: renumbered from 6
- Section 9 - Framework Convention: renumbered from 7; frameworks/ path corrected (no longer under src/)
- TOC: renumbered
- Quick Start: updated concept count
- Keywords: page, stylesheet added

### Version 5.0 - Modules only in src/ — fragments and styles promoted to top-level
**Date:** 2026-06-01
**Reason:** style and div blocks are not modules — they have no testable API. Separating them from src/ clarifies the architecture and makes the testability contract of src/ explicit. fragments/ and styles/ are first-class artifacts at the repo root.

**Changes:**
- Section 2 - Core Modules: Module Types table reduced to script only; style and div removed as module types; explanation added pointing to section 6
- Section 2 - Module Order: reference to styles and HTML fragments removed
- Section 6 renamed: src Layout → Repository Layout
- Section 6 rewritten: four top-level concerns (src/, fragments/, styles/, frameworks/); fragments and styles documented as ordered, non-testable artifacts
- TOC: section 6 anchor updated
- Keywords: src-layout → repository-layout; fragments, styles added

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
