/**
 * 思源笔记块操作相关 API
 */

import type { SiyuanClient } from './client.js';

export class SiyuanBlockApi {
  constructor(private client: SiyuanClient) {}

  /**
   * 获取块内容（Kramdown 格式）
   * @param blockId 块 ID
   * @returns 块内容
   */
  async getBlockKramdown(blockId: string): Promise<string> {
    const response = await this.client.request<{ id: string; kramdown: string }>(
      '/api/block/getBlockKramdown',
      { id: blockId }
    );
    return response.data.kramdown;
  }

  /**
   * 获取块的 Markdown 内容
   * @param blockId 块 ID
   * @returns Markdown 内容（纯净内容，不含元信息）
   */
  async getBlockMarkdown(blockId: string): Promise<string> {
    const response = await this.client.request<{ content: string }>(
      '/api/export/exportMdContent',
      { id: blockId }
    );
    return response.data.content;
  }

  /**
   * 更新块内容（覆盖模式）
   * @param blockId 块 ID
   * @param content Markdown 内容
   * @returns 操作结果
   */
  async updateBlock(blockId: string, content: string): Promise<void> {
    const response = await this.client.request('/api/block/updateBlock', {
      id: blockId,
      dataType: 'markdown',
      data: content,
    });

    if (response.code !== 0) {
      throw new Error(`Failed to update block: ${response.msg}`);
    }
  }

  /**
   * 列出文档下所有子块（除根块本身）。
   * 走 SQL /api/query/sql 而非 getDocTree，避免 maxDepth 限制和父 ID 解析复杂度。
   * 只返 ID，便于批量 deleteBlock。
   * @param rootId 文档根块 ID（即文档 ID）
   * @returns 子块 ID 数组（不含根块）
   */
  async listChildBlocks(rootId: string): Promise<string[]> {
    const stmt = `SELECT id FROM blocks WHERE root_id='${rootId}' AND id!='${rootId}' AND type IN ('d','h','p','l','i','c','b','code','m','html','widget','s','t','audio','video','iframe','query','attr-view','virtual-block','textmark') ORDER BY id LIMIT 5000`;
    const response = await this.client.request<Array<{ id: string }>>('/api/query/sql', {
      stmt,
    });
    if (response.code !== 0) {
      throw new Error(`Failed to list child blocks: ${response.msg}`);
    }
    return (response.data || []).map((r) => r.id);
  }

  /**
   * 在父块下追加子块
   * @param parentId 父块 ID
   * @param content Markdown 内容
   * @returns 新创建的块 ID
   */
  async appendBlock(parentId: string, content: string): Promise<string> {
    interface BlockOperation {
      doOperations: Array<{ id: string; action: string }>;
    }
    const response = await this.client.request<BlockOperation[]>(
      '/api/block/appendBlock',
      {
        parentID: parentId,
        dataType: 'markdown',
        data: content,
      }
    );

    if (response.code !== 0) {
      throw new Error(`Failed to append block: ${response.msg}`);
    }

    return response.data[0].doOperations[0].id;
  }

  /**
   * 在指定块之前插入块
   * @param previousId 参考块 ID
   * @param content Markdown 内容
   * @returns 新创建的块 ID
   */
  async insertBlockBefore(previousId: string, content: string): Promise<string> {
    interface BlockOperation {
      doOperations: Array<{ id: string; action: string }>;
    }
    const response = await this.client.request<BlockOperation[]>(
      '/api/block/insertBlock',
      {
        previousID: previousId,
        dataType: 'markdown',
        data: content,
      }
    );

    if (response.code !== 0) {
      throw new Error(`Failed to insert block: ${response.msg}`);
    }

    return response.data[0].doOperations[0].id;
  }

  /**
   * 在指定块之后插入块
   * @param nextId 参考块 ID
   * @param content Markdown 内容
   * @returns 新创建的块 ID
   */
  async insertBlockAfter(nextId: string, content: string): Promise<string> {
    interface BlockOperation {
      doOperations: Array<{ id: string; action: string }>;
    }
    const response = await this.client.request<BlockOperation[]>(
      '/api/block/insertBlock',
      {
        nextID: nextId,
        dataType: 'markdown',
        data: content,
      }
    );

    if (response.code !== 0) {
      throw new Error(`Failed to insert block: ${response.msg}`);
    }

    return response.data[0].doOperations[0].id;
  }

  /**
   * 删除块
   * @param blockId 块 ID
   */
  async deleteBlock(blockId: string): Promise<void> {
    const response = await this.client.request('/api/block/deleteBlock', { id: blockId });

    if (response.code !== 0) {
      throw new Error(`Failed to delete block: ${response.msg}`);
    }
  }

  /**
   * 移动块
   * @param blockId 要移动的块 ID
   * @param previousId 目标位置的前一个块 ID（可选）
   * @param parentId 目标父块 ID（可选）
   */
  async moveBlock(blockId: string, previousId?: string, parentId?: string): Promise<void> {
    const response = await this.client.request('/api/block/moveBlock', {
      id: blockId,
      previousID: previousId,
      parentID: parentId,
    });

    if (response.code !== 0) {
      throw new Error(`Failed to move block: ${response.msg}`);
    }
  }
}