/**
 * 文档相关工具处理器
 */
import { BaseToolHandler } from './base.js';
import type { ExecutionContext, JSONSchema } from '../core/types.js';
/**
 * 获取文件内容
 */
export declare class GetFileContentHandler extends BaseToolHandler<{
    block_id: string;
}, string> {
    readonly name = "get_file_content";
    readonly description = "Get the markdown content of a document or block";
    readonly inputSchema: JSONSchema;
    execute(args: any, context: ExecutionContext): Promise<string>;
}
/**
 * 创建文件
 */
export declare class CreateFileHandler extends BaseToolHandler<{
    notebook_id: string;
    path: string;
    content: string;
}, string> {
    readonly name = "create_file";
    readonly description = "Create a new document in SiYuan Note";
    readonly inputSchema: JSONSchema;
    execute(args: any, context: ExecutionContext): Promise<string>;
}
/**
 * 追加到文件
 */
export declare class AppendToFileHandler extends BaseToolHandler<{
    block_id: string;
    content: string;
}, string> {
    readonly name = "append_to_file";
    readonly description = "Append content to an existing document";
    readonly inputSchema: JSONSchema;
    execute(args: any, context: ExecutionContext): Promise<string>;
}
/**
 * 更新文件
 */
export declare class UpdateFileHandler extends BaseToolHandler<{
    block_id: string;
    content: string;
}, void> {
    readonly name = "update_file";
    readonly description = "Update (overwrite) the content of a block";
    readonly inputSchema: JSONSchema;
    execute(args: any, context: ExecutionContext): Promise<void>;
}
/**
 * 追加到今日笔记
 */
export declare class AppendToDailyNoteHandler extends BaseToolHandler<{
    notebook_id: string;
    content: string;
}, string> {
    readonly name = "append_to_daily_note";
    readonly description = "Append content to today's daily note (creates if not exists)";
    readonly inputSchema: JSONSchema;
    execute(args: any, context: ExecutionContext): Promise<string>;
}
//# sourceMappingURL=document.d.ts.map