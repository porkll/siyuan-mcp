/**
 * 思源笔记标签相关 API
 * 用于管理文档标签
 */

import type { SiyuanClient } from './client.js';

export class SiyuanTagApi {
  constructor(private client: SiyuanClient) {}

  /**
   * 批量替换标签
   * @param oldTag 旧标签名(不需要包含#符号)
   * @param newTag 新标签名(不需要包含#符号,空字符串表示删除标签)
   * @returns 操作成功返回true,失败则抛出异常
   */
  async replaceTag(oldTag: string, newTag: string): Promise<boolean> {
    // 清理标签名
    const cleanOldTag = oldTag.replace(/#/g, '').trim();
    const cleanNewTag = newTag.replace(/#/g, '').trim();

    if (!cleanOldTag) {
      throw new Error('旧标签名不能为空');
    }

    // 如果新标签为空,使用官方删除API
    if (!cleanNewTag) {
      await this.client.request<any>('/api/tag/removeTag', {
        label: cleanOldTag,
      });
      return true;
    }

    // 如果新标签不为空,使用官方重命名API
    await this.client.request<any>('/api/tag/renameTag', {
      oldLabel: cleanOldTag,
      newLabel: cleanNewTag,
    });
    return true;
  }

  /**
   * 删除指定标签(从所有文档中移除)
   * @param tag 标签名(不需要包含#符号)
   * @returns 操作成功返回true,失败则抛出异常
   */
  async removeTag(tag: string): Promise<boolean> {
    return this.replaceTag(tag, '');
  }
}
