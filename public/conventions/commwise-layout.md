# CommWise Layout Constraints

## Quick Start

Convention layout spécifique CommWise — contraintes flex causées par les overrides `!important`. Charger uniquement pour les projets CommWise avec des problèmes de positionnement ou de viewport.

## The core problem

CommWise platform overrides (STYLE 840) apply `!important` on flex properties of key containers:

```css
.dds-workspace { display: flex !important; flex: 1 1 0% !important; height: 0px !important; min-height: 0px !important; }
.dds-canvas-wrap { flex: 1 1 0% !important; position: relative !important; overflow: hidden !important; }
```

**Consequence:** `style.height`, `style.minHeight`, and other inline height overrides on these elements are ignored by the flex layout engine. The flex algorithm wins.

## What does NOT work

- `element.style.height = 'Xpx'` — ignored when `flex-grow: 1` is active
- `element.style.minHeight = '0'` — ignored if CommWise forces it
- Forcing a reflow via `display: none / ''` — does not recalculate flex children constrained by `!important`
- `DDS_CY.resize()` alone — resizes Cytoscape internally but does not change the flex layout

## What DOES work: `max-height`

The flex layout **respects `max-height`** even when `flex-grow: 1` is active. Setting `max-height` on a flex child constrains it without conflicting with `flex: 1 1 0% !important`.

**Pattern — constrain a flex child to stay within the viewport:**

```javascript
var el = document.getElementById('target-element');
var top = el.getBoundingClientRect().top;
el.style.maxHeight = Math.round(window.innerHeight - top) + 'px';
if (window.DDS_CY) DDS_CY.resize();
```

**When to use:** any time a panel, overlay, or section needs to stay within the visible viewport despite `flex-grow` pushing it beyond.

## Debugging layout issues

Use `getBoundingClientRect().bottom > window.innerHeight` to detect elements outside the viewport. Use `getComputedStyle(el).flex` to identify CommWise `!important` overrides before attempting JS fixes.

Use the Claude in Chrome MCP to run diagnostics live — see `claude-chrome-mcp.md`.

---

## Keywords
CommWise, flex, layout, max-height, viewport, CSS, override, conventions

---

## Index

| Terme | Occurrences |
|-------|-------------|

---

## Changelog

### Version 1.0 - Creation
**Date:** 2026-05-30
**Raison:** Convention layout CommWise — contraintes flex et solution max-height.

**Contenu initial :**
- Probleme : overrides !important CommWise sur flex
- Ce qui ne fonctionne pas (height, minHeight, reflow)
- Solution : max-height respecte flex-grow
- Pattern de debug avec getBoundingClientRect
