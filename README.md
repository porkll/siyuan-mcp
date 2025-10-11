# SiYuan Tools

思源笔记工具库 - 基于 TypeScript 的思源笔记 API 操作库

A TypeScript library for SiYuan Note API operations, designed to be compatible with MCP (Model Context Protocol) servers like Gemini CLI and Claude Code.

## 特性 Features

- 完整的 TypeScript 类型定义
- 模块化设计，易于扩展
- 符合 Gemini CLI 和 Claude Code 的技术栈标准
- 支持所有常用的思源笔记 API 操作

## 安装 Installation

```bash
npm install siyuan-tools
```

## 快速开始 Quick Start

```typescript
import { createSiyuanTools } from 'siyuan-tools';

// 创建工具实例
const siyuan = createSiyuanTools('http://127.0.0.1:6806', 'your-api-token');

// 搜索文件
const files = await siyuan.searchByFileName('我的笔记');

// 查看文件内容
const content = await siyuan.getFileContent(files[0].id);

// 创建新文档
const docId = await siyuan.createFile(
  'notebookId',
  '/folder/新文档',
  '# 标题\n\n这是内容'
);

// 追加到今日笔记
await siyuan.appendToDailyNote('notebookId', '今天学到了新知识');
```

## 核心功能 Core Features

### 1. 搜索 Search

#### 根据文件名搜索
```typescript
const results = await siyuan.searchByFileName('关键词', 10);
```

#### 根据内容搜索
```typescript
const results = await siyuan.searchByContent('内容关键词', 10);
```

#### 高级搜索
```typescript
// 使用搜索 API 进行更复杂的搜索
const results = await siyuan.search.searchByContent('关键词', {
  limit: 20,
  notebook: 'notebookId',
  types: ['d', 'p'] // d=文档, p=段落
});
```

### 2. 文件操作 File Operations

#### 查看文件内容
```typescript
const markdown = await siyuan.getFileContent(blockId);
```

#### 覆盖文件内容
```typescript
await siyuan.overwriteFile(blockId, '# 新内容\n\n完全替换原有内容');
```

#### 追加到文件
```typescript
const newBlockId = await siyuan.appendToFile(parentId, '追加的内容');
```

#### 创建新文件
```typescript
const docId = await siyuan.createFile(
  'notebookId',
  '/文件夹/文件名',
  '# 文档标题\n\n文档内容'
);
```

### 3. 今日笔记 Daily Note

#### 追加到今日笔记
```typescript
await siyuan.appendToDailyNote('notebookId', '今天的新想法');
```

#### 获取或创建今日笔记
```typescript
const dailyNoteId = await siyuan.dailyNote.getOrCreateDailyNote('notebookId');
```

#### 在今日笔记开头插入
```typescript
await siyuan.dailyNote.prependToDailyNote('notebookId', '最新的待办事项');
```

### 4. 笔记本操作 Notebook Operations

#### 列出所有笔记本
```typescript
const notebooks = await siyuan.listNotebooks();
console.log(notebooks.map(nb => `${nb.name} (${nb.id})`));
```

#### 创建笔记本
```typescript
const notebookId = await siyuan.notebook.createNotebook('新笔记本');
```

#### 获取笔记本配置
```typescript
const config = await siyuan.notebook.getNotebookConf('notebookId');
console.log('今日笔记路径模板:', config.dailyNoteSavePath);
```

## 高级用法 Advanced Usage

### 直接使用 API 模块

```typescript
import { createSiyuanTools } from 'siyuan-tools';

const siyuan = createSiyuanTools('http://127.0.0.1:6806', 'token');

// 使用块操作 API
await siyuan.block.insertBlockBefore(blockId, '插入到指定块之前');
await siyuan.block.insertBlockAfter(blockId, '插入到指定块之后');
await siyuan.block.moveBlock(blockId, previousId, parentId);
await siyuan.block.deleteBlock(blockId);

// 使用文档操作 API
const docTree = await siyuan.document.getDocTree('notebookId');
const hPath = await siyuan.document.getHumanReadablePath(blockId);
await siyuan.document.moveDocument(
  'fromNotebookId',
  '/source/path',
  'toNotebookId',
  '/dest/path'
);
```

