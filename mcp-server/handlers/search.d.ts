/**
 * 搜索相关工具处理器
 */
import { BaseToolHandler } from './base.js';
import type { ExecutionContext, JSONSchema } from '../core/types.js';
import type { Block } from '../../dist/index.js';
/**
 * 按文件名搜索
 */
export declare class SearchByFilenameHandler extends BaseToolHandler<{
    filename: string;
    limit?: number;
    notebook?: string;
}, Block[]> {
    readonly name = "search_by_filename";
    readonly description = "Search documents by filename in SiYuan Note";
    readonly inputSchema: JSONSchema;
    execute(args: any, context: ExecutionContext): Promise<Block[]>;
}
/**
 * 按内容搜索
 */
export declare class SearchByContentHandler extends BaseToolHandler<{
    content: string;
    limit?: number;
    notebook?: string;
}, Block[]> {
    readonly name = "search_by_content";
    readonly description = "Search blocks by content in SiYuan Note";
    readonly inputSchema: JSONSchema;
    execute(args: any, context: ExecutionContext): Promise<Block[]>;
}
/**
 * SQL 查询
 */
export declare class SqlQueryHandler extends BaseToolHandler<{
    sql: string;
}, Block[]> {
    readonly name = "sql_query";
    readonly description = "Execute custom SQL query on SiYuan database (advanced)";
    readonly inputSchema: JSONSchema;
    execute(args: any, context: ExecutionContext): Promise<Block[]>;
}
//# sourceMappingURL=search.d.ts.map