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
   * @returns Markdown 内容
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
