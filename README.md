# SiYuan MCP Server

[中文文档](./README_zh.md) | English

A Model Context Protocol (MCP) server for SiYuan Note, enabling AI assistants like Claude, Cursor, and other MCP-compatible tools to interact with your SiYuan notes seamlessly.

## ⚠️ Important Notice | 重要声明

**English:**

The code in this project is primarily developed with AI assistance. While functional testing has been performed, comprehensive code review has not been completed. Before using this project, please be aware of and accept the following:

- The code may contain undiscovered issues or potential risks
- Conduct necessary code reviews and testing before use
- Users assume all risks and responsibilities arising from the use of this project
- Thorough validation is recommended before production use

**Use with caution and at your own risk.**

---

**中文：**

本项目代码主要由 AI 辅助开发，仅进行了功能性测试，未对所有代码进行完整审查。使用本项目前，请充分了解并接受以下内容：

- 代码可能存在未发现的问题或潜在风险
- 请在使用前进行必要的代码审查和测试
- 使用者需自行承担使用本项目所产生的风险和责任
- 建议在生产环境使用前进行充分的验证

**请谨慎使用，并对自己的选择负责。**

## ✨ Features

- 🚀 Full MCP (Model Context Protocol) implementation
- 📝 15 essential tools for comprehensive SiYuan Note operations
- 🔍 Unified search (content, filename, tag, and combinations)
- 📁 Document management (create, read, update, move, tree)
- 📅 Daily note support with auto-creation
- 📚 Notebook operations
- 📸 Snapshot management (backup & restore)
- 🏷️ Tag management (list, replace)
- 💻 Written in TypeScript with full type definitions
- 🌐 Works with Claude Desktop, Cursor, and any MCP-compatible client

## 📦 Installation

### Option 1: Install from Source (Recommended)

```bash
# Clone the repository
git clone https://github.com/porkll/siyuan-mcp.git
cd siyuan-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Install globally
npm install -g .
```

### Option 2: Install from npm

```bash
# Install globally
npm install -g @porkll/siyuan-mcp

# Or use npx (no installation needed)
npx @porkll/siyuan-mcp
```

After global installation, the `siyuan-mcp` command will be available globally.

## 🔧 Configuration

### Prerequisites

1. **Get your SiYuan API Token:**
   - Open SiYuan Note
   - Go to Settings → About → API Token
   - Copy the token

2. **Ensure SiYuan is running:**
   - Default URL: `http://127.0.0.1:6806`
   - If using a different port, adjust the `baseUrl` accordingly

### Configure for Cursor

Edit your MCP configuration file at `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "siyuan-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@porkll/siyuan-mcp",
        "stdio",
        "--token",
        "YOUR_API_TOKEN_HERE",
        "--baseUrl",
        "http://127.0.0.1:6806"
      ]
    }
  }
}
```

**Note**: If you installed globally, you can use `"command": "siyuan-mcp"` instead of `"command": "npx"`.

### Configure for Claude Desktop

Edit the configuration file at:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "siyuan-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@porkll/siyuan-mcp",
        "stdio",
        "--token",
        "YOUR_API_TOKEN_HERE",
        "--baseUrl",
        "http://127.0.0.1:6806"
      ]
    }
  }
}
```

**Note**: If you installed globally, you can use `"command": "siyuan-mcp"` instead of `"command": "npx"`.

### Verify Installation

After configuration, restart your MCP client (Cursor/Claude Desktop) and try:
- "List all my SiYuan notebooks"
- "Search for documents containing 'project plan'"
- "Create a new meeting note in my work notebook"
- "Show me the 5 most recently modified documents"

## 🛠️ Available MCP Tools

Once configured, you can interact with SiYuan through natural language. The server provides 15 essential tools:

### 🔍 Search
- **unified_search** - Unified search tool: search by content, filename, tag, or any combination

### 📄 Document Operations
- **get_document_content** - Get the markdown content of a document
- **create_document** - Create a new document
- **append_to_document** - Append content to an existing document
- **update_document** - Update (overwrite) document content
- **move_documents** - Move one or more documents to a new location
- **get_document_tree** - Get document tree structure with specified depth

### 📅 Daily Note
- **append_to_daily_note** - Append to today's daily note (auto-creates if needed)

### 📚 Notebook Management
- **list_notebooks** - List all notebooks
- **get_recently_updated_documents** - Get recently updated documents

### 📸 Snapshot Management
- **create_snapshot** - Create a data snapshot for backup
- **list_snapshots** - List available snapshots
- **rollback_to_snapshot** - Rollback to a specific snapshot

### 🏷️ Tag Management
- **list_all_tags** - List all unique tags in workspace
- **batch_replace_tag** - Batch replace or remove tags across all documents

### Usage Examples

Ask your AI assistant naturally:

```
"List all my SiYuan notebooks"
"Search for documents about machine learning"
"Create a new document called 'Project Ideas' in my Work notebook"
"Show me the 10 most recently modified documents"
"Append 'Meeting notes: discussed Q4 goals' to today's daily note"
"Create a snapshot before I make major changes"
"What's the tree structure of my 'Projects' notebook?"
"Move document X to the root of my Work notebook"
"Move documents X and Y under document Z"
```

## 📖 Tool Parameters Reference

### move_documents

Move one or more documents to a new location.

**Parameters:**
- `from_ids` (string[]) - **Required**. Array of document IDs to move
  - For a single document, use an array with one element: `["20210101000000-abc1234"]`
  - For multiple documents: `["20210101000000-abc1234", "20210102000000-def5678"]`
- `to_parent_id` (string) - **OPTION 1**: Target parent document ID. Documents will be moved under this document as children. Cannot be used together with `to_notebook_root`.
- `to_notebook_root` (string) - **OPTION 2**: Target notebook ID. Documents will be moved to the root (top level) of this notebook. Cannot be used together with `to_parent_id`.

**Important:** You must provide EXACTLY ONE destination: either `to_parent_id` OR `to_notebook_root`.

**Examples:**
```typescript
// Move single document to notebook root
{
  from_ids: ["20210101000000-abc1234"],
  to_notebook_root: "20210101000000-notebook1"
}

