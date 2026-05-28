# Filesystem MCP Convention

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

## Strategy when a replacement fails (old_text not found)
Do not fall back to bash. Instead:
1. Use `edit-file-lines:fast_read_file` with `line_start` + `line_count`
   to read the exact lines around the area to modify
2. Copy the exact text as it appears in the file (encoding, spaces, apostrophes)
3. Retry `filesystem:edit_file` or `fast_edit_block` with the corrected string
