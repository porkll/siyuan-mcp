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
 * 统一搜索工具：支持内容、标签、文件名等多种条件
 */
export class UnifiedSearchHandler extends BaseToolHandler<
  {
    content?: string;
    tag?: string;
    filename?: string;
    limit?: number;
    notebook_id?: string;
    types?: string[];
  },
  SearchResultResponse[]
> {
  readonly name = 'siyuan_search';
  readonly description =
    'Unified search tool: search documents/blocks by content, tag, filename, or combination of these filters';
  readonly inputSchema: JSONSchema = {
    type: 'object',
    properties: {
      content: {
        type: 'string',
        description: 'Optional: Content keyword to search for',
      },
      tag: {
        type: 'string',
        description: 'Optional: Tag to filter by (without # symbol, e.g., "项目")',
      },
      filename: {
        type: 'string',
        description: 'Optional: Filename keyword to search for',
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
      types: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional: Block types to search (e.g., ["d"] for documents)',
      },
    },
  };

  async execute(args: any, context: ExecutionContext): Promise<SearchResultResponse[]> {
    return await context.siyuan.search.search({
      content: args.content,
      tag: args.tag,
      filename: args.filename,
      limit: args.limit || 10,
      notebook: args.notebook_id,
      types: args.types,
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
