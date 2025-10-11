/**
 * 简单的日志记录器实现
 */
import type { Logger } from './types.js';
export declare class ConsoleLogger implements Logger {
    private prefix;
    constructor(prefix?: string);
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
}
//# sourceMappingURL=logger.d.ts.map