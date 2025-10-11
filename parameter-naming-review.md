# 参数命名审查报告

## 搜索工具 (3个)

### ✅ 1. search_by_filename
- `filename` - 清晰 ✓
- `limit` - 清晰 ✓
- `notebook` - ⚠️ **建议改为 `notebook_id`** (更明确)

### ✅ 2. search_by_content
- `content` - 清晰 ✓
- `limit` - 清晰 ✓
- `notebook` - ⚠️ **建议改为 `notebook_id`** (更明确)

### ✅ 3. sql_query
- `sql` - 清晰 ✓

---

## 文档工具 (6个)

### ✅ 4. get_document_content
- `document_id` - 清晰 ✓

### ✅ 5. create_document
- `notebook_id` - 清晰 ✓
- `path` - 清晰 ✓
- `content` - 清晰 ✓

### ✅ 6. append_to_document
- `document_id` - 清晰 ✓
- `content` - 清晰 ✓

### ✅ 7. update_document
- `document_id` - 清晰 ✓
- `content` - 清晰 ✓

### ✅ 8. append_to_daily_note
- `notebook_id` - 清晰 ✓
- `content` - 清晰 ✓

### ✅ 9. move_document (已修复)
- `from_ids` - 清晰 ✓
- `to_parent_id` - 清晰 ✓ (已改进)
- `to_notebook_root` - 清晰 ✓ (已改进)

---

## 笔记本工具 (2个)

### ✅ 10. list_notebooks
- 无参数

### ✅ 11. get_recently_updated_documents
- `limit` - 清晰 ✓
- `notebook_id` - 清晰 ✓

---

## 快照工具 (3个)

### ✅ 12. create_snapshot
- `memo` - 清晰 ✓

### ✅ 13. list_snapshots
- `page` - ⚠️ **建议改为 `page_number`** (更明确)

### ✅ 14. rollback_snapshot
- `snapshot_id` - 清晰 ✓

---

## 建议修改的参数 (3个)

### 🔧 优先级：低 (可选改进)

1. **search_by_filename.notebook** → `notebook_id`
   - 当前：`notebook` (可选)
   - 建议：`notebook_id`
   - 理由：与其他工具保持一致，都使用 `_id` 后缀

2. **search_by_content.notebook** → `notebook_id`
   - 当前：`notebook` (可选)
   - 建议：`notebook_id`
   - 理由：与其他工具保持一致，都使用 `_id` 后缀

3. **list_snapshots.page** → `page_number`
   - 当前：`page`
   - 建议：`page_number`
   - 理由：更明确，避免与其他可能的 "page" 含义混淆

---

## 总结

### 整体情况
- ✅ 优秀：11/14 (79%)
- ⚠️ 可改进：3/14 (21%)
- ❌ 有问题：0/14 (0%)

### 命名规范
当前项目的命名规范良好：
- ✓ 使用 `_id` 后缀表示ID类型 (document_id, notebook_id, snapshot_id)
- ✓ 使用 `_to_` 前缀表示目标 (append_to_daily_note)
- ✓ 使用清晰的动词 (create, update, append, move, list, get, rollback)
- ✓ 避免缩写，使用完整单词

### 已完成的改进
✅ `move_document` 工具参数已优化：
- `to_id` → `to_parent_id` (更清晰)
- `to_notebook` → `to_notebook_root` (更清晰)
- 添加了互斥验证逻辑

### 建议操作
考虑到影响范围和优先级，建议：
- **立即修改**: 无（没有严重问题）
- **考虑修改**: search 工具的 `notebook` → `notebook_id`
- **可选修改**: `page` → `page_number`
