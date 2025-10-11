/**
 * 工具注册表实现
 */
export class DefaultToolRegistry {
    handlers = new Map();
    register(handler) {
        if (this.handlers.has(handler.name)) {
            throw new Error(`Tool '${handler.name}' is already registered`);
        }
        this.handlers.set(handler.name, handler);
    }
    get(name) {
        return this.handlers.get(name);
    }
    getAll() {
        return Array.from(this.handlers.values());
    }
    has(name) {
        return this.handlers.has(name);
    }
    clear() {
        this.handlers.clear();
    }
}
//# sourceMappingURL=registry.js.map