/**
 * 笔记本相关工具处理器
 */

import { BaseToolHandler } from './base.js';
import type { ExecutionContext, JSONSchema } from '../core/types.js';
import type { NotebookResponse, SearchResultResponse } from '../../src/types/index.js';

/**
 * 列出所有笔记本
 */
export class ListNotebooksHandler extends BaseToolHandler<{}, NotebookResponse[]> {
  readonly name = 'list_notebooks';
  readonly description = 'List all notebooks in SiYuan Note';
  readonly inputSchema: JSONSchema = {
    type: 'object',
    properties: {},
  };

  async execute(_args: any, context: ExecutionContext): Promise<NotebookResponse[]> {
    return await context.siyuan.notebook.listNotebooks();
  }
}

/**
 * 获取最近更新的文档
 */
export class GetRecentlyUpdatedDocumentsHandler extends BaseToolHandler<
  { limit?: number; notebook_id?: string },
  SearchResultResponse[]
> {
  readonly name = 'get_recently_updated_documents';
  readonly description = 'Get recently updated documents (sorted by update time, most recent first)';
  readonly inputSchema: JSONSchema = {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Number of documents to return (default: 10)',
        default: 10,
      },
      notebook_id: {
        type: 'string',
        description: 'Optional: Limit to specific notebook ID',
      },
    },
  };

  async execute(args: any, context: ExecutionContext): Promise<SearchResultResponse[]> {
    return await context.siyuan.helpers.getRecentlyUpdatedDocuments(
      args.limit || 10,
      args.notebook_id
    );
  }
}

