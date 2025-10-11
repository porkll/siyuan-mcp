# SiYuan MCP 架构设计文档

## 🎯 核心设计原则

### 数据流转策略
```
完整数据 (Block, Notebook) → 内部处理 → 响应数据 (*Response) → 返回给LLM
  ↑                              ↑                    ↑
内部传递使用                   API层处理           最后简化
```

**关键原则**：
1. 内部数据传递使用完整结构，包含所有字段
2. 只在API最后返回时简化数据
3. 简化数据使用 `*Response` 命名约定

## 📊 类型系统架构

### 1. 内部数据类型（完整数据）

```typescript
// 用于内部数据传递，包含所有字段
interface Block {
  id: string;
  parent_id?: string;
  root_id: string;
  hash: string;          // 内部使用
  box: string;
  path: string;
  hpath: string;         // 人类可读路径
  name: string;
  alias: string;
  memo: string;
  tag: string;
  content: string;
  fcontent?: string;
  markdown: string;
  length: number;
  type: string;
  subtype: string;
  ial?: string;          // 内部属性
  sort: number;          // 排序
  created: string;
  updated: string;
}

interface Notebook {
  id: string;
  name: string;
  icon: string;          // UI相关
  sort: number;          // UI相关
  closed: boolean;
}

interface DocTreeNode {
  id: string;
  name: string;
  icon: string;          // UI相关
  type: string;
  subtype: string;
  path: string;
  children?: DocTreeNode[];
}
```

### 2. 响应类型（简化数据）

```typescript
// 只包含LLM需要的核心信息
interface SearchResultResponse {
  id: string;            // 唯一标识
  name: string;          // 标题
  path: string;          // 人类可读路径（从hpath转换）
  content: string;       // 内容摘要（截取200字符）
  type: string;          // 类型
  updated: string;       // 更新时间
}

interface NotebookResponse {
  id: string;
  name: string;
  closed: boolean;       // 状态信息对LLM有意义
}

interface DocTreeNodeResponse {
  id: string;
  name: string;
  path: string;          // 人类可读路径
  children?: DocTreeNodeResponse[];
}
```

## 🏗️ 层级架构

```
┌─────────────────────────────────────────────────────┐
│                   MCP Handlers                      │
│            (mcp-server/handlers/*.ts)               │
│  - SearchByFilenameHandler                          │
│  - GetDocumentTreeHandler                           │
│  - ListNotebooksHandler                             │
│  └→ 调用 API 层，接收 *Response 类型                │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│                    API 层                           │
│               (src/api/*.ts)                        │
│                                                     │
│  SiyuanSearchApi                                    │
│    ├─ searchByFileName() → SearchResultResponse[]  │
│    ├─ searchByContent() → SearchResultResponse[]   │
│    └─ query() → Block[]  (原始数据查询)            │
│                                                     │
│  SiyuanNotebookApi                                  │
│    ├─ listNotebooks() → NotebookResponse[]         │
│    └─ getNotebookConf() → NotebookConf             │
│                                                     │
│  SiyuanDocumentApi                                  │
│    ├─ getDocumentTree() → DocTreeNodeResponse[]    │
│    └─ getDocTree() → DocTreeNode[]  (完整数据)     │
│                                                     │
│  内部转换方法：                                      │
│    ├─ toSearchResultResponse(Block[])              │
│    ├─ toNotebookResponse(Notebook[])               │
│    └─ toDocTreeNodeResponse(rows)                  │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│                  数据处理层                          │
│              (src/utils/*.ts)                       │
│                                                     │
│  SiyuanHelpers                                      │
│    └─ getRecentlyUpdatedDocuments()                │
│       → SearchResultResponse[]                      │
│                                                     │
│  格式化工具 (format.ts)                             │
│    ├─ extractTitle(content: string)                │
│    └─ truncateContent(content, maxLength)          │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│                  客户端层                            │
│              (src/api/client.ts)                    │
│                                                     │
│  SiyuanClient                                       │
│    └─ request<T>(endpoint, data)                   │
│       → SiyuanApiResponse<T>                        │
└─────────────────────────────────────────────────────┘
                          ↓
              SiYuan Note API (HTTP)
```

## 🔄 数据流转示例

### 示例：搜索文档

