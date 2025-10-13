# Changelog

## [Unreleased]

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
