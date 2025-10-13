/**
 * 思源笔记标签相关 API
 * 用于管理文档标签
 */

import type { SiyuanClient } from './client.js';
import type { Block } from '../types/index.js';

export class SiyuanTagApi {
  constructor(private client: SiyuanClient) {}

  /**
   * 批量替换标签
   * @param oldTag 旧标签名（不需要包含#符号）
   * @param newTag 新标签名（不需要包含#符号）
   * @returns 替换的文档数量
   */
  async replaceTag(oldTag: string, newTag: string): Promise<{ count: number; updatedIds: string[] }> {
    // 清理标签名
    const cleanOldTag = oldTag.replace(/#/g, '').trim();
    const cleanNewTag = newTag.replace(/#/g, '').trim();

    if (!cleanOldTag) {
      throw new Error('旧标签名不能为空');
    }

    // 查询所有包含旧标签的块
    const stmt = `SELECT id, tag FROM blocks WHERE tag LIKE '%#${this.escapeSql(cleanOldTag)}#%'`;
    const response = await this.client.request<Block[]>('/api/query/sql', { stmt });
    const blocks = response.data || [];

    const updatedIds: string[] = [];

    // 逐个更新块的标签
    for (const block of blocks) {
      if (!block.tag) continue;

      // 替换标签（保持#符号格式）
      const oldTagPattern = `#${cleanOldTag}#`;
      const newTagValue = cleanNewTag ? `#${cleanNewTag}#` : '';
      let newTagStr = block.tag.replace(new RegExp(oldTagPattern, 'g'), newTagValue);

      // 清理多余的空格
      newTagStr = newTagStr.replace(/\s+/g, ' ').trim();

      // 使用 setBlockAttrs API 更新标签属性
      await this.client.request('/api/attr/setBlockAttrs', {
        id: block.id,
        attrs: {
          tags: newTagStr,
        },
      });

      updatedIds.push(block.id);
    }

    return {
      count: updatedIds.length,
      updatedIds,
    };
  }

  /**
   * 删除指定标签（从所有文档中移除）
   * @param tag 标签名（不需要包含#符号）
   * @returns 删除的文档数量
   */
  async removeTag(tag: string): Promise<{ count: number; updatedIds: string[] }> {
    return this.replaceTag(tag, '');
  }

  /**
   * 转义 SQL 特殊字符
   */
  private escapeSql(str: string): string {
    return str.replace(/'/g, "''");
  }
}
