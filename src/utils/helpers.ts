/**
 * 辅助工具方法
 * 提供额外的便捷功能，增强 LLM 的可用性
 */

import type { SiyuanClient } from '../api/client.js';
import type { Block, SearchResultResponse } from '../types/index.js';
import type { EnhancedBlock, OperationResult } from '../types/enhanced.js';
import { extractTitle, truncateContent } from './format.js';

export class SiyuanHelpers {
  constructor(private client: SiyuanClient) {}

  /**
   * 根据 ID 获取完整的块信息（增强版）
   * @param blockId 块 ID
   * @returns 增强的块信息
   */
  async getEnhancedBlockInfo(blockId: string): Promise<EnhancedBlock> {
    // 通过 SQL 获取完整块信息
    const response = await this.client.request<Block[]>('/api/query/sql', {
      stmt: `SELECT * FROM blocks WHERE id='${blockId}'`,
    });

    if (!response.data || response.data.length === 0) {
      throw new Error(`Block not found: ${blockId}`);
    }

    const block = response.data[0] as EnhancedBlock;

    // 获取父块信息
    if (block.parent_id && block.parent_id !== block.id) {
      const parentResponse = await this.client.request<Block[]>('/api/query/sql', {
        stmt: `SELECT id, content, type FROM blocks WHERE id='${block.parent_id}'`,
      });
      if (parentResponse.data && parentResponse.data.length > 0) {
        const parent = parentResponse.data[0];
        block.parentInfo = {
          id: parent.id,
          content: parent.content,
          type: parent.type,
        };
      }
    }

    // 获取子块数量
    const childrenResponse = await this.client.request<Array<{ count: number }>>(
      '/api/query/sql',
      {
        stmt: `SELECT COUNT(*) as count FROM blocks WHERE parent_id='${blockId}' AND id!='${blockId}'`,
      }
    );
    if (childrenResponse.data && childrenResponse.data.length > 0) {
      block.childrenCount = childrenResponse.data[0].count;
    }

    // 获取笔记本名称
    const notebookResponse = await this.client.request<{ notebooks: Array<{ id: string; name: string }> }>(
      '/api/notebook/lsNotebooks'
    );
    if (notebookResponse.data && notebookResponse.data.notebooks) {
      const notebook = notebookResponse.data.notebooks.find((nb) => nb.id === block.box);
      if (notebook) {
        block.notebookName = notebook.name;
      }
    }

    return block;
  }

  /**
   * 获取块的完整上下文（包括前后兄弟块）
   * @param blockId 块 ID
   * @param context 前后各获取几个块，默认 2
   */
  async getBlockContext(
    blockId: string,
    context: number = 2
  ): Promise<{
    target: Block;
    previous: Block[];
    next: Block[];
  }> {
    // 获取目标块
    const targetResponse = await this.client.request<Block[]>('/api/query/sql', {
      stmt: `SELECT * FROM blocks WHERE id='${blockId}'`,
    });

    if (!targetResponse.data || targetResponse.data.length === 0) {
      throw new Error(`Block not found: ${blockId}`);
    }

    const target = targetResponse.data[0];

    // 获取同一父块下的兄弟块
    const siblingsResponse = await this.client.request<Block[]>('/api/query/sql', {
      stmt: `SELECT * FROM blocks WHERE parent_id='${target.parent_id}' ORDER BY sort`,
    });

    const siblings = siblingsResponse.data || [];
    const targetIndex = siblings.findIndex((b) => b.id === blockId);

    const previous = targetIndex > 0 ? siblings.slice(Math.max(0, targetIndex - context), targetIndex) : [];
    const next = targetIndex < siblings.length - 1 ? siblings.slice(targetIndex + 1, targetIndex + 1 + context) : [];

    return { target, previous, next };
  }

  /**
   * 获取文档的大纲结构
   * @param docId 文档 ID
   */
  async getDocumentOutline(docId: string): Promise<Array<{
    id: string;
    content: string;
    type: string;
    level: number;
    children: Array<any>;
  }>> {
    // 获取所有标题块
    const response = await this.client.request<Block[]>('/api/query/sql', {
      stmt: `SELECT * FROM blocks WHERE root_id='${docId}' AND type='h' ORDER BY sort`,
    });

    if (!response.data) {
      return [];
    }

    // 解析标题层级
    const outline = response.data.map((block) => {
      // 从 subtype 中提取层级 (h1, h2, h3...)
      const level = parseInt(block.subtype.replace('h', '')) || 1;
      return {
        id: block.id,
        content: block.content,
        type: block.type,
        level,
        children: [],
      };
    });

    return outline;
  }

  /**
   * 获取最近更新的文档
   * @param limit 返回数量
   * @param notebookId 限制在特定笔记本（可选）
   */
  async getRecentlyUpdatedDocuments(limit: number = 10, notebookId?: string): Promise<SearchResultResponse[]> {
    let stmt = `SELECT * FROM blocks WHERE type='d'`;
    if (notebookId) {
      stmt += ` AND box='${notebookId}'`;
    }
    stmt += ` ORDER BY updated DESC LIMIT ${limit}`;

    const response = await this.client.request<Block[]>('/api/query/sql', { stmt });
    const blocks = response.data || [];
    return this.toSearchResultResponse(blocks);
  }

  /**
   * 将Block数组转换为搜索结果响应
   */
  private toSearchResultResponse(blocks: Block[]): SearchResultResponse[] {
    return blocks.map(block => ({
      id: block.id,
      name: block.name || extractTitle(block.content),
      path: block.hpath || block.path,
      content: truncateContent(block.content, 100), // 简短摘要
      type: block.type,
      updated: block.updated
    }));
  }

  /**
   * 创建操作结果对象
   */
  createOperationResult(
    success: boolean,
    id: string,
    operation: OperationResult['operation'],
    resourceType: OperationResult['resourceType'],
    metadata?: OperationResult['metadata']
  ): OperationResult {
    return {
      success,
      id,
      operation,
      resourceType,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * 格式化块的引用链接
   * @param blockId 块 ID
   * @param anchor 锚文本（可选）
   */
  formatBlockRef(blockId: string, anchor?: string): string {
    return `((${blockId} "${anchor || blockId}"))`;
  }

  /**
   * 解析思源笔记的时间戳格式
   * @param timestamp 思源笔记时间戳（如 20230404163414）
   */
  parseTimestamp(timestamp: string): Date {
    // 格式: YYYYMMDDHHmmss
    const year = parseInt(timestamp.substring(0, 4));
    const month = parseInt(timestamp.substring(4, 6)) - 1;
    const day = parseInt(timestamp.substring(6, 8));
    const hour = parseInt(timestamp.substring(8, 10));
    const minute = parseInt(timestamp.substring(10, 12));
    const second = parseInt(timestamp.substring(12, 14));

    return new Date(year, month, day, hour, minute, second);
  }

  /**
   * 格式化思源笔记时间戳
   * @param date 日期对象
   */
  formatTimestamp(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hour}${minute}${second}`;
  }

  /**
   * 获取块的面包屑路径
   * @param blockId 块 ID
   */
  async getBreadcrumb(blockId: string): Promise<string[]> {
    const response = await this.client.request<{ hPath: string }>('/api/filetree/getHPathByID', {
      id: blockId,
    });

    if (response.code !== 0 || !response.data || !response.data.hPath) {
      return [];
    }

    return response.data.hPath.split('/').filter((p) => p);
  }
}
