# Local Server Convention

Generic HTTP server shared across all projects — file access and static serving.

*Document type: Convention — see `conventions/documentation-style.md`*

## Quick Start

Convention for the shared local development server (`tools/local-server.js`).
Covers: why a local server is needed, the server model (allowed roots, pure HTTP),
the full API contract, how projects use it, and the startup batch.
Load when implementing or modifying the server, writing project HTML pages that use it,
or setting up a new project that needs local file access.
Does not cover project-specific logic — that belongs in the project's own spec.

## Keywords
local-server, HTTP, file-access, static-serving, allowed-roots, API, ping, CORS,
multi-project, development, Node.js, batch, convention

## Table of Contents

1. [Why a local server](#why-a-local-server)
2. [Model](#model)
3. [Startup](#startup)
4. [API Contract](#api-contract)
5. [How projects use the server](#how-projects-use-the-server)
6. [Security](#security)
7. [What the server does not do](#what-the-server-does-not-do)
8. [Index](#index)

## Why a local server
[up](#table-of-contents)

Browsers block local file access from HTML pages opened via `file://` protocol:
- `fetch()` calls to other local files fail (CORS / same-origin restrictions)
- There is no way to write files from the browser

A local HTTP server solves both problems: all pages are served from the same origin
(`http://localhost:3000`), fetch works normally, and the server exposes write endpoints.

A **single shared server** is preferable to one server per project:
- One process to start at laptop boot, not one per project
- No port conflicts when working on multiple projects in parallel
- The server is generic — no project-specific knowledge embedded in it

## Model
[up](#table-of-contents)

### Pure HTTP server

The server is a **pure infrastructure layer**. It knows nothing about artifacts,
revisions, JSON schemas, or business rules. It only reads, writes, deletes, and lists files.

Project-specific logic (which files to fetch, how to name them, what to validate)
lives in the HTML pages and project scripts — not in the server.

### Allowed roots

The server restricts file access to a configurable list of **allowed roots** —
absolute paths to directories the server is permitted to read and write.

Any request targeting a path outside all allowed roots is rejected with `403 Forbidden`.

Allowed roots are passed as command-line arguments at startup:

```
node tools/local-server.js "C:/Users/Remi/Dropbox" "C:/Users/Remi/GoogleDrive" "D:/Projects"
```

This mirrors the MCP filesystem server model — explicit allowlist, no implicit access.

### URL scheme for static files

Projects are accessed via their absolute path encoded in the URL:

```
http://localhost:3000/C:/Users/Remi/Dropbox/AfrSCM/AssistantIA/reunions/index.html
```

The browser resolves all relative `fetch()` calls from this page using the same base URL.
No path configuration is needed in the HTML pages themselves — standard browser URL resolution handles it.

## Startup
[up](#table-of-contents)

### Command

```
node tools/local-server.js <root1> [<root2> ...] [--port <port>]
```

- `<root1>`, `<root2>`, ... — absolute paths to allowed roots (at least one required)
- `--port` — optional, defaults to `3000`

### Batch file

`tools/start-server.bat` is the standard Windows launcher. It defines the allowed roots
for the current machine and starts the server.

Edit `start-server.bat` to add or remove roots for your environment:

```bat
@echo off
node "%~dp0local-server.js" ^
  "C:\Users\Remi\Dropbox" ^
  "C:\Users\Remi\GoogleDrive" ^
  "C:\Users\Remi\OneDrive" ^
  --port 3000
pause
```

Place a shortcut to `start-server.bat` in the Windows Startup folder to launch it at boot.

### Confirmation output

```
Local server started on http://localhost:3000
Allowed roots:
  C:\Users\Remi\Dropbox
  C:\Users\Remi\GoogleDrive
  C:\Users\Remi\OneDrive
Ctrl+C to stop.
```

### Port conflict

If port 3000 is already in use, the server exits with:
```
Error: port 3000 is already in use. A server may already be running.
```

## API Contract
[up](#table-of-contents)

All paths in `path=` and `dir=` parameters are **absolute paths** on the local filesystem.
The server validates each path against the allowed roots before acting.

CORS headers are set on every response (`Access-Control-Allow-Origin: *`) so that pages
served from `http://localhost:3000` can call the API endpoints without restriction.

---

### GET /ping

Server availability check. Used by HTML pages on load.

**Request:**
```
GET http://localhost:3000/ping
```

**Response:**
- `200` + `{ "ok": true }`

---

### GET /file

Read a file from disk.

**Request:**
```
GET http://localhost:3000/file?path=C:/Users/Remi/Dropbox/AfrSCM/historique/data-2026-05-27.json
```

**Responses:**
- `200` + file content with appropriate `Content-Type`
- `400` + `{ "error": "Missing parameter: path" }` — parameter absent
- `403` + `{ "error": "Access denied" }` — path outside allowed roots
- `404` + `{ "error": "File not found" }` — file does not exist

---

### POST /file

Write or overwrite a file on disk. Creates intermediate directories if needed.
Body is written as-is — no validation by the server.

**Request:**
```
POST http://localhost:3000/file?path=C:/Users/Remi/Dropbox/AfrSCM/historique/changes-2026-05-27.json
Content-Type: application/json

{ ...content... }
```

**Responses:**
- `200` + `{ "ok": true }` — write succeeded
- `400` + `{ "error": "Missing parameter: path" }` — parameter absent
- `403` + `{ "error": "Access denied" }` — path outside allowed roots
- `500` + `{ "error": "..." }` — write failed (permissions, disk full, etc.)

---

### DELETE /file

Delete a file from disk. Idempotent — returns `200` even if the file did not exist.

**Request:**
```
DELETE http://localhost:3000/file?path=C:/Users/Remi/Dropbox/AfrSCM/historique/changes-2026-05-27.json
```

**Responses:**
- `200` + `{ "ok": true }`
- `400` + `{ "error": "Missing parameter: path" }` — parameter absent
- `403` + `{ "error": "Access denied" }` — path outside allowed roots
- `500` + `{ "error": "..." }` — deletion failed

---

### GET /dir

List the contents of a directory.

**Request:**
```
GET http://localhost:3000/dir?path=C:/Users/Remi/Dropbox/AfrSCM/historique
```

**Response body:**
```json
{
  "entries": [
    { "name": "data-2026-05-27.json", "type": "file" },
    { "name": "data-2026-06-01.json", "type": "file" },
    { "name": "changes-2026-06-01.json", "type": "file" },
    { "name": "subdir", "type": "dir" }
  ]
}
```

Entries are sorted alphabetically by name. Subdirectories are included with `"type": "dir"`.

**Responses:**
- `200` + `{ "entries": [...] }`
- `200` + `{ "entries": [] }` — directory exists but is empty
- `400` + `{ "error": "Missing parameter: path" }` — parameter absent
- `403` + `{ "error": "Access denied" }` — path outside allowed roots
- `404` + `{ "error": "Directory not found" }` — path does not exist

---

### GET /*

Serve a static file by its absolute path encoded in the URL.

**Request:**
```
GET http://localhost:3000/C:/Users/Remi/Dropbox/AfrSCM/AssistantIA/index.html
```

The server strips the leading `/`, reconstructs the absolute path, validates against
allowed roots, and serves the file with the appropriate `Content-Type`.

**Supported types:** `.html`, `.js`, `.json`, `.css`, `.png`, `.ico`

**Responses:**
- `200` + file content
- `403` + `{ "error": "Access denied" }` — path outside allowed roots
- `404` + `{ "error": "File not found" }` — file does not exist

---

### OPTIONS (preflight CORS)

**Response:** `204` with CORS headers. Handles browser preflight requests transparently.

## How projects use the server
[up](#table-of-contents)

### Bootstrap file

Each project has a small bootstrap HTML file (e.g. `Comite RSE.html`) that:
1. Checks server availability via `GET /ping`
2. If available: redirects to `http://localhost:3000/<absolute-path-to-project>/index.html`
3. If unavailable: displays "Start the local server before opening this file"

The bootstrap file is the **only file opened directly via `file://`**.
All project pages are then served via `http://localhost:3000/...` and can use `fetch()` freely.

### Building API paths in pages

Pages construct absolute paths for `/file` and `/dir` calls from their own URL:

```javascript
// Extract absolute path base from current page URL
// http://localhost:3000/C:/Users/Remi/Dropbox/AfrSCM/reunions/index.html
// -> base = "C:/Users/Remi/Dropbox/AfrSCM/reunions/"
const base = window.location.pathname.replace(/^\//, '').replace(/[^/]+$/, '');

// Build an API call
fetch(`/file?path=${base}historique/data-2026-05-27.json`);
```

Relative `fetch()` calls for static assets (scripts, CSS, other HTML pages) work
without any special handling — the browser resolves them automatically.

### Availability indicator

Each project HTML page should display a discrete status indicator reflecting server state:

| State | Display | Meaning |
|-------|---------|---------|
| Connected | green dot | Server available, saves active |
| Disconnected | orange dot | Server absent — changes not saved |
| Error | red dot | Server reachable but write failed |

## Security
[up](#table-of-contents)

### Path traversal prevention

Every path (from `path=`, `dir=`, or the static file URL) is resolved to an absolute
path and checked against the allowed roots list before any filesystem operation.
A path that does not start with one of the allowed roots returns `403` immediately —
no filesystem access occurs.

### Local only

The server binds to `127.0.0.1` only — not accessible from other machines on the network.

### No authentication

The server has no authentication mechanism. It is intended for single-user local
development only. Do not expose it to a network.

## What the server does not do
[up](#table-of-contents)

- No JSON validation — body is written as-is
- No business logic — no knowledge of artifacts, revisions, or schemas
- No file filtering — `/dir` returns all entries; filtering by name pattern is the caller's responsibility
- No authentication
- No automatic startup — must be launched manually (or via Startup folder shortcut)

## Index

| Term | Occurrences |
|------|-------------|

## Changelog

### Version 1.0 - Creation
**Date:** 2026-06-04
**Reason:** Generic local server convention extracted from AfrSCM project.
Covers shared server model, allowed roots, pure HTTP API, project usage pattern.

**Content:**
- Why a local server (file:// restrictions, single shared server)
- Model (pure HTTP, allowed roots, URL scheme)
- Startup (command, batch, confirmation, port conflict)
- API Contract (/ping, /file GET/POST/DELETE, /dir, GET /*, OPTIONS)
- How projects use the server (bootstrap, path building, availability indicator)
- Security (path traversal, local only, no auth)
- What the server does not do
