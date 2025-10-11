/**
 * 笔记本相关工具处理器
 */
import { BaseToolHandler } from './base.js';
import type { ExecutionContext, JSONSchema } from '../core/types.js';
import type { Notebook, NotebookConf, Block } from '../../dist/index.js';
/**
 * 列出所有笔记本
 */
export declare class ListNotebooksHandler extends BaseToolHandler<{}, Notebook[]> {
    readonly name = "list_notebooks";
    readonly description = "List all notebooks in SiYuan Note";
    readonly inputSchema: JSONSchema;
    execute(args: any, context: ExecutionContext): Promise<Notebook[]>;
}
/**
 * 获取笔记本配置
 */
export declare class GetNotebookConfigHandler extends BaseToolHandler<{
    notebook_id: string;
}, NotebookConf> {
    readonly name = "get_notebook_config";
    readonly description = "Get configuration of a specific notebook";
    readonly inputSchema: JSONSchema;
    execute(args: any, context: ExecutionContext): Promise<NotebookConf>;
}
/**
 * 获取最近文档
 */
export declare class GetRecentDocumentsHandler extends BaseToolHandler<{
    limit?: number;
    notebook_id?: string;
}, Block[]> {
    readonly name = "get_recent_documents";
    readonly description = "Get recently modified documents";
    readonly inputSchema: JSONSchema;
    execute(args: any, context: ExecutionContext): Promise<Block[]>;
}
/**
 * 获取文档大纲
 */
export declare class GetDocumentOutlineHandler extends BaseToolHandler<{
    doc_id: string;
}, Array<any>> {
    readonly name = "get_document_outline";
    readonly description = "Get the outline (headings) of a document";
    readonly inputSchema: JSONSchema;
    execute(args: any, context: ExecutionContext): Promise<Array<any>>;
}
//# sourceMappingURL=notebook.d.ts.map