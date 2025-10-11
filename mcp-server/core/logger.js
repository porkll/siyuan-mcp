/**
 * 简单的日志记录器实现
 */
export class ConsoleLogger {
    prefix;
    constructor(prefix = '[SiYuan-MCP]') {
        this.prefix = prefix;
    }
    debug(message, ...args) {
        console.error(`${this.prefix} [DEBUG]`, message, ...args);
    }
    info(message, ...args) {
        console.error(`${this.prefix} [INFO]`, message, ...args);
    }
    warn(message, ...args) {
        console.error(`${this.prefix} [WARN]`, message, ...args);
    }
    error(message, ...args) {
        console.error(`${this.prefix} [ERROR]`, message, ...args);
    }
}
//# sourceMappingURL=logger.js.map