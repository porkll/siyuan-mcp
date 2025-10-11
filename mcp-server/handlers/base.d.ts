/**
 * 工具处理器基类
 */
import type { ToolHandler, JSONSchema, ExecutionContext } from '../core/types.js';
export declare abstract class BaseToolHandler<TArgs = any, TResult = any> implements ToolHandler<TArgs, TResult> {
    abstract readonly name: string;
    abstract readonly description: string;
    abstract readonly inputSchema: JSONSchema;
    abstract execute(args: TArgs, context: ExecutionContext): Promise<TResult>;
    /**
     * 默认的参数验证（子类可覆盖）
     */
    validate(args: any): args is TArgs;
    /**
     * 包装执行，添加日志和错误处理
     */
    safeExecute(args: any, context: ExecutionContext): Promise<TResult>;
}
//# sourceMappingURL=base.d.ts.map