// Move multiple documents under another document
{
  from_ids: ["20210101000000-abc1234", "20210102000000-def5678"],
  to_parent_id: "20210103000000-parent99"
}
```

### batch_replace_tag

Batch replace all occurrences of a tag across all documents.

**Parameters:**
- `old_tag` (string) - **Required**. Tag name to replace (without # symbol)
- `new_tag` (string) - **Required**. New tag name (without # symbol, use empty string to remove)

**Examples:**
```typescript
// Replace tag
{
  old_tag: "project",
  new_tag: "work-project"
}

// Remove tag
{
  old_tag: "deprecated",
  new_tag: ""
}
```

## 🔧 Advanced: Using as TypeScript Library

While primarily designed as an MCP server, you can also use this package as a TypeScript library in your own projects:

```typescript
import { createSiyuanTools } from '@porkll/siyuan-mcp';

// Create an instance
const siyuan = createSiyuanTools('http://127.0.0.1:6806', 'your-token');

// Search operations
const files = await siyuan.searchByFileName('keyword', 10);
const blocks = await siyuan.searchByContent('content', 20);

// Document operations
const content = await siyuan.getFileContent(documentId);
await siyuan.createFile('notebookId', '/path/to/doc', '# Title\n\nContent');
await siyuan.appendToFile(documentId, 'New content');
await siyuan.overwriteFile(documentId, 'Replaced content');

// Daily note
await siyuan.appendToDailyNote('notebookId', 'Today I learned...');

// Notebook operations
const notebooks = await siyuan.listNotebooks();

// SQL queries
const results = await siyuan.search.query(`
  SELECT * FROM blocks 
  WHERE type='d' AND content LIKE '%keyword%'
  ORDER BY updated DESC
  LIMIT 10
`);

// Direct API access
await siyuan.block.insertBlockAfter(blockId, 'New block content');
await siyuan.document.moveDocument(['doc1', 'doc2'], 'targetNotebookId');
const tree = await siyuan.document.getDocTree('notebookId', 2);
```

### Type Definitions

Full TypeScript types are included:

```typescript
import type {
  SiyuanConfig,
  SiyuanApiResponse,
  Block,
  Notebook,
  NotebookConf,
  DocTreeNode,
  SearchOptions
} from '@porkll/siyuan-mcp';
```

## 💻 Development

### Setup

```bash
# Clone and install
git clone https://github.com/porkll/siyuan-mcp.git
cd siyuan-mcp
npm install

# Build
npm run build

# Watch mode (auto-rebuild)
npm run watch

# Lint
npm run lint

# Format
npm run format
```

### Manual Testing

```bash
# Start stdio server manually
npm run mcp:stdio -- --token YOUR_TOKEN --baseUrl http://127.0.0.1:6806

# Start HTTP server (for web clients)
npm run mcp:http -- --token YOUR_TOKEN --port 3000 --baseUrl http://127.0.0.1:6806
```

## 🏗️ Architecture

```
siyuan-mcp/
├── src/                    # Core TypeScript library
│   ├── api/               # SiYuan API clients
│   ├── types/             # Type definitions
│   └── utils/             # Helper utilities
├── mcp-server/            # MCP server implementation
│   ├── bin/               # CLI entry points
│   ├── core/              # MCP server core
│   ├── handlers/          # Tool handlers
│   └── transports/        # Stdio/HTTP transports
└── dist/                  # Compiled JavaScript
```

## 🔧 Tech Stack

- **Language**: TypeScript 5.3+
- **Runtime**: Node.js 18+
- **Module System**: ES Modules
- **MCP SDK**: @modelcontextprotocol/sdk
- **Protocol**: MCP (Model Context Protocol)

## ❓ FAQ

### How do I get my SiYuan API Token?
1. Open SiYuan Note
2. Go to Settings → About → API Token
3. Copy the token

### How do I find my notebook ID?
Ask your MCP client: "List all my SiYuan notebooks" and it will show IDs.

Or programmatically:
```typescript
const notebooks = await siyuan.listNotebooks();
console.log(notebooks.map(nb => `${nb.name}: ${nb.id}`));
```

### The server isn't working, what should I check?
1. Is SiYuan running? (default: http://127.0.0.1:6806)
2. Is your API token correct?
3. Did you restart your MCP client after configuration?
4. Check the logs in your MCP client

### Can I use a different SiYuan port?
Yes! Just update the `baseUrl` parameter:
```json
"--baseUrl", "http://127.0.0.1:YOUR_PORT"
```

### Does this work with remote SiYuan instances?
Yes! Point `baseUrl` to your remote instance:
```json
"--baseUrl", "http://your-server.com:6806"
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 📄 License

Apache-2.0

## 🔗 Related Projects

- [SiYuan Note](https://github.com/siyuan-note/siyuan) - Official SiYuan Note repository
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP documentation
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) - Official MCP SDK

## 🙏 Acknowledgments

This project is primarily developed with AI assistance and built on top of the excellent [SiYuan Note](https://github.com/siyuan-note/siyuan) project.
