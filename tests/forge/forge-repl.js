#!/usr/bin/env node
/**
 * forge-repl.js
 *
 * Interactive REPL for the Forge MCP server — development and debugging tool.
 * Maintains session state across commands: Brand registry and described flags
 * persist between commands exactly as they would in a real AI session.
 *
 * Usage (from knowledgebase/):
 *   node tests/forge/forge-repl.js
 *
 * Commands:
 *   ls [folder-fal]              List roots or folder contents
 *   describe <fal>               Describe artifact type (sets described flag)
 *   read <fal>                   Read artifact
 *   write <fal> <content>        Write artifact
 *   create <fal>                 Create new empty artifact
 *   mkdir <folder-fal>           Create folder
 *   rmdir <folder-fal>           Delete empty folder
 *   ping                         Connectivity check
 *   brand                        Show Brand registry contents
 *   described                    Show described types
 *   reset                        Clear Brand registry and described flags
 *   help                         Show this help
 *   exit / quit / Ctrl+D         Exit
 */

import readline from 'readline';
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
// Output helpers
// ---------------------------------------------------------------------------

const C = {
  reset:  '\x1b[0m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  dim:    '\x1b[2m',
};

function printOk(text)    { console.log(C.green + '✓' + C.reset + ' ' + text); }
function printErr(text)   { console.log(C.red   + '✗' + C.reset + ' ' + text); }
function printInfo(text)  { console.log(C.cyan  + '→' + C.reset + ' ' + text); }
function printDim(text)   { console.log(C.dim   + text + C.reset); }

function run(result) {
  if (result.isError) {
    const body = tryParse(result.content[0].text);
    printErr(body?.error ?? result.content[0].text);
    return null;
  }
  return result.content[0].text;
}

function tryParse(text) {
  try { return JSON.parse(text); } catch { return null; }
}

// ---------------------------------------------------------------------------
// Command handlers
// ---------------------------------------------------------------------------

async function cmdLs(args) {
  const fal    = args[0];
  const result = run(await dispatch('forge_ls', fal ? { fal } : {}, ctx));
  if (!result) return;
  const body = tryParse(result);
  if (body?.roots) {
    printInfo('Roots:');
    body.roots.forEach(r => console.log(`  ${C.yellow}${r.name}${C.reset}  ${C.dim}${r.url}${C.reset}`));
  } else {
    printInfo(`${body.count} entries in ${C.yellow}${body.fal}${C.reset}`);
    body.entries.forEach(e => {
      const branded = brandRegistry.has(e.fal) ? C.green + '✓' + C.reset : C.dim + '·' + C.reset;
      console.log(`  ${branded} [${e.type.padEnd(10)}]  ${e.fal}`);
    });
  }
}

async function cmdDescribe(args) {
  const fal = args[0];
  if (!fal) { printErr('describe requires a FAL'); return; }
  const result = run(await dispatch('forge_describe', { fal }, ctx));
  if (!result) return;
  const body = tryParse(result);
  console.log(`  ${C.cyan}recognition${C.reset}  ${body.recognition}`);
  console.log(`  ${C.cyan}capabilities${C.reset} read=${body.capabilities.read} write=${body.capabilities.write} blocks=${body.capabilities.blocks}`);
  console.log(`  ${C.cyan}usage${C.reset}        ${body.usage}`);
}

async function cmdRead(args) {
  const fal = args[0];
  if (!fal) { printErr('read requires a FAL'); return; }
  const result = run(await dispatch('forge_read', { fal }, ctx));
  if (result === null) return;
  console.log(result);
}

async function cmdWrite(args) {
  const fal     = args[0];
  const content = args.slice(1).join(' ');
  if (!fal || !content) { printErr('write requires a FAL and content'); return; }
  const result = run(await dispatch('forge_write', { fal, content }, ctx));
  if (!result) return;
  const body = tryParse(result);
  printOk(`wrote ${body.written} chars to ${fal}`);
}

async function cmdCreate(args) {
  const fal = args[0];
  if (!fal) { printErr('create requires a FAL'); return; }
  const result = run(await dispatch('forge_create', { fal }, ctx));
  if (result) printOk(`created ${fal}`);
}

async function cmdMkdir(args) {
  const fal = args[0];
  if (!fal) { printErr('mkdir requires a folder FAL'); return; }
  const result = run(await dispatch('forge_mkdir', { fal }, ctx));
  if (result) printOk(`created folder ${fal}`);
}

async function cmdRmdir(args) {
  const fal = args[0];
  if (!fal) { printErr('rmdir requires a folder FAL'); return; }
  const result = run(await dispatch('forge_rmdir', { fal }, ctx));
  if (result) printOk(`deleted folder ${fal}`);
}

async function cmdPing() {
  const result = run(await dispatch('forge_ping', {}, ctx));
  if (result) printOk(result);
}

function cmdBrand() {
  if (brandRegistry.size === 0) {
    printDim('Brand registry is empty');
    return;
  }
  printInfo(`${brandRegistry.size} branded FAL(s):`);
  for (const fal of [...brandRegistry].sort()) {
    console.log(`  ${C.green}✓${C.reset} ${fal}`);
  }
}

function cmdDescribed() {
  const types = [...typeRegistry.handlers.entries()];
  printInfo('Described flags:');
  for (const [name, entry] of types) {
    const flag = entry.described ? C.green + '✓' + C.reset : C.dim + '·' + C.reset;
    console.log(`  ${flag} ${name}`);
  }
}

function cmdReset() {
  brandRegistry.clear();
  for (const entry of typeRegistry.handlers.values()) entry.described = false;
  printOk('Session reset — Brand registry cleared, all types undescribed');
}

function cmdHelp() {
  console.log(`
${C.cyan}Forge REPL${C.reset} — session state persists between commands

${C.yellow}Navigation${C.reset}
  ls [folder-fal]          List roots or folder contents
  describe <fal>           Describe artifact type (sets described flag)

${C.yellow}Artifact ops${C.reset}
  read <fal>               Read artifact  [Brand + RTFM required]
  write <fal> <content>    Write artifact [Brand + RTFM required]
  create <fal>             Create new empty artifact
  mkdir <folder-fal>       Create folder
  rmdir <folder-fal>       Delete empty folder

${C.yellow}Session${C.reset}
  brand                    Show Brand registry
  described                Show described types
  reset                    Clear Brand registry and described flags
  ping                     Connectivity check

${C.yellow}REPL${C.reset}
  help                     This help
  exit / quit / Ctrl+D     Exit
`);
}

// ---------------------------------------------------------------------------
// REPL loop
// ---------------------------------------------------------------------------

const rl = readline.createInterface({
  input:  process.stdin,
  output: process.stdout,
  prompt: `${C.cyan}forge>${C.reset} `,
});

console.log(`${C.cyan}Forge REPL${C.reset} ${C.dim}— type help for commands, Ctrl+D to exit${C.reset}`);
rl.prompt();

rl.on('line', async (line) => {
  const trimmed = line.trim();
  if (!trimmed) { rl.prompt(); return; }

  const [cmd, ...args] = trimmed.split(/\s+/);

  switch (cmd) {
    case 'ls':        await cmdLs(args);       break;
    case 'describe':  await cmdDescribe(args); break;
    case 'read':      await cmdRead(args);     break;
    case 'write':     await cmdWrite(args);    break;
    case 'create':    await cmdCreate(args);   break;
    case 'mkdir':     await cmdMkdir(args);    break;
    case 'rmdir':     await cmdRmdir(args);    break;
    case 'ping':      await cmdPing();         break;
    case 'brand':     cmdBrand();              break;
    case 'described': cmdDescribed();          break;
    case 'reset':     cmdReset();              break;
    case 'help':      cmdHelp();               break;
    case 'exit':
    case 'quit':      rl.close(); return;
    default:          printErr(`Unknown command: ${cmd} — type help`);
  }

  rl.prompt();
});

rl.on('close', () => {
  console.log(`\n${C.dim}bye${C.reset}`);
  process.exit(0);
});
