/**
 * 导出所有工具处理器
 */
export { BaseToolHandler } from './base.js';

// 搜索相关
export * from './search.js';

// 文档相关
export * from './document.js';

// 笔记本相关
export * from './notebook.js';

// 快照相关
export * from './snapshot.js';

// 标签相关
export * from './tag.js';

import {
  UnifiedSearchHandler,
} from './search.js';

import {
  GetDocumentContentHandler,
  CreateDocumentHandler,
  AppendToDocumentHandler,
  UpdateDocumentHandler,
  ReplaceTextInBlockHandler,
  ReplaceTextInBlockStrictHandler,
  AppendToDailyNoteHandler,
  MoveDocumentsHandler,
  GetDocumentTreeHandler,
  GetBlockContextHandler,
  GetBlockHandler,
  GetBlockBriefHandler,
  GetChildBlocksHandler,
  ListChildrenBriefHandler,
  GetDocumentOutlineHandler,
  SearchBlocksHandler,
  ResolveBlockReferenceHandler,
  InsertBlockBeforeHandler,
  InsertBlockAfterHandler,
  AppendBlockHandler,
  PrependBlockHandler,
  DeleteBlockHandler,
  MoveBlockHandler,
  ReplaceRangeInBlockHandler,
  GetBlockAttributesHandler,
  SetBlockAttributesHandler,
  UpdateBlockAttributeHandler,
  ApplyOperationsHandler,
  GetBlockTreeSliceHandler,
  FindHeadingInTreeHandler,
  GetSectionByHeadingHandler,
  AppendBlockIfMissingHandler,
  SearchBlocksScopedHandler,
  UpsertSectionByHeadingHandler,
} from './document.js';

import {
  ListNotebooksHandler,
  GetRecentlyUpdatedDocumentsHandler,
  CreateNotebookHandler,
} from './notebook.js';

import {
  CreateSnapshotHandler,
  ListSnapshotsHandler,
  RollbackSnapshotHandler,
} from './snapshot.js';

import {
  ListAllTagsHandler,
  ReplaceTagHandler,
} from './tag.js';

function assertUniqueHandlerNames<T extends { name: string }>(handlers: T[]): T[] {
  const seen = new Set<string>();

  for (const handler of handlers) {
    if (seen.has(handler.name)) {
      throw new Error(`Duplicate tool registration detected: ${handler.name}`);
    }
    seen.add(handler.name);
  }

  return handlers;
}

// 工厂函数：创建所有处理器实例
export function createAllHandlers() {
  return assertUniqueHandlerNames([
    // 搜索
    new UnifiedSearchHandler(),

    // 文档
    new GetDocumentContentHandler(),
    new CreateDocumentHandler(),
    new AppendToDocumentHandler(),
    new UpdateDocumentHandler(),
    new ReplaceTextInBlockHandler(),
    new ReplaceTextInBlockStrictHandler(),
    new GetBlockHandler(),
    new GetBlockBriefHandler(),
    new GetChildBlocksHandler(),
    new ListChildrenBriefHandler(),
    new GetBlockContextHandler(),
    new GetBlockTreeSliceHandler(),
    new GetDocumentOutlineHandler(),
    new FindHeadingInTreeHandler(),
    new GetSectionByHeadingHandler(),
    new UpsertSectionByHeadingHandler(),
    new SearchBlocksHandler(),
    new SearchBlocksScopedHandler(),
    new ResolveBlockReferenceHandler(),
    new InsertBlockBeforeHandler(),
    new InsertBlockAfterHandler(),
    new AppendBlockHandler(),
    new AppendBlockIfMissingHandler(),
    new PrependBlockHandler(),
    new DeleteBlockHandler(),
    new MoveBlockHandler(),
    new ReplaceRangeInBlockHandler(),
    new GetBlockAttributesHandler(),
    new SetBlockAttributesHandler(),
    new UpdateBlockAttributeHandler(),
    new ApplyOperationsHandler(),
    new AppendToDailyNoteHandler(),
    new MoveDocumentsHandler(),
    new GetDocumentTreeHandler(),

    // 笔记本
    new ListNotebooksHandler(),
    new GetRecentlyUpdatedDocumentsHandler(),
    new CreateNotebookHandler(),

    // 快照
    new CreateSnapshotHandler(),
    new ListSnapshotsHandler(),
    new RollbackSnapshotHandler(),

    // 标签
    new ListAllTagsHandler(),
    new ReplaceTagHandler(),
  ]);
}