### 辅助工具方法

提供额外的便捷功能，按需使用：

```typescript
// 获取增强的块信息（包含父块、子块数量等）
const enhanced = await siyuan.helpers.getEnhancedBlockInfo(blockId);

// 获取最近修改的文档
const recent = await siyuan.helpers.getRecentDocuments(10);

// 获取文档大纲
const outline = await siyuan.helpers.getDocumentOutline(docId);

// 格式化工具（无需 API 调用）
const blockRef = siyuan.helpers.formatBlockRef(blockId, '锚文本');
const timestamp = siyuan.helpers.formatTimestamp(new Date());
```

### 使用 SQL 查询

```typescript
const results = await siyuan.search.query(`
  SELECT * FROM blocks
  WHERE type='d'
    AND content LIKE '%搜索内容%'
    AND updated > '20240101000000'
  ORDER BY updated DESC
  LIMIT 10
`);
```

### 自定义配置

```typescript
import { SiyuanTools } from 'siyuan-tools';

const siyuan = new SiyuanTools({
  baseUrl: 'http://192.168.1.100:6806',
  token: 'your-api-token'
});

// 运行时更新配置
siyuan.updateConfig({
  baseUrl: 'http://localhost:6806'
});
```

## API 文档 API Documentation

### SiyuanTools

主工具类，提供所有功能的统一入口。

#### 属性 Properties

- `search: SiyuanSearchApi` - 搜索相关操作
- `block: SiyuanBlockApi` - 块操作
- `document: SiyuanDocumentApi` - 文档操作
- `notebook: SiyuanNotebookApi` - 笔记本操作
- `dailyNote: DailyNoteUtils` - 今日笔记工具

#### 便捷方法 Convenience Methods

- `searchByFileName(fileName, limit?)` - 根据文件名搜索
- `searchByContent(content, limit?)` - 根据内容搜索
- `getFileContent(blockId)` - 获取文件内容
- `overwriteFile(blockId, content)` - 覆盖文件内容
- `appendToFile(blockId, content)` - 追加到文件
- `createFile(notebookId, path, content)` - 创建新文件
- `appendToDailyNote(notebookId, content)` - 追加到今日笔记
- `listNotebooks()` - 列出所有笔记本

### 模块 API

详细的 API 文档请参考各个模块：

- [SiyuanSearchApi](./src/api/search.ts) - 搜索操作
- [SiyuanBlockApi](./src/api/block.ts) - 块操作
- [SiyuanDocumentApi](./src/api/document.ts) - 文档操作
- [SiyuanNotebookApi](./src/api/notebook.ts) - 笔记本操作
- [DailyNoteUtils](./src/utils/daily-note.ts) - 今日笔记工具

## 类型定义 Type Definitions

所有类型定义都可以从主模块导入：

```typescript
import type {
  SiyuanConfig,
  SiyuanApiResponse,
  Block,
  Notebook,
  NotebookConf,
  DocTreeNode,
  SearchOptions
} from 'siyuan-tools';
```

## 开发 Development

```bash
# 安装依赖
npm install

# 构建
npm run build

# 监听模式
npm run watch

# 代码检查
npm run lint

# 格式化代码
npm run format
```

## 技术栈 Tech Stack

- **Language**: TypeScript 5.3+
- **Runtime**: Node.js 18+
- **Module System**: ES Modules
- **Package Manager**: npm

## MCP 服务器 MCP Server

本项目提供了完整的 MCP (Model Context Protocol) 服务器实现，可以与 Claude Code、Claude Desktop、Gemini CLI 等工具集成。

### 快速配置到 Claude Code

**一键添加到 Claude Code：**

