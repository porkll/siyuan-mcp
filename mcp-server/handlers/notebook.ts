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
  readonly description = 'List all notebooks in your SiYuan workspace. Notebooks are top-level containers for organizing your notes';
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
  readonly description = 'Get recently modified notes in SiYuan, sorted by update time (most recent first). Useful for finding what you worked on recently';
  readonly notebookIdFields = ['notebook_id'];
  readonly inputSchema: JSONSchema = {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Number of notes to return (default: 10)',
        default: 10,
      },
      notebook_id: {
        type: 'string',
        description: 'Optional: Filter to a specific notebook ID',
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

/**
 * 创建新笔记本
 */
export class CreateNotebookHandler extends BaseToolHandler<{ name: string }, string> {
  readonly name = 'create_notebook';
  readonly description = 'Create a new notebook in SiYuan with the specified name';
  readonly inputSchema: JSONSchema = {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'The name of the new notebook',
      },
    },
    required: ['name'],
  };

  async execute(args: any, context: ExecutionContext): Promise<string> {
    return await context.siyuan.notebook.createNotebook(args.name);
  }
}

