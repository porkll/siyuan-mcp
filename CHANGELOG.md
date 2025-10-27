# Changelog

## [Unreleased]

## [0.1.5] - 2025-10-27

### Fixed
- 修复 MCP 服务器在处理返回 void 的工具时的响应格式错误
- 修复 snapshot 相关工具（create_snapshot, rollback_to_snapshot）在 MCP 客户端中报错的问题

## [0.1.4] - 2025-10-19

### Fixed
- 修复 snapshot API 的返回数据结构问题，确保 `getSnapshots` 返回完整的数据结构

### Added
- 新增标签（Tag）管理功能
  - `listAllTags()` - 列出所有文档标签
  - `searchByTag(tag, limit)` - 根据标签搜索文档
  - `replaceTag(oldTag, newTag)` - 批量替换标签
  - `removeTag(tag)` - 删除指定标签

- 新增统一搜索接口 `search(options)`
  - 支持按内容、标签、文件名等多种条件组合搜索
  - 可同时使用多个过滤条件

- 新增 MCP Server 工具
  - `siyuan_list_all_tags` - 列出所有标签
  - `siyuan_search_by_tag` - 根据标签搜索文档
  - `siyuan_replace_tag` - 批量替换标签
  - `siyuan_search` - 统一搜索工具（推荐使用）

### Changed
- 优化搜索功能，提供更灵活的查询选项
