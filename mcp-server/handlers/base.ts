/**
 * 工具处理器基类
 */
import type { ToolHandler, JSONSchema, ExecutionContext } from '../core/types.js';

type ToolError = Error & { error_code?: string };

export abstract class BaseToolHandler<TArgs = any, TResult = any>
  implements ToolHandler<TArgs, TResult>
{
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly inputSchema: JSONSchema;
  abstract execute(args: TArgs, context: ExecutionContext): Promise<TResult>;

  /**
   * 默认的参数验证（子类可覆盖）
   */
  validate(args: any): args is TArgs {
    if (!args || typeof args !== 'object' || Array.isArray(args)) {
      this.fail('INVALID_ARGUMENT', 'Arguments must be an object');
    }
  
    if (this.inputSchema.required) {
      for (const field of this.inputSchema.required) {
        if (!(field in args)) {
          this.fail('MISSING_REQUIRED', `Missing required field: ${field}`);
        }
      }
    }
  
    return true;
  }

  protected fail(error_code: string, message: string): never {
    const err = new Error(message) as ToolError;
    err.error_code = error_code;
    throw err;
  }

  protected requireOneOf(args: Record<string, unknown>, fields: string[]): void {
    const present = fields.filter(
      (field) => args[field] !== undefined && args[field] !== null
    );

    if (present.length === 0) {
      this.fail('INVALID_ARGUMENT', `One of [${fields.join(', ')}] is required`);
    }
  }

  protected forbidTogether(args: Record<string, unknown>, fields: string[]): void {
    const present = fields.filter(
      (field) => args[field] !== undefined && args[field] !== null
    );

    if (present.length > 1) {
      this.fail('INVALID_SCOPE', `Fields are mutually exclusive: ${present.join(', ')}`);
    }
  }

  protected getNumberInRange(
    value: unknown,
    field: string,
    options: { min?: number; max?: number; defaultValue?: number } = {}
  ): number {
    const { min, max, defaultValue } = options;

    if (value === undefined || value === null) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      this.fail('INVALID_ARGUMENT', `Missing numeric field: ${field}`);
    }

    if (typeof value !== 'number' || Number.isNaN(value)) {
      this.fail('INVALID_ARGUMENT', `${field} must be a number`);
    }

    if (min !== undefined && value < min) {
      this.fail('OUT_OF_RANGE', `${field} must be >= ${min}`);
    }

    if (max !== undefined && value > max) {
      this.fail('OUT_OF_RANGE', `${field} must be <= ${max}`);
    }

    return value;
  }

  /**
   * 包装执行，添加日志和错误处理
   */
  async safeExecute(args: any, context: ExecutionContext): Promise<TResult> {
    context.logger.debug(`Executing tool: ${this.name}`, args);

    try {
      this.validate(args);
      const result = await this.execute(args, context);
      context.logger.debug(`Tool ${this.name} completed successfully`);
      return result;
    } catch (error) {
      context.logger.error(`Tool ${this.name} failed:`, error);
      throw error;
    }
  }
}