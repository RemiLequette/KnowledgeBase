/**
 * logger.js
 *
 * Forge logger — writes timestamped log lines to forge.log.
 * ERROR level also writes to stderr.
 *
 * References:
 *   - conventions/forge.md v7.0 [section MCP tools — Error handling]
 *   - conventions/tools.md [section Module Design Rules]
 *
 * Not yet in references: none
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logPath = path.join(__dirname, '..', 'forge.log');

/**
 * Append a timestamped log line. ERROR lines also go to stderr.
 * @param {'INFO'|'WARN'|'ERROR'} level
 * @param {string} message
 */
export function log(level, message) {
  const line = `${new Date().toISOString()} [${level}] ${message}\n`;
  fs.appendFileSync(logPath, line);
  if (level === 'ERROR') console.error(line.trim());
}