```typescript
// 1. Handler 层 (调用API)
class SearchByFilenameHandler {
  async execute(args, context) {
    // 直接返回 Response 类型
    return await context.siyuan.search.searchByFileName(args.filename, {
      limit: args.limit || 10,
      notebook: args.notebook_id,
    });
  }
}

// 2. API 层 (内部使用完整数据，最后转换)
class SiyuanSearchApi {
  async searchByFileName(
    fileName: string,
    options: SearchOptions = {}
  ): Promise<SearchResultResponse[]> {
    // 2.1 获取完整数据
    const response = await this.client.request<Block[]>('/api/query/sql', {
      stmt: `SELECT * FROM blocks WHERE ...`
    });

    // 2.2 内部使用完整的 Block[] 数据
    const blocks: Block[] = response.data || [];

    // 2.3 最后转换为 Response 类型返回
    return this.toSearchResultResponse(blocks);
  }

  // 转换方法：从完整数据提取LLM需要的字段
  private toSearchResultResponse(blocks: Block[]): SearchResultResponse[] {
    return blocks.map(block => ({
      id: block.id,
      name: block.name || extractTitle(block.content),
      path: block.hpath || block.path,          // 使用 hpath
      content: truncateContent(block.content, 200),
      type: block.type,
      updated: block.updated
      // 不包含: hash, ial, sort, icon 等UI相关字段
    }));
  }
}
```

## 📝 命名规范总结

### 类型命名
| 用途 | 命名模式 | 示例 |
|-----|---------|------|
| 内部完整数据 | 名词 | `Block`, `Notebook`, `DocTreeNode` |
| API响应数据 | 名词 + Response | `SearchResultResponse`, `NotebookResponse` |

### 类命名
| 用途 | 命名模式 | 示例 |
|-----|---------|------|
| API类 | Siyuan + 名词 + Api | `SiyuanSearchApi`, `SiyuanDocumentApi` |
| 工具类 | 描述 + Utils/Helpers | `SiyuanHelpers`, `DailyNoteUtils` |

### 方法命名
| 用途 | 命名模式 | 示例 |
|-----|---------|------|
| 查询方法 | 动词短语 | `searchByFileName()`, `listNotebooks()` |
| 转换方法 | to + 类型名 | `toSearchResultResponse()`, `toNotebookResponse()` |

## 🎨 Response类型设计原则

### 应该包含的字段
✅ **核心标识**：`id`
✅ **可读名称**：`name`, `title`
✅ **路径信息**：`path` (hpath)
✅ **内容摘要**：`content` (截取后的)
✅ **类型信息**：`type`, `subtype`
✅ **时间信息**：`created`, `updated`
✅ **状态信息**：`closed`, `opened`

### 不应该包含的字段
❌ **UI相关**：`icon`, `sort`, `style`
❌ **内部实现**：`hash`, `ial`, `box`
❌ **完整内容**：`markdown` (太长)
❌ **冗余信息**：`alias`, `memo` (非必需)

## 🔧 工具函数

### 格式化工具 (src/utils/format.ts)
```typescript
// 从内容中提取标题
export function extractTitle(content: string): string {
  if (!content) return 'Untitled';
  return content.replace(/^#+\s*/, '').trim().substring(0, 50);
}

// 截取内容作为摘要
export function truncateContent(content: string, maxLength: number): string {
  if (!content) return '';
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
}
```

## 📦 导出结构

```typescript
// src/index.ts - 主入口
export class SiyuanTools {
  // API 模块
  readonly search: SiyuanSearchApi;
  readonly document: SiyuanDocumentApi;
  readonly notebook: SiyuanNotebookApi;
  readonly block: SiyuanBlockApi;
  readonly snapshot: SiyuanSnapshotApi;

  // 工具模块
  readonly helpers: SiyuanHelpers;
  readonly dailyNote: DailyNoteUtils;
}

// 导出所有类型
export * from './types/index.js';

// 导出所有API类
export * from './api/...';
```

## 🚀 使用示例

```typescript
import { SiyuanTools } from 'siyuan-mcp-server';

const siyuan = new SiyuanTools({
  baseUrl: 'http://127.0.0.1:6806',
  token: 'your-token'
});

// 搜索文档 - 返回简化的响应
const results = await siyuan.search.searchByFileName('test', { limit: 5 });
// results: SearchResultResponse[] - 只包含LLM需要的字段

// 获取文档树 - 返回简化的响应
const tree = await siyuan.document.getDocumentTree('notebook-id', 2);
// tree: DocTreeNodeResponse[] - 只包含必要信息

// SQL查询 - 返回完整数据（高级用法）
const blocks = await siyuan.search.query('SELECT * FROM blocks WHERE ...');
// blocks: Block[] - 完整的内部数据结构
```

## 📈 优势总结

1. **清晰的数据边界**
   - 内部处理使用完整数据
   - 对外响应使用简化数据
   - 命名明确区分用途

2. **减少Token消耗**
   - Response类型只包含必要字段
   - 内容自动截取摘要
   - 移除UI相关信息

3. **易于维护**
   - 单一数据流方向
   - 统一的命名规范
   - 清晰的转换边界

4. **类型安全**
   - TypeScript完整类型支持
   - 编译时错误检查
   - 清晰的接口定义

5. **灵活性**
   - 保留完整数据查询能力(如 `query()`)
   - 支持高级用户需求
   - 便于未来扩展
