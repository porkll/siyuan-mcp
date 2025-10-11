# 命名规范文档 (Naming Conventions)

## 📋 总体原则

### 数据流转原则
1. **内部数据传递**：使用完整的数据结构，包含所有字段（如 `Block`, `Notebook`, `DocTreeNode`）
2. **API响应**：仅在最后向外部返回时简化数据，使用 `*Response` 类型

## 🎯 类型命名规范

### 1. 内部数据类型（完整数据）
用于内部数据传递和处理，包含所有可能的字段：

```typescript
// ✅ 正确命名
export interface Block { ... }           // 块信息（完整）
export interface Notebook { ... }        // 笔记本信息（完整）
export interface DocTreeNode { ... }     // 文档树节点（完整）

// ❌ 错误命名
export interface SimpleBlock { ... }     // 不要用 Simple 前缀
export interface BlockInternal { ... }   // 不要用 Internal 后缀
```

### 2. 响应类型（简化数据）
用于API返回给LLM，仅包含必要字段：

```typescript
// ✅ 正确命名
export interface NotebookResponse { ... }        // 笔记本响应
export interface SearchResultResponse { ... }    // 搜索结果响应
export interface DocTreeNodeResponse { ... }     // 文档树节点响应

// ❌ 错误命名
export interface SimpleNotebook { ... }          // 不要用 Simple 前缀
export interface NotebookSimplified { ... }      // 不要用 Simplified 后缀
export interface NotebookDTO { ... }             // 不要用 DTO 后缀
```

## 🏗️ 类命名规范

### API 类
所有API类使用 `Siyuan*Api` 格式：

```typescript
// ✅ 正确命名
export class SiyuanSearchApi { ... }
export class SiyuanDocumentApi { ... }
export class SiyuanNotebookApi { ... }
export class SiyuanBlockApi { ... }
export class SiyuanSnapshotApi { ... }

// ❌ 错误命名
export class SearchAPI { ... }           // API应该是Api
export class SiyuanSearch { ... }        // 缺少Api后缀
```

### 工具类
使用描述性名称：

```typescript
// ✅ 正确命名
export class SiyuanHelpers { ... }       // 辅助工具类
export class DailyNoteUtils { ... }     // 日记工具类

// ❌ 错误命名
export class Utils { ... }               // 太泛化
export class Helper { ... }              // 应该用复数
```

## 📝 方法命名规范

### 1. 查询方法
返回Response类型的公共方法：

```typescript
// ✅ 正确命名
async searchByFileName(...): Promise<SearchResultResponse[]>
async searchByContent(...): Promise<SearchResultResponse[]>
async listNotebooks(): Promise<NotebookResponse[]>
async getDocumentTree(...): Promise<DocTreeNodeResponse[]>
async getRecentlyUpdatedDocuments(...): Promise<SearchResultResponse[]>

// ❌ 错误命名
async searchByFileNameSimple(...)        // 不要用 Simple 后缀
async getNotebooksResponse(...)          // 不要在方法名中加 Response
async listNotebooksSimplified(...)       // 不要用 Simplified 后缀
```

### 2. 转换方法
私有方法，将内部类型转换为响应类型：

```typescript
// ✅ 正确命名
private toSearchResultResponse(blocks: Block[]): SearchResultResponse[]
private toNotebookResponse(notebooks: Notebook[]): NotebookResponse[]
private toDocTreeNodeResponse(rows: any[]): DocTreeNodeResponse[]

// ❌ 错误命名
private simplifySearchResults(...)       // 不要用 simplify
private convertToResponse(...)           // 不够具体
private toSimple(...)                    // 不够明确
```

### 3. 内部处理方法
不返回Response类型的方法：

```typescript
// ✅ 正确命名
async query(sql: string): Promise<Block[]>              // SQL查询返回完整数据
private buildTreeQuery(id: string, depth: number)       // 构建查询
private escapeSql(str: string): string                  // SQL转义

// ❌ 错误命名
async querySimple(...)                   // 不要用 Simple 后缀
```

## 🎨 工具函数命名

```typescript
// ✅ 正确命名
export function extractTitle(content: string): string
export function truncateContent(content: string, maxLength: number): string

// ❌ 错误命名
export function getTitleFromContent(...)   // 太长
export function truncate(...)              // 不够具体
```

## 📊 字段命名规范

### Response类型应包含的字段
对LLM有意义的核心信息：

```typescript
interface SearchResultResponse {
  id: string;              // ✅ 必需：唯一标识
  name: string;            // ✅ 必需：标题/名称
  path: string;            // ✅ 必需：人类可读路径（hpath）
  content: string;         // ✅ 必需：内容摘要
  type: string;            // ✅ 必需：类型信息
  updated: string;         // ✅ 必需：更新时间

  // ❌ 不应包含的字段
  // icon: string;         // UI相关
  // sort: number;         // UI相关
  // hash: string;         // 内部使用
  // ial: string;          // 内部属性
}
```

## 📁 文件组织规范

```
src/
├── types/
│   └── index.ts              # 所有类型定义（内部类型 + Response类型）
├── api/
│   ├── client.ts             # SiyuanClient
│   ├── search.ts             # SiyuanSearchApi
│   ├── document.ts           # SiyuanDocumentApi
│   ├── notebook.ts           # SiyuanNotebookApi
│   ├── block.ts              # SiyuanBlockApi
│   └── snapshot.ts           # SiyuanSnapshotApi
├── utils/
│   ├── format.ts             # 格式化工具函数
│   ├── helpers.ts            # SiyuanHelpers
│   └── daily-note.ts         # DailyNoteUtils
└── index.ts                  # 主入口
```

## ✅ 完整示例

### 搜索API示例

```typescript
// ✅ 正确的实现
export class SiyuanSearchApi {
  // 公共方法：返回Response类型
  async searchByFileName(
    fileName: string,
    options: SearchOptions = {}
  ): Promise<SearchResultResponse[]> {
    // 1. 内部获取完整数据
    const response = await this.client.request<Block[]>(...);
    const blocks: Block[] = response.data || [];

    // 2. 最后转换为Response类型返回
    return this.toSearchResultResponse(blocks);
  }

  // 私有转换方法
  private toSearchResultResponse(blocks: Block[]): SearchResultResponse[] {
    return blocks.map(block => ({
      id: block.id,
      name: block.name || extractTitle(block.content),
      path: block.hpath || block.path,
      content: truncateContent(block.content, 200),
      type: block.type,
      updated: block.updated
    }));
  }
}
```

## 🔍 代码审查清单

在提交代码前，请检查：

- [ ] 内部数据类型使用完整结构（如 `Block`, `Notebook`）
- [ ] API响应使用 `*Response` 类型
- [ ] 不使用 `Simple*` 或 `*Simplified` 命名
- [ ] 转换方法使用 `to*Response()` 命名
- [ ] API类使用 `Siyuan*Api` 命名
- [ ] 公共方法直接返回Response类型
- [ ] Response类型只包含LLM需要的字段
- [ ] 内部数据尽可能详细完整
