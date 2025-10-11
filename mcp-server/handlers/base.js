/**
 * 工具处理器基类
 */
export class BaseToolHandler {
    /**
     * 默认的参数验证（子类可覆盖）
     */
    validate(args) {
        // 基础验证：检查必填字段
        if (this.inputSchema.required) {
            for (const field of this.inputSchema.required) {
                if (!(field in args)) {
                    throw new Error(`Missing required field: ${field}`);
                }
            }
        }
        return true;
    }
    /**
     * 包装执行，添加日志和错误处理
     */
    async safeExecute(args, context) {
        context.logger.debug(`Executing tool: ${this.name}`, args);
        try {
            this.validate(args);
            const result = await this.execute(args, context);
            context.logger.debug(`Tool ${this.name} completed successfully`);
            return result;
        }
        catch (error) {
            context.logger.error(`Tool ${this.name} failed:`, error);
            throw error;
        }
    }
}
//# sourceMappingURL=base.js.map