/**
 * local-server.js — Shared local development server
 *
 * Pure HTTP wrapper over tools/lib/server-core.js.
 * No business logic — reads, writes, deletes, and lists files only.
 *
 * Also exposes:
 *   POST /forge        — proxy to the Forge MCP dispatcher
 *   POST /forge-reload — hot-reload Forge registries from JSON config
 *
 * Forge is loaded via dynamic import() at startup (forge.js is ESM).
 * TypeRegistry and RootRegistry come from forge.js re-exports.
 * dispatch() is imported directly from src/mcp-tools.js (not re-exported by forge.js).
 * Hot-reload reconstructs TypeRegistry + RootRegistry from the JSON files.
 * Handler JS modules are NOT reloaded (ESM cache) — only registry JSON changes
 * are picked up.
 *
 * Usage:
 *   node tools/local-server.js <root1> [<root2> ...] [--port <port>]
 *
 * See conventions/local-server.md for the full specification.
 */

const http = require('http');
const path = require('path');
const url  = require('url');
const core = require('./lib/server-core');

// ---------------------------------------------------------------------------
// Configuration from CLI arguments
// ---------------------------------------------------------------------------

const args         = process.argv.slice(2);
const allowedRoots = core.parseAllowedRoots(args);
const PORT         = core.parsePort(args);

if (allowedRoots.length === 0) {
  console.error('Error: at least one allowed root path is required.');
  console.error('Usage: node local-server.js <root1> [<root2> ...] [--port <port>]');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Content-Type map
// ---------------------------------------------------------------------------

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
};

