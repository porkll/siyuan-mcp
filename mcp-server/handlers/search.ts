/**
 * 搜索相关工具处理器
 */

import { BaseToolHandler } from './base.js';
import type { ExecutionContext, JSONSchema } from '../core/types.js';
import type { SearchResultResponse, Block } from '../../src/types/index.js';

/**
 * 按文件名搜索
 */
export class SearchByFilenameHandler extends BaseToolHandler<
  { filename: string; limit?: number; notebook_id?: string },
  SearchResultResponse[]
> {
  readonly name = 'search_by_filename';
  readonly description = 'Search documents by filename in SiYuan Note';
  readonly inputSchema: JSONSchema = {
    type: 'object',
    properties: {
      filename: {
        type: 'string',
        description: 'The filename keyword to search for',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results (default: 10)',
        default: 10,
      },
      notebook_id: {
        type: 'string',
        description: 'Optional: Limit to specific notebook ID',
      },
    },
    required: ['filename'],
  };

  async execute(args: any, context: ExecutionContext): Promise<SearchResultResponse[]> {
    return await context.siyuan.search.searchByFileName(args.filename, {
      limit: args.limit || 10,
      notebook: args.notebook_id,
    });
  }
}

/**
 * 按内容搜索
 */
export class SearchByContentHandler extends BaseToolHandler<
  { content: string; limit?: number; notebook_id?: string },
  SearchResultResponse[]
> {
  readonly name = 'search_by_content';
  readonly description = 'Search blocks by content in SiYuan Note';
  readonly inputSchema: JSONSchema = {
    type: 'object',
    properties: {
      content: {
        type: 'string',
        description: 'The content keyword to search for',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results (default: 10)',
        default: 10,
      },
      notebook_id: {
        type: 'string',
        description: 'Optional: Limit to specific notebook ID',
      },
    },
    required: ['content'],
  };

  async execute(args: any, context: ExecutionContext): Promise<SearchResultResponse[]> {
    return await context.siyuan.search.searchByContent(args.content, {
      limit: args.limit || 10,
      notebook: args.notebook_id,
    });
  }
}

/**
 * SQL 查询
 */
export class SqlQueryHandler extends BaseToolHandler<{ sql: string }, Block[]> {
  readonly name = 'sql_query';
  readonly description = 'Execute custom SQL query on SiYuan database (advanced)';
  readonly inputSchema: JSONSchema = {
    type: 'object',
    properties: {
      sql: {
        type: 'string',
        description: 'The SQL query to execute',
      },
    },
    required: ['sql'],
  };

  async execute(args: any, context: ExecutionContext): Promise<Block[]> {
    return await context.siyuan.search.query(args.sql);
  }
}
