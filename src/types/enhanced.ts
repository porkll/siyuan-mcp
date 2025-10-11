/**
 * 增强的返回类型，包含更多上下文信息
 */

import type { Block } from './index.js';

/**
 * 增强的块信息，包含额外的上下文
 */
export interface EnhancedBlock extends Block {
  /** 父块信息（如果有） */
  parentInfo?: {
    id: string;
    content: string;
    type: string;
  };
  /** 子块数量 */
  childrenCount?: number;
  /** 所属笔记本名称 */
  notebookName?: string;
}

/**
 * 操作结果，包含详细的反馈信息
 */
export interface OperationResult {
  /** 是否成功 */
  success: boolean;
  /** 操作的资源 ID */
  id: string;
  /** 操作类型 */
  operation: 'create' | 'update' | 'delete' | 'move';
  /** 操作的资源类型 */
  resourceType: 'block' | 'document' | 'notebook';
  /** 额外信息 */
  metadata?: {
    /** 资源路径 */
    path?: string;
    /** 父级 ID */
    parentId?: string;
    /** 内容预览 */
    contentPreview?: string;
    /** 时间戳 */
    timestamp?: string;
  };
}

/**
 * 批量操作结果
 */
export interface BatchOperationResult {
  /** 总数 */
  total: number;
  /** 成功数量 */
  success: number;
  /** 失败数量 */
  failed: number;
  /** 详细结果 */
  results: Array<{
    id?: string;
    success: boolean;
    error?: string;
  }>;
}

/**
 * 搜索结果，包含更多上下文
 */
export interface EnhancedSearchResult {
  /** 搜索到的块列表 */
  blocks: Block[];
  /** 总数 */
  total: number;
  /** 搜索查询 */
  query: string;
  /** 搜索选项 */
  options: {
    limit: number;
    notebook?: string;
    types?: string[];
  };
  /** 按笔记本分组的统计 */
  byNotebook?: Record<string, number>;
  /** 按类型分组的统计 */
  byType?: Record<string, number>;
}
