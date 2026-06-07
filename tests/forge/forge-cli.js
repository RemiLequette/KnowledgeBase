#!/usr/bin/env node
/**
 * forge-cli.js
 *
 * Interactive CLI for the Forge MCP server — development and debugging tool.
 * Simulates the full MCP dispatch cycle: forge_ls brands FALs, forge_describe
 * unlocks types, forge_read/write enforce Brand + RTFM gates.
 *
 * Usage (from knowledgebase/):
 *   node tests/forge/forge-cli.js <command> [args...]
 *
 * Commands:
 *   ls [folder-fal]                     List roots or folder contents
 *   describe <fal>                      Describe artifact type
 *   read <fal>                          Read artifact (runs ls + describe first)
 *   write <fal> <content>               Write artifact (runs ls + describe first)
 *   create <fal>                        Create new empty artifact
 *   mkdir <fal>                         Create folder
 *   rmdir <fal>                         Delete empty folder
 *   ping                                Connectivity check
 *
 * The CLI auto-runs forge_ls before read/write to satisfy the Brand gate,
 * and auto-runs forge_describe to satisfy the RTFM gate.
 * This mirrors the workflow an AI Assistant follows.
 */

import { TypeRegistry, RootRegistry, testConfig } from '../../public/tools/forge/forge.js';
import { brandRegistry } from '../../public/tools/forge/src/brand.js';
import { dispatch } from '../../public/tools/forge/src/mcp-tools.js';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

brandRegistry.clear();

const typeRegistry = new TypeRegistry();
await typeRegistry.load(testConfig.types);

const rootRegistry = new RootRegistry();
await rootRegistry.load(testConfig.roots);

const ctx = { typeRegistry, rootRegistry, config: testConfig };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ok(result) {
  if (result.isError) {
    const body = JSON.parse(result.content[0].text);
    console.error('ERROR:', body.error);
    process.exit(1);
  }
  return result.content[0].text;
}

/**
 * Ensure a FAL is branded and its type described — run ls on parent folder
 * and describe if not already done.
 */
async function ensureReady(fal) {
  if (!brandRegistry.has(fal)) {
    // derive parent folder FAL
    const lastSlash = fal.lastIndexOf('/', fal.length - 2);
    const folderFal = lastSlash === -1 ? 'forge://test/' : fal.slice(0, lastSlash + 1);
    process.stderr.write(`[auto] forge_ls ${folderFal}\n`);
    ok(await dispatch('forge_ls', { fal: folderFal }, ctx));
  }
  // derive type from FAL extension
  const dot = fal.lastIndexOf('.');
  const typeName = dot === -1 ? '' : fal.slice(dot + 1);
  if (typeName && !typeRegistry.isDescribed(typeName)) {
    process.stderr.write(`[auto] forge_describe ${fal}\n`);
    ok(await dispatch('forge_describe', { fal }, ctx));
  }
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

const [,, cmd, ...rest] = process.argv;

if (!cmd || cmd === 'help') {
  console.log(`Usage: node tests/forge/forge-cli.js <command> [args]

Commands:
  ping                         Connectivity check
  ls [folder-fal]              List roots or folder contents
  describe <fal>               Describe artifact type
  read <fal>                   Read artifact
  write <fal> <content>        Write artifact
  create <fal>                 Create new empty artifact
  mkdir <folder-fal>           Create folder
  rmdir <folder-fal>           Delete empty folder
`);
  process.exit(0);
}

if (cmd === 'ping') {
  console.log(ok(await dispatch('forge_ping', {}, ctx)));

} else if (cmd === 'ls') {
  const fal = rest[0];
  const result = ok(await dispatch('forge_ls', fal ? { fal } : {}, ctx));
  const body = JSON.parse(result);
  if (body.roots) {
    console.log('Roots:');
    body.roots.forEach(r => console.log(`  ${r.name}  ${r.url}`));
  } else {
    console.log(`${body.count} entries in ${body.fal}`);
    body.entries.forEach(e => console.log(`  [${e.type.padEnd(10)}]  ${e.fal}`));
  }

} else if (cmd === 'describe') {
  const [fal] = rest;
  if (!fal) { console.error('describe requires a FAL'); process.exit(1); }
  const result = ok(await dispatch('forge_describe', { fal }, ctx));
  console.log(result);

} else if (cmd === 'read') {
  const [fal] = rest;
  if (!fal) { console.error('read requires a FAL'); process.exit(1); }
  await ensureReady(fal);
  const content = ok(await dispatch('forge_read', { fal }, ctx));
  console.log(content);

} else if (cmd === 'write') {
  const [fal, content] = rest;
  if (!fal || content === undefined) { console.error('write requires a FAL and content'); process.exit(1); }
  await ensureReady(fal);
  const result = ok(await dispatch('forge_write', { fal, content }, ctx));
  console.log(result);

} else if (cmd === 'create') {
  const [fal] = rest;
  if (!fal) { console.error('create requires a FAL'); process.exit(1); }
  const result = ok(await dispatch('forge_create', { fal }, ctx));
  console.log(result);

} else if (cmd === 'mkdir') {
  const [fal] = rest;
  if (!fal) { console.error('mkdir requires a folder FAL'); process.exit(1); }
  const result = ok(await dispatch('forge_mkdir', { fal }, ctx));
  console.log(result);

} else if (cmd === 'rmdir') {
  const [fal] = rest;
  if (!fal) { console.error('rmdir requires a folder FAL'); process.exit(1); }
  const result = ok(await dispatch('forge_rmdir', { fal }, ctx));
  console.log(result);

} else {
  console.error(`Unknown command: ${cmd}`);
  process.exit(1);
}
