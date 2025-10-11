#!/usr/bin/env node
/**
 * SiYuan MCP Server - HTTP/SSE Transport
 *
 * 通过 HTTP 和 Server-Sent Events 通信的 MCP 服务器
 *
 * Usage:
 *   node http.js --token <API_TOKEN> [--baseUrl <BASE_URL>] [--port <PORT>]
 *
 * Example:
 *   node http.js --token 9vtvpbfnlsh7dcz8 --port 3000
 */
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { SiyuanMCPServer } from '../core/server.js';
/**
 * 解析命令行参数
 */
function parseArgs() {
    const args = process.argv.slice(2);
    const config = {};
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--token':
                if (i + 1 < args.length) {
                    config.token = args[++i];
                }
                break;
            case '--baseUrl':
                if (i + 1 < args.length) {
                    config.baseUrl = args[++i];
                }
                break;
            case '--port':
            case '-p':
                if (i + 1 < args.length) {
                    config.port = parseInt(args[++i]);
                }
                break;
            case '--help':
            case '-h':
                printHelp();
                process.exit(0);
        }
    }
    return config;
}
/**
 * 打印帮助信息
 */
function printHelp() {
    console.log(`
SiYuan MCP Server (HTTP/SSE Transport)

Usage:
  node http.js --token <API_TOKEN> [OPTIONS]

Required:
  --token <string>      SiYuan API token

Options:
  --baseUrl <string>    SiYuan base URL (default: http://127.0.0.1:6806)
  --port, -p <number>   HTTP server port (default: 3000)
  --help, -h            Show this help message

Example:
  node http.js --token 9vtvpbfnlsh7dcz8
  node http.js --token 9vtvpbfnlsh7dcz8 --port 3000
  node http.js --token 9vtvpbfnlsh7dcz8 --baseUrl http://192.168.1.100:6806 --port 8080
  `);
}
/**
 * 主函数
 */
async function main() {
    const config = parseArgs();
    // 验证必需参数
    if (!config.token) {
        console.error('Error: --token is required\n');
        printHelp();
        process.exit(1);
    }
    // 设置默认值
    const serverConfig = {
        token: config.token,
        baseUrl: config.baseUrl || 'http://127.0.0.1:6806',
        name: 'siyuan-mcp-server-http',
        version: '0.1.0',
    };
    const port = config.port || 3000;
    // 创建服务器
    const server = new SiyuanMCPServer(serverConfig);
    const logger = server.getLogger();
    // 创建 HTTP/SSE 传输层
    const transport = new SSEServerTransport('/message', {
        endpoint: `/sse`,
    });
    // 连接服务器
    await server.getMCPServer().connect(transport);
    // 启动 HTTP 服务器
    const httpServer = transport.createHttpServer();
    httpServer.listen(port);
    logger.info('SiYuan MCP Server started (HTTP/SSE transport)');
    logger.info(`HTTP server listening on http://localhost:${port}`);
    logger.info(`SSE endpoint: http://localhost:${port}/sse`);
    logger.info(`Message endpoint: http://localhost:${port}/message`);
    logger.info(`SiYuan Base URL: ${serverConfig.baseUrl}`);
    logger.info(`Token: ${serverConfig.token.substring(0, 8)}...`);
    logger.info(`Registered ${server.getRegistry().getAll().length} tools`);
    // 优雅关闭
    const shutdown = () => {
        logger.info('Shutting down...');
        httpServer.close(() => {
            logger.info('HTTP server closed');
            process.exit(0);
        });
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}
// 错误处理
process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection:', error);
    process.exit(1);
});
// 启动服务器
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=http.js.map