```bash
# 进入项目目录
cd /Users/lei/workspace/program/personal/siyuan-mcp

# 构建项目
npm install
npm run build

# 添加到 Claude Code（替换为你的 API Token）
claude mcp add-json siyuan '{"command":"node","args":["/Users/lei/workspace/program/personal/siyuan-mcp/dist/mcp-server/bin/stdio.js","--token","你的API_TOKEN","--baseUrl","http://127.0.0.1:6806"]}'

# 验证配置
claude mcp list
```

**获取 API Token：**
在思源笔记中：设置 → 关于 → API Token

**使用示例：**
配置完成后，在 Claude Code 中可以直接使用：
- "列出我的所有思源笔记本"
- "搜索包含'项目计划'的文档"
- "在工作笔记本创建一个会议记录"
- "显示最近修改的5个文档"

### 可用的 MCP 工具（12个）

1. **search_by_filename** - 按文件名搜索文档
2. **search_by_content** - 按内容搜索块
3. **sql_query** - 执行自定义 SQL 查询
4. **get_file_content** - 获取文档内容
5. **create_file** - 创建新文档
6. **append_to_file** - 追加内容到文档
7. **update_file** - 更新（覆盖）文档内容
8. **append_to_daily_note** - 追加到今日笔记
9. **list_notebooks** - 列出所有笔记本
10. **get_notebook_config** - 获取笔记本配置
11. **get_recently_updated_documents** - 获取最近更新的文档
12. **get_document_outline** - 获取文档大纲

### 两种服务器模式

#### Stdio 模式（推荐用于 Claude Code/Desktop）
```bash
# 启动 Stdio 服务器
npm run mcp:stdio -- --token YOUR_TOKEN

# 或直接运行
node dist/mcp-server/bin/stdio.js --token YOUR_TOKEN --baseUrl http://127.0.0.1:6806
```

#### HTTP/SSE 模式（用于 Web 应用）
```bash
# 启动 HTTP 服务器
npm run mcp:http -- --token YOUR_TOKEN --port 3000

# 或直接运行
node dist/mcp-server/bin/http.js --token YOUR_TOKEN --port 3000
```

### 其他工具集成

**Claude Desktop 配置：**
编辑 `~/Library/Application Support/Claude/claude_desktop_config.json`：
```json
{
  "mcpServers": {
    "siyuan": {
      "command": "node",
      "args": [
        "/path/to/siyuan-mcp/dist/mcp-server/bin/stdio.js",
        "--token",
        "YOUR_TOKEN"
      ]
    }
  }
}
```

**详细文档：**
- [MCP 使用指南](./MCP_USAGE.md) - 完整的使用说明
- [Claude Code 配置](./CLAUDE_CODE_SETUP.md) - 详细配置指南
- [架构说明](./mcp-server/README.md) - 服务器架构文档

## 兼容性 Compatibility

本项目采用与 Gemini CLI 和 Claude Code 相同的技术栈：
- TypeScript + ES Modules
- Node.js 18+
- 符合 MCP (Model Context Protocol) 标准

## 许可证 License

Apache-2.0

## 贡献 Contributing

欢迎提交 Issue 和 Pull Request！

## 相关项目 Related Projects

- [思源笔记](https://github.com/siyuan-note/siyuan) - 官方项目
- [Gemini CLI](https://github.com/google-gemini/gemini-cli) - Google 的 AI 终端工具
- [Claude Code](https://github.com/anthropics/claude-code) - Anthropic 的 AI 编程助手

## 常见问题 FAQ

### 如何获取 API Token?

在思源笔记中：设置 -> 关于 -> API Token

### 如何找到笔记本 ID?

```typescript
const notebooks = await siyuan.listNotebooks();
notebooks.forEach(nb => console.log(`${nb.name}: ${nb.id}`));
```

### 如何处理错误?

所有 API 方法在失败时会抛出错误，建议使用 try-catch：

```typescript
try {
  await siyuan.createFile('notebookId', '/path', 'content');
} catch (error) {
  console.error('创建文件失败:', error.message);
}
```

## 示例 Examples

更多示例请查看 [examples](./examples) 目录。
