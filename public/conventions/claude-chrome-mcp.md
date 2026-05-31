# Claude in Chrome MCP

## Quick Start

Convention pour le diagnostic DOM et la validation de fixes JS en live via Chrome. Charger quand un bug visuel est difficile à diagnostiquer depuis le code seul, ou pour tester un fix avant de l'écrire.

## What it is

The `Claude in Chrome` MCP connector gives Claude direct access to a live Chrome browser via a Chrome extension. It enables DOM inspection, JavaScript execution, and visual debugging without the developer opening DevTools manually.

## When to use it

- A visual bug is hard to diagnose from code alone (layout, positioning, visibility)
- You need to test a fix live before writing it to CommWise
- You want to run multiple diagnostic JS snippets iteratively
- The developer is present and can navigate/interact with the app

## Workflow

1. `list_connected_browsers` — see which browsers are connected
2. `select_browser` — connect to the right one (or ask the user)
3. `tabs_context_mcp` with `createIfEmpty: true` — get a tab ID
4. Have the developer navigate to the app manually (navigation to CommWise is permission-blocked)
5. `javascript_tool` — run diagnostic or validation JS in the page context

## Key constraints

- **Navigation to CommWise is permission-blocked** — Claude cannot navigate to `commwise.b2wise.com`. The developer must open the page manually in the MCP tab.
- **`getEventListeners()`** is unavailable in the page context (it's a DevTools API only).
- **Cross-origin iframes** — if the app runs inside an iframe, `javascript_tool` may be blocked depending on origin. DDScope runs as a full page, not inside an iframe — JS access works.
- Use `browser_batch` to chain multiple steps in one round trip when you can predict the sequence.

## Diagnostic patterns

**Check if an element is outside the viewport:**
```javascript
var el = document.getElementById('my-element');
var rect = el.getBoundingClientRect();
({ bottom: rect.bottom, viewportH: window.innerHeight, outOfView: rect.bottom > window.innerHeight })
```

**Find what element is at a given point (e.g. center of a container):**
```javascript
var rect = document.getElementById('container').getBoundingClientRect();
var el = document.elementFromPoint(rect.left + rect.width/2, rect.top + rect.height/2);
({ tag: el.tagName, id: el.id, class: el.className })
```

**Check computed styles and flex properties:**
```javascript
var el = document.getElementById('target');
({ flex: getComputedStyle(el).flex, minHeight: getComputedStyle(el).minHeight, overflow: getComputedStyle(el).overflow })
```

**Test a fix live before writing to CommWise:**
```javascript
// Apply fix inline
document.getElementById('target').style.maxHeight = '500px';
// Verify result
document.getElementById('target').getBoundingClientRect().bottom
```

## Value

Live JS execution eliminates guesswork on layout bugs. A diagnostic that would take 10 back-and-forth exchanges (describe → guess → fix → test) can be resolved in 2-3 `javascript_tool` calls.

---

## Keywords
Chrome, MCP, browser, DOM, debug, javascript, inspect, layout, conventions

---

## Index

| Terme | Occurrences |
|-------|-------------|

---

## Changelog

### Version 1.0 - Creation
**Date:** 2026-05-30
**Raison:** Convention Claude in Chrome MCP — diagnostic DOM et validation de fixes JS en live.

**Contenu initial :**
- Workflow de connexion au browser
- Contraintes (navigation bloquee, getEventListeners indisponible)
- Patterns de diagnostic JS
- Valeur : elimine les allers-retours de diagnostic
