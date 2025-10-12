#!/usr/bin/env node
/**
 * SiYuan MCP Server - CLI Entry Point
 *
 * Usage:
 *   siyuan-mcp stdio --token <TOKEN>
 *   siyuan-mcp http --token <TOKEN> --port <PORT>
 *
 * Global Installation:
 *   npm install -g @siyuan-note/mcp-server
 *   siyuan-mcp --help
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 打印帮助信息
 */
function printHelp() {
  console.log(`
SiYuan MCP Server - Model Context Protocol Server for SiYuan Note

Usage:
  siyuan-mcp <mode> [options]

Modes:
  stdio               Run in Stdio mode (for Claude Desktop, etc.)
  http                Run in HTTP/SSE mode (for web clients)

Options:
  --token <string>    SiYuan API token (required)
  --baseUrl <url>     SiYuan server URL (default: http://127.0.0.1:6806)
  --port, -p <num>    HTTP server port (default: 3000, HTTP mode only)
  --help, -h          Show this help message
  --version, -v       Show version

Examples:
  # Stdio mode (for Claude Desktop)
  siyuan-mcp stdio --token YOUR_API_TOKEN

  # HTTP mode
  siyuan-mcp http --token YOUR_API_TOKEN --port 3000

  # Custom SiYuan server
  siyuan-mcp stdio --token YOUR_API_TOKEN --baseUrl http://192.168.1.100:6806

Configuration for Claude Desktop:
  Add to your Claude Desktop MCP settings:
  {
    "mcpServers": {
      "siyuan": {
        "command": "siyuan-mcp",
        "args": ["stdio", "--token", "YOUR_TOKEN"]
      }
    }
  }

For more information:
  https://github.com/siyuan-note/mcp-server
`);
}

/**
 * 打印版本信息
 */
function printVersion() {
  // 从 package.json 读取版本
  try {
    const packageJsonPath = join(__dirname, '../../package.json');
    const pkgContent = readFileSync(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(pkgContent);
    console.log(`v${pkg.version}`);
  } catch {
    console.log('v0.1.0');
  }
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);

  // 处理帮助和版本
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  if (args.includes('--version') || args.includes('-v')) {
    printVersion();
    process.exit(0);
  }

  // 获取模式
  const mode = args[0];

  if (mode !== 'stdio' && mode !== 'http') {
    console.error(`Error: Unknown mode "${mode}"`);
    console.error('Run "siyuan-mcp --help" for usage information.');
    process.exit(1);
  }

  // 检查 token
  if (!args.includes('--token')) {
    console.error('Error: --token is required');
    console.error('Run "siyuan-mcp --help" for usage information.');
    process.exit(1);
  }

  // 构建子进程参数
  const scriptPath = mode === 'stdio'
    ? join(__dirname, 'stdio.js')
    : join(__dirname, 'http.js');

  const childArgs = args.slice(1); // 移除 mode，保留其他参数

  // 启动子进程
  const child = spawn('node', [scriptPath, ...childArgs], {
    stdio: 'inherit',
    shell: false,
  });

  // 处理子进程退出
  child.on('exit', (code) => {
    process.exit(code || 0);
  });

  // 处理错误
  child.on('error', (error) => {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  });

  // 优雅退出
  process.on('SIGINT', () => {
    child.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    child.kill('SIGTERM');
  });
}

// 启动
main();
