#!/usr/bin/env node
/**
 * forge-run.js
 *
 * Test runner for Forge — runs all test files and shows only failures.
 * With --verbose / -v : shows all results including PASS.
 *
 * Usage (from knowledgebase/):
 *   node tests/forge/forge-run.js           # failures only
 *   node tests/forge/forge-run.js -v        # all results
 *   node tests/forge/forge-run.js <file>    # single file, failures only
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ALL_TESTS = [
  'forge-fal.test.js',
  'file-root.test.js',
  'plain-text.test.js',
  'structured-text.test.js',
  'type-registry.test.js',
  'forge-rtfm.test.js',
  'forge-brand.test.js',
  'integration.test.js',
];

const args    = process.argv.slice(2);
const verbose = args.includes('--verbose') || args.includes('-v');
const files   = args.filter(a => !a.startsWith('-'));
const targets = files.length ? files : ALL_TESTS;

let totalPass = 0;
let totalFail = 0;

for (const file of targets) {
  const filePath = path.join(__dirname, file);
  await new Promise((resolve) => {
    const child = spawn(process.execPath, [filePath], { env: process.env });
    let output = '';

    child.stdout.on('data', d => { output += d.toString(); });
    child.stderr.on('data', () => {}); // suppress forge log lines

    child.on('close', (code) => {
      const lines  = output.split('\n').filter(Boolean);
      const passes = lines.filter(l => l.startsWith('PASS:'));
      const fails  = lines.filter(l => l.startsWith('FAIL:'));

      totalPass += passes.length;
      totalFail += fails.length;

      const label = fails.length
        ? `\x1b[31m✗\x1b[0m ${file} — ${fails.length} failed`
        : `\x1b[32m✓\x1b[0m ${file}`;

      console.log(label);

      if (verbose) {
        passes.forEach(l => console.log('  \x1b[2m' + l + '\x1b[0m'));
      }
      fails.forEach(l => console.log('  \x1b[31m' + l + '\x1b[0m'));

      resolve();
    });
  });
}

console.log(`\n${totalPass} passed, ${totalFail} failed`);
process.exit(totalFail > 0 ? 1 : 0);
