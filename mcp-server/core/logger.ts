/**
 * 简单的日志记录器实现
 */

import type { Logger } from './types.js';

export class ConsoleLogger implements Logger {
  constructor(private prefix: string = '[SiYuan-MCP]') {}

  debug(message: string, ...args: any[]): void {
    console.error(`${this.prefix} [DEBUG]`, message, ...args);
  }

  info(message: string, ...args: any[]): void {
    console.error(`${this.prefix} [INFO]`, message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.error(`${this.prefix} [WARN]`, message, ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(`${this.prefix} [ERROR]`, message, ...args);
  }
}
