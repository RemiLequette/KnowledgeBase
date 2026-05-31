/**
 * md-doc.js
 *
 * Read, create, and update Markdown documents conforming to documentation convention.
 * Invoked by an AI Assistant via commands MCP. No human interaction.
 *
 * Args:
 *   read    <file> <json-input> <json-output>  -- read selected elements into json-output
 *   dump    <file> <json-output>               -- read all elements into json-output
 *   create  <file> <json-input>                -- create new conformant document
 *   update  <file> <json-input>                -- update elements in existing document
 *   check   <file>                             -- verify conformance
 *   restore <file>                             -- restore from backup
 *
 * stdout protocol:
 *   First line is always OK or ERROR:<code>:<message>
 *   On OK: subsequent lines are data (empty if none)
 *   On ERROR: no data follows
 *
 * Exit codes: 0 always (including applicative errors); 1 for unhandled crashes only
 */

'use strict';

const nodefs = require('fs');
const md     = require('./lib/md-parser');
const fs     = require('./lib/fs-scan');

// ---------------------------------------------------------------------------
// stdout protocol helpers
// ---------------------------------------------------------------------------

function ok(data) {
  if (data !== undefined && data !== null) {
    process.stdout.write('OK\n' + data + '\n');
  } else {
    process.stdout.write('OK\n');
  }
}

function error(code, message) {
  process.stdout.write('ERROR:' + code + ':' + message + '\n');
}

// ---------------------------------------------------------------------------
// Backup helpers
// ---------------------------------------------------------------------------

function backupPath(filePath) {
  return filePath + '.bak';
}

function createBackup(filePath) {
  try {
    nodefs.copyFileSync(filePath, backupPath(filePath));
  } catch (e) {
    throw new Error('Cannot create backup for ' + filePath + ': ' + e.message);
  }
}

// ---------------------------------------------------------------------------
// JSON file helpers
// ---------------------------------------------------------------------------

function readJsonFile(jsonPath) {
  const text = fs.readFile(jsonPath);
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error('Invalid JSON in ' + jsonPath + ': ' + e.message);
  }
}

function writeJsonFile(jsonPath, data) {
  fs.writeFile(jsonPath, JSON.stringify(data, null, 2));
}

// ---------------------------------------------------------------------------
// Element accessors -- "title" is special, others are section names
// ---------------------------------------------------------------------------

function getElement(doc, key) {
  if (key === 'title') return md.getTitle(doc);
  return md.getSection(doc, key);
}

function setElement(doc, key, value) {
  if (key === 'title') {
    if (value) md.setTitle(doc, value);
    // if value is empty, leave existing title unchanged
  } else {
    md.setSection(doc, key, value || '');
  }
}

// ---------------------------------------------------------------------------
// Canonical section order per documentation convention
// ---------------------------------------------------------------------------

const CANONICAL_ORDER = ['Quick Start', 'Keywords', 'Table des matieres'];

// ---------------------------------------------------------------------------
// Build an empty conformant doc structure (internal)
// ---------------------------------------------------------------------------

