# Siyuan MCP Tooling Guide for LLMs

## Preferred workflow
1. Prefer block or section tools over full document tools.
2. Prefer scoped or local tree tools over global search when scope is known.
3. Prefer heading and section tools before reading long documents.
4. Prefer batch edits for multiple related changes.
5. Prefer retry-safe append tools when duplicate appends are possible.

## Navigation strategy
- Use `unified_search` for broad discovery.
- Use `search_blocks` for compact global block search.
- Use `search_blocks_scoped` when a subtree is already known.
- Use `find_heading_in_tree` or `get_section_by_heading` for long notes.

## Editing strategy
- Use `replace_text_in_block` for precise local edits.
- Use `replace_text_in_block_strict` when the exact existing text is already known.
- Use `append_block_if_missing` for retry-safe appends.
- Use `apply_operations` for grouped local edits.

## Token efficiency
- Keep `limit`, `depth`, and returned content small unless discovery fails.
- Avoid full document reads unless local tools are insufficient.
- Prefer compact navigation first, then expand only if needed.