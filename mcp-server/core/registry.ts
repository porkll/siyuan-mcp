/**
 * 工具注册表实现
 */

import type { ToolHandler, ToolRegistry } from './types.js';

export class DefaultToolRegistry implements ToolRegistry {
  private handlers = new Map<string, ToolHandler>();

  register(handler: ToolHandler): void {
    if (this.handlers.has(handler.name)) {
      throw new Error(`Tool '${handler.name}' is already registered`);
    }
    this.handlers.set(handler.name, handler);
  }

  get(name: string): ToolHandler | undefined {
    return this.handlers.get(name);
  }

  getAll(): ToolHandler[] {
    return Array.from(this.handlers.values());
  }

  has(name: string): boolean {
    return this.handlers.has(name);
  }

  clear(): void {
    this.handlers.clear();
  }
}
