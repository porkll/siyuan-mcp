/**
 * SiYuan MCP 服务器核心
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { createSiyuanTools } from '../../dist/index.js';
import { DefaultToolRegistry } from './registry.js';
import { ConsoleLogger } from './logger.js';
import { createAllHandlers } from '../handlers/index.js';
/**
 * SiYuan MCP 服务器
 */
export class SiyuanMCPServer {
    config;
    mcpServer;
    registry = new DefaultToolRegistry();
    context;
    logger = new ConsoleLogger();
    constructor(config) {
        this.config = config;
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
        this.mcpServer = new Server({
            name: config.name || 'siyuan-mcp-server',
            version: config.version || '0.1.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        // 设置请求处理器
        this.setupRequestHandlers();
    }
    /**
     * 注册所有工具处理器
     */
    registerHandlers() {
        const handlers = createAllHandlers();
        for (const handler of handlers) {
            this.registry.register(handler);
            this.logger.debug(`Registered tool: ${handler.name}`);
        }
    }
    /**
     * 设置 MCP 请求处理器
     */
    setupRequestHandlers() {
        // 处理工具列表请求
        this.mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
            const tools = this.registry.getAll().map((handler) => ({
                name: handler.name,
                description: handler.description,
                inputSchema: handler.inputSchema,
            }));
            this.logger.debug(`Listing ${tools.length} tools`);
            return { tools };
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
                // 格式化返回结果
                const response = {
                    content: [
                        {
                            type: 'text',
                            text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
                        },
                    ],
                };
                return response;
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logger.error(`Tool execution failed: ${errorMessage}`);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${errorMessage}`,
                        },
                    ],
                    isError: true,
                };
            }
        });
    }
    /**
     * 获取底层 MCP 服务器实例
     */
    getMCPServer() {
        return this.mcpServer;
    }
    /**
     * 获取工具注册表
     */
    getRegistry() {
        return this.registry;
    }
    /**
     * 获取日志记录器
     */
    getLogger() {
        return this.logger;
    }
}
//# sourceMappingURL=server.js.map