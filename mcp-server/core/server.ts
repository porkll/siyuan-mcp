/**
 * SiYuan MCP 服务器核心
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createSiyuanTools } from '../../src/index.js';
import type { ServerConfig, ExecutionContext, MCPTool } from './types.js';
import { DefaultToolRegistry } from './registry.js';
import { ConsoleLogger } from './logger.js';
import { createAllHandlers } from '../handlers/index.js';

/**
 * SiYuan MCP 服务器
 */
export class SiyuanMCPServer {
  private mcpServer: Server;
  private registry = new DefaultToolRegistry();
  private context: ExecutionContext;
  private logger = new ConsoleLogger();

  constructor(config: ServerConfig) {
    // 初始化 SiYuan 工具
    const siyuan = createSiyuanTools(config.baseUrl, config.token);

    // 创建执行上下文
    this.context = {
      siyuan,
      config,
      logger: this.logger,
    };

    // 注册所有工具处理器
    this.registerHandlers();

    // 创建 MCP 服务器实例
    this.mcpServer = new Server(
      {
        name: config.name || 'siyuan-mcp-server',
        version: config.version || '0.1.0',
      },
      {
        capabilities: {
          tools: {},
          prompts: {},
        },
      }
    );

    // 设置请求处理器
    this.setupRequestHandlers();
  }

  /**
   * 注册所有工具处理器
   */
  private registerHandlers(): void {
    const handlers = createAllHandlers();
    for (const handler of handlers) {
      this.registry.register(handler);
      this.logger.debug(`Registered tool: ${handler.name}`);
    }
  }

  /**
   * 设置 MCP 请求处理器
   */
  private setupRequestHandlers(): void {
    // 处理工具列表请求
    this.mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: MCPTool[] = this.registry.getAll().map((handler) => ({
        name: handler.name,
        description: handler.description,
        inputSchema: handler.inputSchema,
      }));

      this.logger.debug(`Listing ${tools.length} tools`);
      return { tools };
    });

    // 处理提示词列表请求
    this.mcpServer.setRequestHandler(ListPromptsRequestSchema, async () => {
      return {
        prompts: [
          {
            name: 'siyuan-usage-guide',
            description: 'SiYuan MCP 服务器的使用指南和最佳实践',
          },
        ],
      };
    });

    // 处理获取提示词请求
    this.mcpServer.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name } = request.params;

      if (name === 'siyuan-usage-guide') {
        const guide = this.getUsageGuide();
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: '请阅读 SiYuan MCP 服务器的使用指南',
              },
            },
            {
              role: 'assistant',
              content: {
                type: 'text',
                text: guide,
              },
            },
          ],
        };
      }

      throw new Error(`Unknown prompt: ${name}`);
    });

    // 处理工具调用请求
    this.mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      this.logger.info(`Tool called: ${name}`);

      try {
        const handler = this.registry.get(name);
        if (!handler) {
          throw new Error(`Unknown tool: ${name}`);
        }

        // 执行工具
        const result = await handler.execute(args || {}, this.context);

        // 格式化返回结果（符合 MCP 协议）
        // 处理 void 返回值（undefined）
        let text: string;
        if (result === undefined) {
          text = 'Success';
        } else if (typeof result === 'string') {
          text = result;
        } else {
          text = JSON.stringify(result, null, 2);
        }

        return {
          content: [
            {
              type: 'text' as const,
              text,
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`Tool execution failed: ${errorMessage}`);

        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * 获取使用指南内容
   */
  private getUsageGuide(): string {
    return `# SiYuan MCP 服务器使用指南

## 概述

SiYuan MCP 服务器提供了一套工具用于操作思源笔记，包括搜索、文档管理、快照备份等功能。

## 重要提示

### 数据安全

⚠️ **在执行批量修改或删除操作前，请务必先创建快照！**

\`\`\`
1. 使用 create_snapshot 创建快照（建议添加描述说明）
2. 执行修改操作
3. 如果出错，使用 list_snapshots 查看快照列表
4. 使用 rollback_snapshot 回滚到指定快照
\`\`\`

### 工作流程建议

1. **搜索文档**：使用 \`search_by_filename\` 或 \`search_by_content\` 查找目标文档
2. **获取内容**：使用 \`get_document_content\` 查看文档内容
3. **创建快照**：使用 \`create_snapshot\` 保存当前状态
4. **修改文档**：使用 \`update_document\`、\`append_to_document\` 等修改内容
5. **验证结果**：再次获取内容确认修改正确
6. **必要时回滚**：如果出错，使用 \`rollback_snapshot\` 恢复

## 工具分类

### 搜索工具（3个）
- \`search_by_filename\`: 按文件名搜索文档
- \`search_by_content\`: 按内容搜索文档
- \`sql_query\`: 执行 SQL 查询（高级用法）

### 文档工具（6个）
- \`get_document_content\`: 获取文档的 Markdown 内容
- \`create_document\`: 在指定笔记本创建新文档
- \`append_to_document\`: 向文档追加内容
- \`update_document\`: 更新（覆盖）文档内容
- \`append_to_daily_note\`: 追加内容到今日笔记
- \`move_document\`: 移动文档到其他位置

### 笔记本工具（2个）
- \`list_notebooks\`: 列出所有笔记本
- \`get_recently_updated_documents\`: 获取最近更新的文档

### 快照工具（3个）
- \`create_snapshot\`: 创建数据快照
- \`list_snapshots\`: 列出所有快照
- \`rollback_snapshot\`: 回滚到指定快照

## 使用示例

### 示例1：安全地批量修改文档

\`\`\`
1. create_snapshot(memo: "批量修改前的备份")
2. search_by_content(content: "需要修改的内容")
3. 对每个搜索结果：
   - get_document_content(document_id: "...")
   - 修改内容
   - update_document(document_id: "...", content: "新内容")
4. 验证修改结果
5. 如有问题：rollback_snapshot(snapshot_id: "...")
\`\`\`

### 示例2：创建每日记录

\`\`\`
1. list_notebooks() 获取笔记本列表
2. append_to_daily_note(notebook_id: "...", content: "今日总结...")
\`\`\`

### 示例3：整理文档结构

\`\`\`
1. create_snapshot(memo: "整理文档结构前")
2. search_by_filename(filename: "待整理的文档")
3. move_document(from_ids: "文档ID", to_id: "目标文档ID")
\`\`\`

## 注意事项

1. **文档 ID**：思源笔记中每个文档都有唯一的 ID（格式如 \`20240101120000-abc1234\`）
2. **路径格式**：创建文档时路径格式为 \`/folder/document\`（无需 .md 扩展名）
3. **Markdown 格式**：所有内容使用 Markdown 格式
4. **快照限制**：快照功能需要思源笔记开启数据仓库功能
5. **并发操作**：避免同时修改同一文档，可能导致冲突

## 最佳实践

✅ **推荐做法**：
- 在批量操作前创建快照
- 先搜索确认目标文档，再进行修改
- 修改后验证结果
- 保持快照命名清晰（包含操作说明）

❌ **避免做法**：
- 不创建快照就执行批量删除
- 不验证搜索结果就批量修改
- 对不熟悉的文档执行覆盖操作
- 忽略错误继续执行后续操作
`;
  }

  /**
   * 获取底层 MCP 服务器实例
   */
  getMCPServer(): Server {
    return this.mcpServer;
  }

  /**
   * 获取工具注册表
   */
  getRegistry(): DefaultToolRegistry {
    return this.registry;
  }

  /**
   * 获取日志记录器
   */
  getLogger(): ConsoleLogger {
    return this.logger;
  }
}
