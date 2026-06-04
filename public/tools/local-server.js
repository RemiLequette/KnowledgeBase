/**
 * local-server.js — Shared local development server
 *
 * Pure HTTP wrapper over tools/lib/server-core.js.
 * No business logic — reads, writes, deletes, and lists files only.
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
    // Strip leading slash to get the absolute path (e.g. /C:/Users/... -> C:/Users/...)
    const filePath = decodeURIComponent(pathname.replace(/^\//, ''));
    const result   = core.readFile(filePath, allowedRoots);
    return sendResult(res, result, contentTypeFor(filePath));
  }

  send(res, 404, { error: 'Unknown route' });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

server.listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('Local server started on http://localhost:' + PORT);
  console.log('Allowed roots:');
  allowedRoots.forEach(r => console.log('  ' + r));
  console.log('');
  console.log('Ctrl+C to stop.');
  console.log('');
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error('Error: port ' + PORT + ' is already in use. A server may already be running.');
  } else {
    console.error('Server error: ' + err.message);
  }
  process.exit(1);
});
