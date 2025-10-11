/**
 * 导出所有工具处理器
 */
export { BaseToolHandler } from './base.js';
// 搜索相关
export { SearchByFilenameHandler, SearchByContentHandler, SqlQueryHandler } from './search.js';
// 文档相关
export { GetFileContentHandler, CreateFileHandler, AppendToFileHandler, UpdateFileHandler, AppendToDailyNoteHandler, } from './document.js';
// 笔记本相关
export { ListNotebooksHandler, GetNotebookConfigHandler, GetRecentDocumentsHandler, GetDocumentOutlineHandler, } from './notebook.js';
// 工厂函数：创建所有处理器实例
export function createAllHandlers() {
    return [
        // 搜索
        new SearchByFilenameHandler(),
        new SearchByContentHandler(),
        new SqlQueryHandler(),
        // 文档
        new GetFileContentHandler(),
        new CreateFileHandler(),
        new AppendToFileHandler(),
        new UpdateFileHandler(),
        new AppendToDailyNoteHandler(),
        // 笔记本
        new ListNotebooksHandler(),
        new GetNotebookConfigHandler(),
        new GetRecentDocumentsHandler(),
        new GetDocumentOutlineHandler(),
    ];
}
//# sourceMappingURL=index.js.map