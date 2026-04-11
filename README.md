# SiYuan MCP Server

A Model Context Protocol (MCP) server for SiYuan Note.  
Allows AI assistants (Claude, Cursor, ChatGPT, and other MCP-compatible clients) to read, navigate, and edit notes with fine-grained control.

---

## ⚠️ Important Notice

This project was developed with significant AI assistance.

Before using it:

- Assume there may be undiscovered bugs.
- Validate behavior in your environment.
- You are responsible for your data.
- Use with care.

---

## ✨ Features

- Full MCP server for SiYuan
- Block-level operations
- Document-level operations
- Navigation tools for deep note trees
- Scoped and global search
- Retry-safe append operations
- Batch editing support
- Notebook and snapshot tools
- Tag management

---

## 🧠 Why this server is useful for LLM workflows

This server is designed to minimize token use and avoid unnecessary reads.

Key design ideas:

- Prefer block-level operations over whole-document rewrites
- Prefer local tree navigation over full-document reads
- Prefer heading and section tools for large documents
- Prefer retry-safe append operations when duplication is possible
- Prefer scoped search when a likely location is known

See `docs/llm-tooling-guide.md` for workflow guidance.

---

## Installation

### From source

```bash
git clone https://github.com/harmesit/siyuan-mcp.git
cd siyuan-mcp
npm install
npm run build
npm install -g .
```

### From npm

```bash
npm install -g @porkll/siyuan-mcp
```

Or run without installing:

```bash
npx @porkll/siyuan-mcp
```

---

## Configuration

### Get your SiYuan API token

1. Open SiYuan Note
2. Go to **Settings → About → API Token**
3. Copy the token

Ensure SiYuan is running (default `http://127.0.0.1:6806`).

---

## Cursor example

`~/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "siyuan-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@porkll/siyuan-mcp",
        "stdio",
        "--token",
        "YOUR_TOKEN",
        "--baseUrl",
        "http://127.0.0.1:6806"
      ]
    }
  }
}
```

---

## Available Tools

### Search

- `unified_search` – broad discovery across content / filename / tag
- `search_blocks` – compact global block search
- `search_blocks_scoped` – narrowed block search using a scope block
- `resolve_block_reference` – resolve likely blocks from text

---

### Document Operations

- `get_document_content`
- `create_document`
- `append_to_document`
- `update_document`
- `move_documents`
- `get_document_tree`
- `get_document_outline`

---

### Block Read & Navigation

- `get_block`
- `get_block_brief`
- `get_child_blocks`
- `list_children_brief`
- `get_block_context`
- `get_block_tree_slice`
- `find_heading_in_tree`
- `get_section_by_heading`

---

### Block Editing

- `replace_text_in_block`
- `replace_text_in_block_strict`
- `replace_range_in_block`

---

### Structural Operations

- `insert_block_before`
- `insert_block_after`
- `append_block`
- `append_block_if_missing`
- `prepend_block`
- `delete_block`
- `move_block`

---

### Composite Operations

- `apply_operations`
- `upsert_section_by_heading`

---

### Attributes

- `get_block_attributes`
- `set_block_attributes`
- `update_block_attribute`

---

### Daily Notes

- `append_to_daily_note`

---

### Notebooks

- `list_notebooks`
- `get_recently_updated_documents`
- `create_notebook`

---

### Snapshots

- `create_snapshot`
- `list_snapshots`
- `rollback_to_snapshot`

---

### Tags

- `list_all_tags`
- `batch_replace_tag`

---

## Recommended Workflows

### Efficient editing of long notes

1. `unified_search` or `get_document_tree`
2. `get_document_outline`
3. `find_heading_in_tree` or `get_section_by_heading`
4. `replace_text_in_block` or `upsert_section_by_heading`

### Retry-safe appends

Use:

- `append_block_if_missing`

---

### Focused search

Use:

- `search_blocks_scoped`

---

### Grouped edits

Use:

- `apply_operations`

---

## Development

```bash
npm install
npm run build
npm run watch
npm run lint
```

---

## License

Apache-2.0

---

## Related Projects

- SiYuan Note
- Model Context Protocol
- MCP TypeScript SDK

---

## Acknowledgments

This project builds on SiYuan Note and was developed with substantial AI assistance.