function contentTypeFor(filePath) {
  return CONTENT_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function send(res, status, body, contentType) {
  const isString = typeof body === 'string';
  const data     = isString ? body : JSON.stringify(body);
  const ct       = contentType || 'application/json; charset=utf-8';
  res.writeHead(status, { 'Content-Type': ct, ...CORS_HEADERS });
  res.end(data);
}

function sendResult(res, result, contentType) {
  if (result.status === 200 && result.content !== undefined) {
    send(res, 200, result.content, contentType);
  } else if (result.status === 200) {
    send(res, 200, { ok: true });
  } else {
    send(res, result.status, { error: result.error || 'Unknown error' });
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end',  () => resolve(data));
    req.on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// Forge proxy
// TypeRegistry + RootRegistry from forge.js re-exports.
// dispatch() imported directly from src/mcp-tools.js (not re-exported by forge.js).
// forgeCtx is replaced on every reload.
// ---------------------------------------------------------------------------

let forgeCtx        = null;
let forgeMod        = null; // { TypeRegistry, RootRegistry } from forge.js
let forgeDispatch   = null; // dispatch() from src/mcp-tools.js
let forgeConfigPath = null;

async function loadForgeMods() {
  if (forgeMod && forgeDispatch) return;

  const forgeDir    = path.resolve(__dirname, 'forge');
  const forgeJsUrl  = 'file:///' + path.join(forgeDir, 'forge.js').replace(/\\/g, '/');
  const mcpToolsUrl = 'file:///' + path.join(forgeDir, 'src', 'mcp-tools.js').replace(/\\/g, '/');

  const [mod, toolsMod] = await Promise.all([
    import(forgeJsUrl),
    import(mcpToolsUrl)
  ]);

  forgeMod        = mod;               // .TypeRegistry, .RootRegistry
  forgeDispatch   = toolsMod.dispatch;
  forgeConfigPath = path.join(forgeDir, 'forge.config.json');
}

async function reloadForge() {
  const fs = require('fs');

  await loadForgeMods();

  const { TypeRegistry, RootRegistry } = forgeMod;

  if (!fs.existsSync(forgeConfigPath)) {
    throw new Error(`forge.config.json not found at ${forgeConfigPath}`);
  }

  const config       = JSON.parse(fs.readFileSync(forgeConfigPath, 'utf8'));
  const typeRegistry = new TypeRegistry();
  const rootRegistry = new RootRegistry();

  await typeRegistry.load(config.types);
  await rootRegistry.load(config.roots);

  forgeCtx = { typeRegistry, rootRegistry, config, dispatch: forgeDispatch };

  const types = [...typeRegistry.handlers.keys()];
  const roots = config.roots.map(r => r.name);
  return { types, roots };
}

async function initForge() {
  try {
    const { types, roots } = await reloadForge();
    console.log(`[forge] Forge proxy ready — ${roots.length} root(s): ${roots.join(', ')} — ${types.length} type(s): ${types.join(', ')}`);
  } catch (err) {
    console.warn('[forge] Could not initialise Forge proxy: ' + err.message);
  }
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

const server = http.createServer(async (req, res) => {
  const parsed   = url.parse(req.url, true);
  const pathname = parsed.pathname;
  const query    = parsed.query;
  const method   = req.method.toUpperCase();

  // Preflight CORS
  if (method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    return res.end();
  }

  // GET /ping
  if (method === 'GET' && pathname === '/ping') {
    return send(res, 200, { ok: true });
  }

  // POST /forge — Forge tool proxy
  if (method === 'POST' && pathname === '/forge') {
    if (!forgeCtx) {
      return send(res, 503, { error: 'Forge proxy not available' });
    }
    let body;
    try {
      body = JSON.parse(await readBody(req));
    } catch {
      return send(res, 400, { error: 'Invalid JSON body' });
    }
    const { tool, args: toolArgs = {} } = body;
    if (!tool) {
      return send(res, 400, { error: 'Missing field: tool' });
    }
    try {
      const result = await forgeCtx.dispatch(tool, toolArgs, forgeCtx);
      return send(res, 200, result);
    } catch (err) {
      return send(res, 500, { error: err.message });
    }
  }

  // POST /forge-reload — hot-reload Forge registries from JSON
  if (method === 'POST' && pathname === '/forge-reload') {
    try {
      const { types, roots } = await reloadForge();
      console.log(`[forge] Reloaded — ${roots.length} root(s), ${types.length} type(s)`);
      return send(res, 200, { ok: true, roots, types });
    } catch (err) {
      console.warn('[forge] Reload failed: ' + err.message);
      return send(res, 500, { error: err.message });
    }
  }

  // /file — read, write, delete
  if (pathname === '/file') {
    if (!query.path) {
      return send(res, 400, { error: 'Missing parameter: path' });
    }

    if (method === 'GET') {
      const result = core.readFile(query.path, allowedRoots);
      return sendResult(res, result, contentTypeFor(query.path));
    }

    if (method === 'POST') {
      const body   = await readBody(req);
      const result = core.writeFile(query.path, body, allowedRoots);
      return sendResult(res, result);
    }

    if (method === 'DELETE') {
      const result = core.deleteFile(query.path, allowedRoots);
      return sendResult(res, result);
    }
  }

  // GET /dir — list directory
  if (method === 'GET' && pathname === '/dir') {
    if (!query.path) {
      return send(res, 400, { error: 'Missing parameter: path' });
    }
    const result = core.listDir(query.path, allowedRoots);
    if (result.status === 200) {
      return send(res, 200, { entries: result.entries });
    }
    return send(res, result.status, { error: result.error });
  }

  // GET /* — static file serving (absolute path in URL)
  if (method === 'GET') {
    const filePath = decodeURIComponent(pathname.replace(/^\//, ''));
    const result   = core.readFile(filePath, allowedRoots);
    return sendResult(res, result, contentTypeFor(filePath));
  }

  send(res, 404, { error: 'Unknown route' });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

server.listen(PORT, '127.0.0.1', async () => {
  console.log('');
  console.log('Local server started on http://localhost:' + PORT);
  console.log('Allowed roots:');
  allowedRoots.forEach(r => console.log('  ' + r));
  console.log('');
  console.log('Ctrl+C to stop.');
  console.log('');

  await initForge();
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error('Error: port ' + PORT + ' is already in use. A server may already be running.');
  } else {
    console.error('Server error: ' + err.message);
  }
  process.exit(1);
});
