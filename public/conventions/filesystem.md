# Filesystem MCP Convention

## Quick Start

Convention pour les opérations sur fichiers locaux Windows. Charger pour tout travail avec des fichiers : lecture, écriture, copie, remplacement. Définit quel outil utiliser selon le type d'opération (filesystem / edit-file-lines / node).

## Rule
- **Read operations** → use `filesystem` MCP
- **Write operations** → use `edit-file-lines` MCP
- **Mechanical file operations** (copy, regex replace) → use `node` via `commands` MCP (zero tokens, no approval required)

## Rationale
Separation of concerns between read and write access.
Reduces risk of unintended modifications during read-only tasks.

`filesystem` reads raw text directly — faster and lower token consumption.
`edit-file-lines` provides robustness and efficiency for write operations (streaming, retry, verification, backup).

## Tools
### filesystem (read)
list_directory, read_file, read_text_file, read_multiple_files, get_file_info, directory_tree, search_files

### edit-file-lines (write)
fast_write_file, fast_large_write_file, fast_edit_block, fast_edit_multiple_blocks, fast_delete_file, fast_move_file

## Optimal strategy by operation type

| Operation | Recommended tool | Tokens consumed | Speed |
|---|---|---|---|
| File copy | `node fs.copyFile` | ~0 | ~5ms |
| Mechanical edit (regex, fixed value) | `node` inline | ~0 | ~2ms |
| Localized edit (known line) | `edit-file-lines` | minimal | fast |
| Intelligent edit (reasoning required) | `filesystem` read + Claude + write | high | slow |

### When to use `node` for file operations

Use `node -e` (whitelisted as `safe` in `commands` MCP) for any **mechanical and predictable** operation:
- File copy without loading content into Claude context
- Value replacement by regex (status, date, fixed field)
- Repetitive transformation across multiple files

`node` is `safe` in the whitelist — **no approval required**.

### Validated `node` templates

**File copy:**
```
command: node
args: ["-e", "const fs=require('fs');const s=Date.now();fs.copyFile('SRC','DST',err=>{if(err)console.error(err);else console.log((Date.now()-s)+'ms');})"]
```

**Regex replacement with occurrence count (safety guard):**
```
command: node
args: ["-e", "const fs=require('fs');const s=Date.now();const c=fs.readFileSync('PATH','utf8');const count=(c.match(/PATTERN/g)||[]).length;const u=c.replace(/PATTERN/g,'REPLACEMENT');fs.writeFileSync('PATH',u,'utf8');console.log((Date.now()-s)+'ms - '+count+' occurrences replaced');"]
```

### Mandatory safety guards for `node`

1. **Always count occurrences before replacing** — verify the count matches the intent
2. **On production files** (outside tmp/test): make a backup copy before any modification
3. **Targeted regex**: ensure the pattern cannot match anything other than the intended target (e.g. use `statut: "Urgent"` rather than just `"Urgent"`)
4. **Verify after**: use `get_file_info` to confirm file size is consistent

## ⚠️ bash_tool does not work for local files
`bash_tool` runs in an isolated Linux container — it has **no access**
to the user's Windows filesystem. Never use it to read, write, or manipulate
local files. Always use `filesystem` or `edit-file-lines`.

## Copying binary files (PDF, images) to the Windows filesystem

`edit-file-lines` is text-only — it cannot copy binary files.
The correct approach is a `node` script that reads the file as a Buffer and writes it:

```
command: node
args: ["-e", "const fs=require('fs');fs.writeFileSync('C:/dest/file.pdf',fs.readFileSync('/home/claude/work/file.pdf'));console.log('done');"]
```

This works because:
- `node` runs in the container but **can write to the Windows filesystem** via the MCP commands tool
- No base64 conversion needed — Buffer copy is transparent for any binary format
- `node` is whitelisted as `safe` — no approval required

## Generating a PDF from a local HTML file

Never reconstruct HTML content manually in the container — that wastes tokens.
Instead, use `node` to read the source file, transform it, and pipe it to `wkhtmltopdf`:

```
# Step 1 — transform the HTML (node, zero tokens)
node -e "
  const fs=require('fs');
  let h=fs.readFileSync('C:/path/to/source.html','utf8');
  h=h.replace('<body>','<body class=\"mode-cr\">');
  // ... other transformations ...
  fs.writeFileSync('/home/claude/work/print.html',h);
  console.log('done');
"

# Step 2 — generate PDF
wkhtmltopdf --enable-local-file-access /home/claude/work/print.html /home/claude/work/out.pdf

# Step 3 — copy PDF back to Windows filesystem (node, zero tokens)
node -e "const fs=require('fs');fs.writeFileSync('C:/dest/out.pdf',fs.readFileSync('/home/claude/work/out.pdf'));console.log('done');"
```

This keeps token consumption near zero — only the `node` script logic is generated, not the file content.

## Strategy when a replacement fails (old_text not found)
Do not fall back to bash. Instead:
1. Use `edit-file-lines:fast_read_file` with `line_start` + `line_count`
   to read the exact lines around the area to modify
2. Copy the exact text as it appears in the file (encoding, spaces, apostrophes)
3. Retry `filesystem:edit_file` or `fast_edit_block` with the corrected string

---

## Keywords
filesystem, MCP, read, write, copy, node, regex, files, conventions

---

## Index

| Terme | Occurrences |
|-------|-------------|

---

## Changelog

### Version 1.0 - Creation
**Date:** 2026-05-30
**Raison:** Convention filesystem MCP — regles de lecture/ecriture de fichiers locaux.

**Contenu initial :**
- Read : filesystem MCP
- Write : edit-file-lines MCP
- Operations mecaniques : node via commands MCP
- Templates node valides
- Garde-fous securite
