# 思源笔记工具库

基于 TypeScript 的思源笔记 API 操作库，专为 MCP (Model Context Protocol) 服务器设计，如 Gemini CLI 和 Claude Code。

## ⚠️ 重要声明

本项目代码主要由 AI 辅助开发，仅进行了功能性测试，未对所有代码进行完整审查。使用本项目前，请充分了解并接受以下内容：

- 代码可能存在未发现的问题或潜在风险
- 请在使用前进行必要的代码审查和测试
- 使用者需自行承担使用本项目所产生的风险和责任
- 建议在生产环境使用前进行充分的验证

**请谨慎使用，并对自己的选择负责。**

---

## 目录

- [特性](#特性)
- [安装](#安装)
- [快速开始](#快速开始)
- [核心功能](#核心功能)
  - [搜索](#1-搜索)
  - [文件操作](#2-文件操作)
  - [今日笔记](#3-今日笔记)
  - [笔记本操作](#4-笔记本操作)
- [高级用法](#高级用法)
- [开发](#开发)

## 特性

- ✅ 完整的 TypeScript 类型定义
- ✅ 模块化设计，易于扩展
- ✅ 符合 Gemini CLI 和 Claude Code 的技术栈标准
- ✅ 支持所有常用的思源笔记 API 操作
- ✅ 支持今日笔记自动创建和追加
- ✅ 灵活的搜索功能

## 安装

```bash
npm install siyuan-tools
```

## 快速开始

```typescript
import { createSiyuanTools } from 'siyuan-tools';

// 创建工具实例（需要思源笔记的 API Token）
const siyuan = createSiyuanTools('http://127.0.0.1:6806', 'your-api-token');

// 搜索笔记
const files = await siyuan.searchByFileName('我的笔记');

// 创建新文档
const docId = await siyuan.createFile(
  'notebookId',
  '/文件夹/新文档',
  '# 标题\n\n内容'
);
```

## 核心功能

### 1. 搜索

```typescript
// 根据文件名搜索
const files = await siyuan.searchByFileName('关键词', 10);

// 根据内容搜索
const blocks = await siyuan.searchByContent('内容关键词', 20);

// 高级搜索（指定笔记本、类型等）
const results = await siyuan.search.searchByContent('关键词', {
  limit: 20,
  notebook: 'notebookId',
  types: ['d', 'p'] // d=文档, p=段落
});
```

### 2. 文件操作

```typescript
// 查看文件内容
const content = await siyuan.getFileContent(blockId);

// 覆盖文件内容
await siyuan.overwriteFile(blockId, '新内容');

// 追加内容到文件
await siyuan.appendToFile(parentId, '追加的内容');

// 创建新文件
const docId = await siyuan.createFile(
  'notebookId',
  '/路径/文件名',
  '# 标题\n\n内容'
);
```

### 3. 今日笔记

```typescript
// 追加内容到今日笔记（自动创建）
await siyuan.appendToDailyNote('notebookId', '今天的想法');

// 在今日笔记开头插入内容
await siyuan.dailyNote.prependToDailyNote('notebookId', '待办事项');

// 获取或创建今日笔记
const dailyNoteId = await siyuan.dailyNote.getOrCreateDailyNote('notebookId');
```

### 4. 笔记本操作

```typescript
// 列出所有笔记本
const notebooks = await siyuan.listNotebooks();

// 创建笔记本
const notebookId = await siyuan.notebook.createNotebook('新笔记本');

// 获取笔记本配置
const config = await siyuan.notebook.getNotebookConf('notebookId');
```

## 高级用法

### 直接使用 API 模块

```typescript
// 块操作
await siyuan.block.insertBlockBefore(blockId, '内容');
await siyuan.block.moveBlock(blockId, previousId, parentId);
await siyuan.block.deleteBlock(blockId);

// 文档操作
const tree = await siyuan.document.getDocTree('notebookId');
await siyuan.document.moveDocument(
  'sourceNotebook', '/source/path',
  'targetNotebook', '/target/path'
);
```

### 使用 SQL 查询

```typescript
const results = await siyuan.search.query(`
  SELECT * FROM blocks
  WHERE type='d' AND content LIKE '%关键词%'
  ORDER BY updated DESC
  LIMIT 10
`);
```

## 开发

```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 监听模式（自动重新构建）
npm run watch

# 代码检查
npm run lint

# 格式化代码
npm run format
```

## 获取 API Token

1. 打开思源笔记
2. 进入 设置 -> 关于
3. 复制 API Token

## 许可证

Apache-2.0
