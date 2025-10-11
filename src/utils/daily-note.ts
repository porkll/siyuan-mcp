/**
 * 今日笔记工具类
 */

import type { SiyuanClient } from '../api/client.js';
import type { SiyuanDocumentApi } from '../api/document.js';
import type { SiyuanNotebookApi } from '../api/notebook.js';
import type { SiyuanBlockApi } from '../api/block.js';

export class DailyNoteUtils {
  constructor(
    private client: SiyuanClient,
    private documentApi: SiyuanDocumentApi,
    private notebookApi: SiyuanNotebookApi,
    private blockApi: SiyuanBlockApi
  ) {}

  /**
   * 渲染 Sprig 模板（思源使用的日期模板格式）
   * @param template 模板字符串
   * @returns 渲染后的字符串
   */
  private async renderTemplate(template: string): Promise<string> {
    const response = await this.client.request<string>('/api/template/renderSprig', {
      template: template,
    });

    if (response.code !== 0) {
      throw new Error(`Failed to render template: ${response.msg}`);
    }

    return response.data;
  }

  /**
   * 获取或创建今日笔记
   * @param notebookId 笔记本 ID
   * @returns 今日笔记的文档 ID
   */
  async getOrCreateDailyNote(notebookId: string): Promise<string> {
    // 获取笔记本配置
    const notebookConf = await this.notebookApi.getNotebookConf(notebookId);

    // 获取今日笔记保存路径模板
    const dailyNoteSavePath =
      notebookConf.dailyNoteSavePath ||
      '/daily note/{{now | date "2006/01"}}/{{now | date "2006-01-02"}}';

    // 渲染日期模板
    const dailyNotePath = await this.renderTemplate(dailyNoteSavePath);

    // 尝试通过路径获取文档 ID
    const existingIds = await this.documentApi.getDocIdsByPath(notebookId, dailyNotePath);

    if (existingIds.length > 0) {
      // 今日笔记已存在
      return existingIds[0];
    }

    // 创建今日笔记
    let initialContent = '';

    // 如果配置了今日笔记模板，使用模板内容
    if (notebookConf.dailyNoteTemplatePath) {
      try {
        const templateIds = await this.documentApi.getDocIdsByPath(
          notebookId,
          notebookConf.dailyNoteTemplatePath
        );
        if (templateIds.length > 0) {
          initialContent = await this.blockApi.getBlockMarkdown(templateIds[0]);
        }
      } catch (error) {
        // 模板不存在或获取失败，使用空内容
        console.warn('Failed to get daily note template:', error);
      }
    }

    const dailyNoteId = await this.documentApi.createDocument(
      notebookId,
      dailyNotePath,
      initialContent
    );

    return dailyNoteId;
  }

  /**
   * 追加内容到今日笔记
   * @param notebookId 笔记本 ID
   * @param content Markdown 内容
   * @returns 新创建的块 ID
   */
  async appendToDailyNote(notebookId: string, content: string): Promise<string> {
    const dailyNoteId = await this.getOrCreateDailyNote(notebookId);
    return await this.blockApi.appendBlock(dailyNoteId, content);
  }

  /**
   * 在今日笔记开头插入内容
   * @param notebookId 笔记本 ID
   * @param content Markdown 内容
   * @returns 新创建的块 ID
   */
  async prependToDailyNote(notebookId: string, content: string): Promise<string> {
    const dailyNoteId = await this.getOrCreateDailyNote(notebookId);

    // 获取今日笔记的第一个子块
    const sql = `SELECT * FROM blocks WHERE root_id='${dailyNoteId}' AND parent_id='${dailyNoteId}' ORDER BY sort LIMIT 1`;
    const blocks = await this.client.request('/api/query/sql', { stmt: sql });

    if (blocks.data && blocks.data.length > 0) {
      const firstBlockId = blocks.data[0].id;
      return await this.blockApi.insertBlockBefore(firstBlockId, content);
    }

    // 如果没有子块，直接追加
    return await this.blockApi.appendBlock(dailyNoteId, content);
  }
}
