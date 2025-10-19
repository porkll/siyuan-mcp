# 思源笔记 MCP 服务器

[English](./README.md) | 中文

为思源笔记提供的模型上下文协议（MCP）服务器，让 Claude、Cursor 等 AI 助手能够无缝地与你的思源笔记交互。

## ⚠️ 重要声明

本项目代码主要由 AI 辅助开发，仅进行了功能性测试，未对所有代码进行完整审查。使用本项目前，请充分了解并接受以下内容：

- 代码可能存在未发现的问题或潜在风险
- 请在使用前进行必要的代码审查和测试
- 使用者需自行承担使用本项目所产生的风险和责任
- 建议在生产环境使用前进行充分的验证

**请谨慎使用，并对自己的选择负责。**

---

## ✨ 特性

- 🚀 完整的 MCP（模型上下文协议）实现
- 📝 15 个核心工具，全面支持思源笔记操作
- 🔍 统一搜索（内容、文件名、标签及组合搜索）
- 📁 文档管理（创建、读取、更新、移动、树形结构）
- 📅 今日笔记支持，自动创建
- 📚 笔记本操作
- 📸 快照管理（备份和恢复）
- 🏷️ 标签管理（列出、替换）
- 💻 TypeScript 编写，提供完整类型定义
- 🌐 支持 Claude Desktop、Cursor 等所有 MCP 兼容客户端

## 📦 安装

### 方式一：从源码安装（推荐）

```bash
# 克隆仓库
git clone https://github.com/yourusername/siyuan-mcp.git
cd siyuan-mcp

# 安装依赖
npm install

# 构建项目
npm run build

# 全局安装
npm install -g .
```

### 方式二：从 npm 安装（发布后可用）

```bash
npm install -g siyuan-mcp-server
```

安装完成后，`siyuan-mcp` 命令将全局可用。

## 🔧 配置

### 前置条件

1. **获取思源笔记 API Token：**
   - 打开思源笔记
   - 进入 设置 → 关于 → API Token
   - 复制 Token

2. **确保思源笔记正在运行：**
   - 默认地址：`http://127.0.0.1:6806`
   - 如果使用不同端口，请相应调整 `baseUrl`

### 在 Cursor 中配置

编辑 MCP 配置文件 `~/.cursor/mcp.json`：

```json
{
  "mcpServers": {
    "siyuan-mcp": {
      "command": "siyuan-mcp",
      "args": [
        "stdio",
        "--token",
        "你的_API_TOKEN",
        "--baseUrl",
        "http://127.0.0.1:6806"
      ]
    }
  }
}
```

### 在 Claude Desktop 中配置

编辑配置文件：
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "siyuan-mcp": {
      "command": "siyuan-mcp",
      "args": [
        "stdio",
        "--token",
        "你的_API_TOKEN",
        "--baseUrl",
        "http://127.0.0.1:6806"
      ]
    }
  }
}
```

### 验证安装

配置完成后，重启你的 MCP 客户端（Cursor/Claude Desktop），然后尝试：
- "列出我的所有思源笔记本"
- "搜索包含'项目计划'的文档"
- "在工作笔记本中创建一个会议记录"
- "显示最近修改的5个文档"

## 🛠️ 可用的 MCP 工具

配置完成后，你可以通过自然语言与思源笔记交互。服务器提供 15 个核心工具：

### 🔍 搜索
- **unified_search** - 统一搜索工具：支持按内容、文件名、标签或任意组合搜索

### 📄 文档操作
- **get_document_content** - 获取文档的 Markdown 内容
- **create_document** - 创建新文档
- **append_to_document** - 追加内容到现有文档
- **update_document** - 更新（覆盖）文档内容
- **move_documents** - 移动一个或多个文档到新位置
- **get_document_tree** - 获取指定深度的文档树结构

### 📅 今日笔记
- **append_to_daily_note** - 追加到今日笔记（如需要会自动创建）

### 📚 笔记本管理
- **list_notebooks** - 列出所有笔记本
- **get_recently_updated_documents** - 获取最近更新的文档

### 📸 快照管理
- **create_snapshot** - 创建数据快照用于备份
- **list_snapshots** - 列出可用的快照
- **rollback_to_snapshot** - 回滚到指定快照

### 🏷️ 标签管理
- **list_all_tags** - 列出工作空间中的所有标签
- **batch_replace_tag** - 批量替换或删除标签

### 使用示例

用自然语言向你的 AI 助手提问：

```
"列出我的所有思源笔记本"
"搜索关于机器学习的文档"
"在工作笔记本中创建一个名为'项目想法'的新文档"
"显示最近修改的10个文档"
"追加'会议记录：讨论了第四季度目标'到今天的日记"
"在进行重大更改前创建一个快照"
"'项目'笔记本的树形结构是什么？"
"将文档 X 移动到工作笔记本的根目录"
"将文档 X 和 Y 移动到文档 Z 下面"
```

## 📖 工具参数参考

### move_documents

移动一个或多个文档到新位置。

**参数：**
- `from_ids` (string[]) - **必需**。要移动的文档 ID 数组
  - 对于单个文档，使用包含一个元素的数组：`["20210101000000-abc1234"]`
  - 对于多个文档：`["20210101000000-abc1234", "20210102000000-def5678"]`
- `to_parent_id` (string) - **选项 1**：目标父文档 ID。文档将作为子文档移动到此文档下。不能与 `to_notebook_root` 同时使用。
- `to_notebook_root` (string) - **选项 2**：目标笔记本 ID。文档将移动到此笔记本的根目录（顶级）。不能与 `to_parent_id` 同时使用。

**重要：** 必须提供恰好一个目标：`to_parent_id` 或 `to_notebook_root`。

**示例：**
```typescript
// 移动单个文档到笔记本根目录
{
  from_ids: ["20210101000000-abc1234"],
  to_notebook_root: "20210101000000-notebook1"
}

