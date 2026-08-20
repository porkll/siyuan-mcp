/**
 * 工具处理器基类
 */

import type { ToolHandler, JSONSchema, ExecutionContext } from '../core/types.js';

export abstract class BaseToolHandler<TArgs = any, TResult = any>
  implements ToolHandler<TArgs, TResult>
{
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly inputSchema: JSONSchema;

  /**
   * 声明哪些参数字段是笔记本 ID，用于黑名单校验。
   * 子类按需覆盖，例如 ['notebook_id', 'to_notebook_root']。
   * 不覆盖则不做笔记本 ID 级别的黑名单校验。
   */
  readonly notebookIdFields: string[] = [];

  /**
   * 声明哪些参数字段是文档 ID，需要先解析为笔记本 ID 再校验黑名单。
   * 适用于以 document_id 为参数的工具（如 get/append/update_document）。
   */
  readonly documentIdFields: string[] = [];

  abstract execute(args: TArgs, context: ExecutionContext): Promise<TResult>;

  /**
   * 默认的参数验证（子类可覆盖）
   */
  validate(args: any): args is TArgs {
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
   * 黑名单校验：检查参数中的笔记本 ID 是否在黑名单中
   */
  private checkBlacklist(args: any, context: ExecutionContext): void {
    const blacklist = context.config.blacklistedNotebooks;
    if (!blacklist || blacklist.length === 0 || this.notebookIdFields.length === 0) {
      return;
    }

    for (const field of this.notebookIdFields) {
      const value = args[field];
      if (!value) continue;

      // 支持单个 ID 或 ID 数组
      const ids: string[] = Array.isArray(value) ? value : [value];
      for (const id of ids) {
        if (blacklist.includes(id)) {
          throw new Error(
            `Operation blocked: notebook "${id}" is in the blacklist. ` +
            `Tool "${this.name}" cannot operate on blacklisted notebooks.`
          );
        }
      }
    }
  }

  /**
   * 文档级黑名单校验：通过 SQL 查询 document_id 对应的 notebook_id，再检查黑名单。
   */
  private async checkDocumentBlacklist(args: any, context: ExecutionContext): Promise<void> {
    const blacklist = context.config.blacklistedNotebooks;
    if (!blacklist || blacklist.length === 0 || this.documentIdFields.length === 0) {
      return;
    }

    for (const field of this.documentIdFields) {
      const docId = args[field];
      if (!docId) continue;

      // 支持单个 ID 或 ID 数组
      const docIds: string[] = Array.isArray(docId) ? docId : [docId];
      for (const id of docIds) {
        try {
          const blocks = await context.siyuan.search.query(
            `SELECT box FROM blocks WHERE id='${id}' OR root_id='${id}' LIMIT 1`
          );
          if (blocks.length > 0) {
            const notebookId = blocks[0].box;
            if (blacklist.includes(notebookId)) {
              throw new Error(
                `Operation blocked: document "${id}" belongs to notebook "${notebookId}" which is in the blacklist. ` +
                `Tool "${this.name}" cannot operate on blacklisted notebooks.`
              );
            }
          }
        } catch (error) {
          // 如果是黑名单报错，直接抛出；其他错误（如文档不存在）忽略，让后续 execute 处理
          if (error instanceof Error && error.message.includes('in the blacklist')) {
            throw error;
          }
        }
      }
    }
  }

  /**
   * 包装执行，添加日志和错误处理
   */
  async safeExecute(args: any, context: ExecutionContext): Promise<TResult> {
    context.logger.debug(`Executing tool: ${this.name}`, args);

    try {
      this.validate(args);
      this.checkBlacklist(args, context);
      await this.checkDocumentBlacklist(args, context);
      const result = await this.execute(args, context);
      context.logger.debug(`Tool ${this.name} completed successfully`);
      return result;
    } catch (error) {
      context.logger.error(`Tool ${this.name} failed:`, error);
      throw error;
    }
  }
}
