# 测试说明

## 前置条件

在运行测试之前,请确保:

1. **配置环境变量**

   复制 `.env.example` 为 `.env`:
   ```bash
   cp .env.example .env
   ```

   编辑 `.env` 文件,配置以下变量:
   ```bash
   # SiYuan API Base URL (默认: http://127.0.0.1:6806)
   SIYUAN_BASE_URL=http://127.0.0.1:6806

   # SiYuan API Token (从 设置 → 关于 → API Token 获取)
   SIYUAN_TOKEN=your-api-token-here

   # 测试笔记本名称 (默认: 99测试)
   SIYUAN_TEST_NOTEBOOK=99测试
   ```

2. **思源笔记正在运行**
   - 默认地址: `http://127.0.0.1:6806`
   - 如果使用不同端口,在 `.env` 中修改 `SIYUAN_BASE_URL`

3. **创建测试笔记本**
   - 在思源笔记中创建一个名为 **"99测试"** 的笔记本 (或 `.env` 中指定的名称)
   - 所有测试数据都会在这个笔记本中创建和操作
   - 测试不会影响其他笔记本的数据

## 运行测试

```bash
# 运行所有测试
npm test

# 监视模式(自动重新运行)
npm run test:watch
```

## 测试内容

测试覆盖 15 个 MCP 工具:

### 🔍 搜索 (1个)
- `unified_search` - 统一搜索

### 📄 文档操作 (6个)
- `get_document_content` - 获取文档内容
- `create_document` - 创建文档
- `append_to_document` - 追加内容
- `update_document` - 更新文档
- `append_to_daily_note` - 追加到今日笔记
- `move_documents` - 移动文档
- `get_document_tree` - 获取文档树

### 📚 笔记本 (2个)
- `list_notebooks` - 列出笔记本
- `get_recently_updated_documents` - 获取最近更新的文档

### 📸 快照 (3个)
- `create_snapshot` - 创建快照
- `list_snapshots` - 列出快照
- `rollback_to_snapshot` - 回滚快照

### 🏷️ 标签 (2个)
- `list_all_tags` - 列出所有标签
- `batch_replace_tag` - 批量替换标签

## 测试数据

测试会在 "99测试" 笔记本中创建:

- 测试文档 (名称以 `test-doc-` 开头)
- 测试标签 (名称以 `test-tag-` 开头)
- 今日笔记条目
- 快照

**注意**: 标签替换测试会保留测试标签在文档中,以便手动验证。如果需要清理,可以取消注释测试中的清理代码。

## 故障排查

### 测试失败: "SIYUAN_TOKEN is not set"
- 确保已创建 `.env` 文件
- 检查 `.env` 文件中 `SIYUAN_TOKEN` 是否正确配置

### 测试失败: "Test notebook '99测试' not found"
- 在思源笔记中创建测试笔记本 (默认名称: "99测试")
- 或修改 `.env` 中的 `SIYUAN_TEST_NOTEBOOK` 为已存在的笔记本名称

### 测试失败: 连接错误
- 确认思源笔记正在运行
- 检查 `.env` 文件中 `SIYUAN_BASE_URL` 和 `SIYUAN_TOKEN` 是否正确

### 测试超时
- 检查网络连接
- 增加测试超时时间 (在 jest.config.js 中修改 `testTimeout`)

## 清理测试数据

如果需要清理测试数据,可以:

1. 在思源笔记中删除 "99测试" 笔记本中的测试文档
2. 或者直接删除整个 "99测试" 笔记本,然后重新创建
