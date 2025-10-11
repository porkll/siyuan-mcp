/**
 * 文档相关工具处理器
 */
import { BaseToolHandler } from './base.js';
/**
 * 获取文件内容
 */
export class GetFileContentHandler extends BaseToolHandler {
    name = 'get_file_content';
    description = 'Get the markdown content of a document or block';
    inputSchema = {
        type: 'object',
        properties: {
            block_id: {
                type: 'string',
                description: 'The block/document ID',
            },
        },
        required: ['block_id'],
    };
    async execute(args, context) {
        return await context.siyuan.getFileContent(args.block_id);
    }
}
/**
 * 创建文件
 */
export class CreateFileHandler extends BaseToolHandler {
    name = 'create_file';
    description = 'Create a new document in SiYuan Note';
    inputSchema = {
        type: 'object',
        properties: {
            notebook_id: {
                type: 'string',
                description: 'The notebook ID',
            },
            path: {
                type: 'string',
                description: 'Document path (e.g., /folder/document)',
            },
            content: {
                type: 'string',
                description: 'Markdown content',
            },
        },
        required: ['notebook_id', 'path', 'content'],
    };
    async execute(args, context) {
        return await context.siyuan.createFile(args.notebook_id, args.path, args.content);
    }
}
/**
 * 追加到文件
 */
export class AppendToFileHandler extends BaseToolHandler {
    name = 'append_to_file';
    description = 'Append content to an existing document';
    inputSchema = {
        type: 'object',
        properties: {
            block_id: {
                type: 'string',
                description: 'The parent block/document ID',
            },
            content: {
                type: 'string',
                description: 'Markdown content to append',
            },
        },
        required: ['block_id', 'content'],
    };
    async execute(args, context) {
        return await context.siyuan.appendToFile(args.block_id, args.content);
    }
}
/**
 * 更新文件
 */
export class UpdateFileHandler extends BaseToolHandler {
    name = 'update_file';
    description = 'Update (overwrite) the content of a block';
    inputSchema = {
        type: 'object',
        properties: {
            block_id: {
                type: 'string',
                description: 'The block ID to update',
            },
            content: {
                type: 'string',
                description: 'New markdown content',
            },
        },
        required: ['block_id', 'content'],
    };
    async execute(args, context) {
        await context.siyuan.overwriteFile(args.block_id, args.content);
    }
}
/**
 * 追加到今日笔记
 */
export class AppendToDailyNoteHandler extends BaseToolHandler {
    name = 'append_to_daily_note';
    description = "Append content to today's daily note (creates if not exists)";
    inputSchema = {
        type: 'object',
        properties: {
            notebook_id: {
                type: 'string',
                description: 'The notebook ID',
            },
            content: {
                type: 'string',
                description: 'Markdown content to append',
            },
        },
        required: ['notebook_id', 'content'],
    };
    async execute(args, context) {
        return await context.siyuan.appendToDailyNote(args.notebook_id, args.content);
    }
}
//# sourceMappingURL=document.js.map