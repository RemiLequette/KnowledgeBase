# IndexedDB vs localStorage in file:// HTML pages

## Quick Start

Remplacement de localStorage par IndexedDB pour les pages HTML ouvertes en `file://`. Charger uniquement pour des projets avec des fichiers HTML standalone non servis par un serveur.

## Problem

`localStorage` is **blocked in Chrome when opening HTML files via `file://`** protocol. Chrome treats each `file://` URL as a unique security origin, making cross-page storage impossible and causing silent failures on same-page storage in some configurations.

## Solution: Use IndexedDB

IndexedDB works reliably in `file://` context. Use it as a drop-in replacement for patch/session persistence in standalone HTML tools.

## Reusable snippet

```javascript
// IndexedDB helper — works in file:// (unlike localStorage)
const _IDB_NAME = 'my-app', _IDB_STORE = 'patches';
let _idb = null;
async function idbOpen() {
  if (_idb) return _idb;
  return new Promise((res, rej) => {
    const r = indexedDB.open(_IDB_NAME, 1);
    r.onupgradeneeded = e => e.target.result.createObjectStore(_IDB_STORE);
    r.onsuccess = e => { _idb = e.target.result; res(_idb); };
    r.onerror = () => rej(r.error);
  });
}
async function idbSet(key, val) {
  try { const db = await idbOpen(); return new Promise((res, rej) => { const tx = db.transaction(_IDB_STORE,'readwrite'); tx.objectStore(_IDB_STORE).put(val, key); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); } catch(e) {}
}
async function idbGet(key) {
  try { const db = await idbOpen(); return new Promise((res, rej) => { const r = db.transaction(_IDB_STORE,'readonly').objectStore(_IDB_STORE).get(key); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); } catch(e) { return null; }
}
async function idbDel(key) {
  try { const db = await idbOpen(); return new Promise((res, rej) => { const tx = db.transaction(_IDB_STORE,'readwrite'); tx.objectStore(_IDB_STORE).delete(key); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); } catch(e) {}
}
```

## Migration from localStorage

| localStorage | IndexedDB equivalent |
|---|---|
| `localStorage.setItem(key, JSON.stringify(val))` | `idbSet(key, val)` — stores JS object directly, no JSON needed |
| `JSON.parse(localStorage.getItem(key))` | `await idbGet(key)` — returns JS object directly |
| `localStorage.removeItem(key)` | `idbDel(key)` |
| `try { ... } catch(e) {}` | already wrapped in idbSet/idbGet/idbDel |

**Key difference:** idbGet/idbDel are async — functions that call them must be `async` and use `await`.

## Naming convention (AfrSCM project)

| HTML file | IDB database name | Store | Key format |
|---|---|---|---|
| `ressources/engagements/index.html` | `afrscm-engagements` | `patches` | `afrscm-patch-engagements-YYYY-MM-DD` |
| `reunions/YYYY-MM-DD/index.html` | `afrscm-reunions` | `patches` | `afrscm-reunion-patch-YYYY-MM-DD` |

## Keywords
indexedDB, localStorage, file-protocol, browser-storage, persistence, patch, HTML, AfrSCM

---

## Index

| Terme | Occurrences |
|-------|-------------|

---

## Changelog

### Version 1.0 - Creation
**Date:** 2026-05-30
**Raison:** Convention IndexedDB pour pages HTML en file:// — localStorage bloque par Chrome.

**Contenu initial :**
- Probleme : localStorage bloque en file://
- Solution : IndexedDB avec snippet reutilisable
- Table de migration localStorage -> IndexedDB
- Convention de nommage (projet AfrSCM)
