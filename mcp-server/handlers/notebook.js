/**
 * 笔记本相关工具处理器
 */
import { BaseToolHandler } from './base.js';
/**
 * 列出所有笔记本
 */
export class ListNotebooksHandler extends BaseToolHandler {
    name = 'list_notebooks';
    description = 'List all notebooks in SiYuan Note';
    inputSchema = {
        type: 'object',
        properties: {},
    };
    async execute(args, context) {
        return await context.siyuan.listNotebooks();
    }
}
/**
 * 获取笔记本配置
 */
export class GetNotebookConfigHandler extends BaseToolHandler {
    name = 'get_notebook_config';
    description = 'Get configuration of a specific notebook';
    inputSchema = {
        type: 'object',
        properties: {
            notebook_id: {
                type: 'string',
                description: 'The notebook ID',
            },
        },
        required: ['notebook_id'],
    };
    async execute(args, context) {
        return await context.siyuan.notebook.getNotebookConf(args.notebook_id);
    }
}
/**
 * 获取最近文档
 */
export class GetRecentDocumentsHandler extends BaseToolHandler {
    name = 'get_recent_documents';
    description = 'Get recently modified documents';
    inputSchema = {
        type: 'object',
        properties: {
            limit: {
                type: 'number',
                description: 'Number of documents to return (default: 10)',
                default: 10,
            },
            notebook_id: {
                type: 'string',
                description: 'Optional: Limit to specific notebook',
            },
        },
    };
    async execute(args, context) {
        return await context.siyuan.helpers.getRecentDocuments(args.limit || 10, args.notebook_id);
    }
}
/**
 * 获取文档大纲
 */
export class GetDocumentOutlineHandler extends BaseToolHandler {
    name = 'get_document_outline';
    description = 'Get the outline (headings) of a document';
    inputSchema = {
        type: 'object',
        properties: {
            doc_id: {
                type: 'string',
                description: 'The document ID',
            },
        },
        required: ['doc_id'],
    };
    async execute(args, context) {
        return await context.siyuan.helpers.getDocumentOutline(args.doc_id);
    }
}
//# sourceMappingURL=notebook.js.map