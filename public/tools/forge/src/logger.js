/**
 * logger.js
 *
 * Forge logger — pino instance configured from forge.config.json.
 *
 * Destination:
 *   "file"   → writes to logging.path (relative to forge.config.json)
 *   "stderr" → writes to stderr (safe for MCP stdout protocol)
 *
 * Usage:
 *   import { getLogger } from './logger.js';
 *   const log = getLogger('forge:my-module');
 *   log.info({ key: 'value' }, 'message');
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pino from 'pino';

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.resolve(__dirname, '..', 'forge.config.json');

// ---------------------------------------------------------------------------
// Load logging config
// ---------------------------------------------------------------------------

function loadLoggingConfig() {
  try {
    const raw    = fs.readFileSync(CONFIG_PATH, 'utf8');
    const config = JSON.parse(raw);
    return config.logging ?? {};
  } catch {
    return {};
  }
}

const loggingConfig = loadLoggingConfig();
const level = process.env.LOG_LEVEL ?? loggingConfig.level ?? 'info';
const destination   = loggingConfig.destination ?? 'stderr';
const logPath       = loggingConfig.path        ?? './forge.log';

// ---------------------------------------------------------------------------
// Build pino destination
// ---------------------------------------------------------------------------

function buildDestination() {
  if (destination === 'file') {
    const absPath = path.resolve(__dirname, '..', logPath);
    return pino.destination({ dest: absPath, sync: false });
  }
  // stderr — safe for MCP (stdout is reserved for MCP protocol)
  return pino.destination(2);
}

const dest = buildDestination();

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Returns a child logger bound to the given module name.
 * @param {string} name  e.g. 'forge:root-registry'
 */
export function getLogger(name) {
  return pino({ name, level }, dest);
}