// 移动多个文档到另一个文档下
{
  from_ids: ["20210101000000-abc1234", "20210102000000-def5678"],
  to_parent_id: "20210103000000-parent99"
}
```

### batch_replace_tag

批量替换所有文档中标签的出现。

**参数：**
- `old_tag` (string) - **必需**。要替换的标签名（不带 # 符号）
- `new_tag` (string) - **必需**。新标签名（不带 # 符号，使用空字符串表示删除）

**示例：**
```typescript
// 替换标签
{
  old_tag: "项目",
  new_tag: "工作项目"
}

// 删除标签
{
  old_tag: "已弃用",
  new_tag: ""
}
```

## 🔧 高级：作为 TypeScript 库使用

虽然主要设计为 MCP 服务器，你也可以在自己的项目中将此包作为 TypeScript 库使用：

```typescript
import { createSiyuanTools } from 'siyuan-mcp-server';

// 创建实例
const siyuan = createSiyuanTools('http://127.0.0.1:6806', 'your-token');

// 搜索操作
const files = await siyuan.searchByFileName('关键词', 10);
const blocks = await siyuan.searchByContent('内容', 20);

// 文档操作
const content = await siyuan.getFileContent(documentId);
await siyuan.createFile('notebookId', '/路径/文档', '# 标题\n\n内容');
await siyuan.appendToFile(documentId, '新内容');
await siyuan.overwriteFile(documentId, '替换的内容');

// 今日笔记
await siyuan.appendToDailyNote('notebookId', '今天我学到了...');

// 笔记本操作
const notebooks = await siyuan.listNotebooks();

// SQL 查询
const results = await siyuan.search.query(`
  SELECT * FROM blocks 
  WHERE type='d' AND content LIKE '%关键词%'
  ORDER BY updated DESC
  LIMIT 10
`);

// 直接 API 访问
await siyuan.block.insertBlockAfter(blockId, '新块内容');
await siyuan.document.moveDocument(['doc1', 'doc2'], 'targetNotebookId');
const tree = await siyuan.document.getDocTree('notebookId', 2);
```

### 类型定义

包含完整的 TypeScript 类型：

```typescript
import type {
  SiyuanConfig,
  SiyuanApiResponse,
  Block,
  Notebook,
  NotebookConf,
  DocTreeNode,
  SearchOptions
} from 'siyuan-mcp-server';
```

## 💻 开发

### 设置

```bash
# 克隆并安装
git clone https://github.com/yourusername/siyuan-mcp.git
cd siyuan-mcp
npm install

# 构建
npm run build

# 监听模式（自动重新构建）
npm run watch

# 代码检查
npm run lint

# 格式化
npm run format
```

### 手动测试

```bash
# 手动启动 stdio 服务器
npm run mcp:stdio -- --token YOUR_TOKEN --baseUrl http://127.0.0.1:6806

# 启动 HTTP 服务器（用于 Web 客户端）
npm run mcp:http -- --token YOUR_TOKEN --port 3000 --baseUrl http://127.0.0.1:6806
```

## 🏗️ 架构

```
siyuan-mcp/
├── src/                    # 核心 TypeScript 库
│   ├── api/               # 思源 API 客户端
│   ├── types/             # 类型定义
│   └── utils/             # 辅助工具
├── mcp-server/            # MCP 服务器实现
│   ├── bin/               # CLI 入口点
│   ├── core/              # MCP 服务器核心
│   ├── handlers/          # 工具处理器
│   └── transports/        # Stdio/HTTP 传输
└── dist/                  # 编译后的 JavaScript
```

## 🔧 技术栈

- **语言**: TypeScript 5.3+
- **运行时**: Node.js 18+
- **模块系统**: ES Modules
- **MCP SDK**: @modelcontextprotocol/sdk
- **协议**: MCP（模型上下文协议）

## ❓ 常见问题

### 如何获取思源 API Token？
1. 打开思源笔记
2. 进入 设置 → 关于 → API Token
3. 复制 Token

### 如何找到笔记本 ID？
询问你的 MCP 客户端："列出我的所有思源笔记本"，它会显示 ID。

或者通过编程方式：
```typescript
const notebooks = await siyuan.listNotebooks();
console.log(notebooks.map(nb => `${nb.name}: ${nb.id}`));
```

### 服务器无法工作，应该检查什么？
1. 思源笔记是否正在运行？（默认：http://127.0.0.1:6806）
2. API Token 是否正确？
3. 配置后是否重启了 MCP 客户端？
4. 检查 MCP 客户端中的日志

### 可以使用不同的思源端口吗？
可以！只需更新 `baseUrl` 参数：
```json
"--baseUrl", "http://127.0.0.1:YOUR_PORT"
```

### 是否支持远程思源实例？
支持！将 `baseUrl` 指向你的远程实例：
```json
"--baseUrl", "http://your-server.com:6806"
```

## 🤝 贡献

欢迎贡献！请随时提交问题和拉取请求。

## 📄 许可证

Apache-2.0

## 🔗 相关项目

- [思源笔记](https://github.com/siyuan-note/siyuan) - 思源笔记官方仓库
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP 文档
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) - 官方 MCP SDK

## 🙏 致谢

本项目主要由 AI 辅助开发，基于优秀的[思源笔记](https://github.com/siyuan-note/siyuan)项目构建。
