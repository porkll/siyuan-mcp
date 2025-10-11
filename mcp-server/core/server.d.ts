/**
 * SiYuan MCP 服务器核心
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { ServerConfig } from './types.js';
import { DefaultToolRegistry } from './registry.js';
import { ConsoleLogger } from './logger.js';
/**
 * SiYuan MCP 服务器
 */
export declare class SiyuanMCPServer {
    private config;
    private mcpServer;
    private registry;
    private context;
    private logger;
    constructor(config: ServerConfig);
    /**
     * 注册所有工具处理器
     */
    private registerHandlers;
    /**
     * 设置 MCP 请求处理器
     */
    private setupRequestHandlers;
    /**
     * 获取底层 MCP 服务器实例
     */
    getMCPServer(): Server;
    /**
     * 获取工具注册表
     */
    getRegistry(): DefaultToolRegistry;
    /**
     * 获取日志记录器
     */
    getLogger(): ConsoleLogger;
}
//# sourceMappingURL=server.d.ts.map