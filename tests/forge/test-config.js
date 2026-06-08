/**
 * test-config.js
 *
 * Single configuration point for all Forge unit tests.
 *
 * Two paths to adjust if things move:
 *   FORGE_DIR  — path to public/tools/forge/ (the Forge implementation)
 *   FIXTURES   — path to the test fixtures folder (local to the tests)
 *
 * All test files import testConfig and createSession from here.
 * forge.js is never imported by tests.
 */

import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FORGE_DIR = path.resolve(__dirname, '../../public/tools/forge');
const FIXTURES  = path.join(__dirname, 'fixtures');

export const testConfig = {
  roots: [
    {
      name:    'test',
      url:     pathToFileURL(FIXTURES).href + '/',
      handler: pathToFileURL(path.join(FORGE_DIR, 'handlers/file-root.js')).href
    }
  ],
  types: pathToFileURL(path.join(FORGE_DIR, 'forge-types.json')).href
};

export { createSession } from '../../public/tools/forge/src/forge-api.js';