function buildEmpty(title) {
  // We parse an empty skeleton so the doc object is properly initialized
  const skeleton = '# ' + (title || '') + '\n\n## Quick Start\n\n## Keywords\n\n## Index\n\n## Changelog\n';
  return md.parseText(skeleton, '');
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

function cmdRead(filePath, jsonInputPath, jsonOutputPath) {
  if (!nodefs.existsSync(filePath))      return error('FILE_NOT_FOUND', filePath);
  if (!nodefs.existsSync(jsonInputPath)) return error('FILE_NOT_FOUND', jsonInputPath);

  const keys = readJsonFile(jsonInputPath);
  if (!Array.isArray(keys)) return error('INVALID_INPUT', 'json-input must be an array of strings');

  const doc = md.parseFile(filePath);
  const result = {};
  for (const key of keys) {
    result[key] = getElement(doc, key);
  }

  writeJsonFile(jsonOutputPath, result);
  ok(jsonOutputPath);
}

function cmdDump(filePath, jsonOutputPath) {
  if (!nodefs.existsSync(filePath)) return error('FILE_NOT_FOUND', filePath);

  const doc = md.parseFile(filePath);
  const result = { title: md.getTitle(doc) };
  for (const s of md.getSections(doc)) {
    result[s.name] = s.content;
  }

  writeJsonFile(jsonOutputPath, result);
  ok(jsonOutputPath);
}

function cmdCreate(filePath, jsonInputPath) {
  if (nodefs.existsSync(filePath))       return error('FILE_ALREADY_EXISTS', filePath);
  if (!nodefs.existsSync(jsonInputPath)) return error('FILE_NOT_FOUND', jsonInputPath);

  const data = readJsonFile(jsonInputPath);
  if (typeof data !== 'object' || Array.isArray(data)) {
    return error('INVALID_INPUT', 'json-input must be an object');
  }

  const doc = buildEmpty(data.title || '');

  // Insert in canonical order first, then remaining keys
  const inserted = new Set(['title']);
  for (const key of CANONICAL_ORDER) {
    if (key in data) {
      setElement(doc, key, data[key]);
      inserted.add(key);
    }
  }
  for (const key of Object.keys(data)) {
    if (!inserted.has(key)) {
      setElement(doc, key, data[key]);
    }
  }

  fs.writeFile(filePath, md.toMarkdown(doc));
  ok();
}

function cmdUpdate(filePath, jsonInputPath) {
  if (!nodefs.existsSync(filePath))      return error('FILE_NOT_FOUND', filePath);
  if (!nodefs.existsSync(jsonInputPath)) return error('FILE_NOT_FOUND', jsonInputPath);

  const data = readJsonFile(jsonInputPath);
  if (typeof data !== 'object' || Array.isArray(data)) {
    return error('INVALID_INPUT', 'json-input must be an object');
  }

  createBackup(filePath);

  const doc = md.parseFile(filePath);
  for (const [key, value] of Object.entries(data)) {
    setElement(doc, key, value);
  }

  fs.writeFile(filePath, md.toMarkdown(doc));
  ok();
}

function cmdCheck(filePath) {
  if (!nodefs.existsSync(filePath)) return error('FILE_NOT_FOUND', filePath);

  const doc    = md.parseFile(filePath);
  const issues = md.getIssues(doc);

  if (issues.length === 0) {
    ok();
  } else {
    process.stdout.write('OK\n' + issues.join('\n') + '\n');
  }
}

function cmdRestore(filePath) {
  const bak = backupPath(filePath);
  if (!nodefs.existsSync(bak)) return error('FILE_NOT_FOUND', bak);

  try {
    nodefs.copyFileSync(bak, filePath);
    nodefs.unlinkSync(bak);
  } catch (e) {
    return error('WRITE_ERROR', e.message);
  }
  ok();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const [,, command, ...args] = process.argv;

try {
  switch (command) {
    case 'read':
      if (args.length < 3) return error('MISSING_ARG', 'read requires <file> <json-input> <json-output>');
      cmdRead(args[0], args[1], args[2]);
      break;

    case 'dump':
      if (args.length < 2) return error('MISSING_ARG', 'dump requires <file> <json-output>');
      cmdDump(args[0], args[1]);
      break;

    case 'create':
      if (args.length < 2) return error('MISSING_ARG', 'create requires <file> <json-input>');
      cmdCreate(args[0], args[1]);
      break;

    case 'update':
      if (args.length < 2) return error('MISSING_ARG', 'update requires <file> <json-input>');
      cmdUpdate(args[0], args[1]);
      break;

    case 'check':
      if (args.length < 1) return error('MISSING_ARG', 'check requires <file>');
      cmdCheck(args[0]);
      break;

    case 'restore':
      if (args.length < 1) return error('MISSING_ARG', 'restore requires <file>');
      cmdRestore(args[0]);
      break;

    default:
      error('MISSING_ARG', 'Unknown command: ' + command);
  }
} catch (e) {
  error('WRITE_ERROR', e.message);
}
