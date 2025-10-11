/**
 * 工具注册表实现
 */
import type { ToolHandler, ToolRegistry } from './types.js';
export declare class DefaultToolRegistry implements ToolRegistry {
    private handlers;
    register(handler: ToolHandler): void;
    get(name: string): ToolHandler | undefined;
    getAll(): ToolHandler[];
    has(name: string): boolean;
    clear(): void;
}
//# sourceMappingURL=registry.d.ts.map