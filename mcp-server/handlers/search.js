/**
 * 搜索相关工具处理器
 */
import { BaseToolHandler } from './base.js';
/**
 * 按文件名搜索
 */
export class SearchByFilenameHandler extends BaseToolHandler {
    name = 'search_by_filename';
    description = 'Search documents by filename in SiYuan Note';
    inputSchema = {
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
            notebook: {
                type: 'string',
                description: 'Optional: Limit to specific notebook ID',
            },
        },
        required: ['filename'],
    };
    async execute(args, context) {
        return await context.siyuan.search.searchByFileName(args.filename, {
            limit: args.limit || 10,
            notebook: args.notebook,
        });
    }
}
/**
 * 按内容搜索
 */
export class SearchByContentHandler extends BaseToolHandler {
    name = 'search_by_content';
    description = 'Search blocks by content in SiYuan Note';
    inputSchema = {
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
            notebook: {
                type: 'string',
                description: 'Optional: Limit to specific notebook ID',
            },
        },
        required: ['content'],
    };
    async execute(args, context) {
        return await context.siyuan.search.searchByContent(args.content, {
            limit: args.limit || 10,
            notebook: args.notebook,
        });
    }
}
/**
 * SQL 查询
 */
export class SqlQueryHandler extends BaseToolHandler {
    name = 'sql_query';
    description = 'Execute custom SQL query on SiYuan database (advanced)';
    inputSchema = {
        type: 'object',
        properties: {
            sql: {
                type: 'string',
                description: 'The SQL query to execute',
            },
        },
        required: ['sql'],
    };
    async execute(args, context) {
        return await context.siyuan.search.query(args.sql);
    }
}
//# sourceMappingURL=search.js.map