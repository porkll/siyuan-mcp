#!/usr/bin/env node
/**
 * SiYuan MCP Server - HTTP/SSE Transport
 *
 * Usage:
 *   node http.js --token <API_TOKEN> [--baseUrl <BASE_URL>] [--port <PORT>]
 *
 * Example:
 *   node http.js --token YOUR_API_TOKEN --port 3000
 */

import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SiyuanMCPServer } from '../core/server.js';
import type { ServerConfig } from '../core/types.js';

/**
 * 解析命令行参数
 */
function parseArgs(): Partial<ServerConfig> & { port?: number } {
  const args = process.argv.slice(2);
  const config: Partial<ServerConfig> & { port?: number } = {};

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
function printHelp(): void {
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
  node http.js --token YOUR_API_TOKEN
  node http.js --token YOUR_API_TOKEN --port 3000
  node http.js --token YOUR_API_TOKEN --baseUrl http://192.168.1.100:6806 --port 8080

Endpoints:
  GET  /mcp    - Establish SSE connection
  POST /mcp    - Send JSON-RPC message
  DELETE /mcp  - Close session
  `);
}

/**
 * 解析请求体
 */
async function parseRequestBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : undefined);
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
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
  const serverConfig: ServerConfig = {
    token: config.token,
    baseUrl: config.baseUrl || 'http://127.0.0.1:6806',
    name: 'siyuan-mcp-server-http',
    version: '0.1.0',
  };

  const port = config.port || 3000;

  // 创建 MCP 服务器实例
  const mcpServer = new SiyuanMCPServer(serverConfig);
  const logger = mcpServer.getLogger();

  // 创建单一的 StreamableHTTPServerTransport 实例
  // 该传输会自动管理多个会话
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: async (id: string) => {
      logger.info(`Session initialized: ${id}`);
    },
    onsessionclosed: async (id: string) => {
      logger.info(`Session closed: ${id}`);
    },
  });

  // 连接到 MCP 服务器（只需连接一次）
  await mcpServer.getMCPServer().connect(transport);

  // 创建 HTTP 服务器
  const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    // 设置 CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Mcp-Session-Id');

    // 处理 OPTIONS 预检请求
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // 只处理 /mcp 路径
    if (req.url !== '/mcp') {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    try {
      // 解析请求体（对于 POST 请求）
      const parsedBody = req.method === 'POST' ? await parseRequestBody(req) : undefined;

      // 处理请求（transport 会自动管理会话）
      await transport.handleRequest(req, res, parsedBody);
    } catch (error) {
      logger.error(`Request error: ${error}`);
      if (!res.headersSent) {
        res.writeHead(500);
        res.end(`Internal Server Error: ${error}`);
      }
    }
  });

  // 启动服务器
  httpServer.listen(port, () => {
    console.log(`
✅ SiYuan MCP Server (HTTP/SSE) is running!

Server Info:
  - Port: ${port}
  - Endpoint: http://localhost:${port}/mcp
  - SiYuan Base URL: ${serverConfig.baseUrl}

Available Methods:
  - GET  http://localhost:${port}/mcp - Establish SSE connection
  - POST http://localhost:${port}/mcp - Send JSON-RPC message
  - DELETE http://localhost:${port}/mcp - Close session

Example:
  curl -X POST http://localhost:${port}/mcp \\
    -H "Content-Type: application/json" \\
    -d '{"jsonrpc":"2.0","method":"initialize","id":1,"params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'

Press Ctrl+C to stop the server.
    `);
  });

  // 优雅关闭
  process.on('SIGINT', async () => {
    console.log('\nShutting down server...');
    httpServer.close();
    await transport.close();
    process.exit(0);
  });
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
