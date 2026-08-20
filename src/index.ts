/**
 * 思源笔记工具库
 * SiYuan Tools - A TypeScript library for SiYuan Note API operations
 *
 * @packageDocumentation
 */

import { SiyuanClient } from './api/client.js';
import { SiyuanSearchApi } from './api/search.js';
import { SiyuanBlockApi } from './api/block.js';
import { SiyuanDocumentApi } from './api/document.js';
import { SiyuanNotebookApi } from './api/notebook.js';
import { SiyuanSnapshotApi } from './api/snapshot.js';
import { SiyuanTagApi } from './api/tag.js';
import { DailyNoteUtils } from './utils/daily-note.js';
import { SiyuanHelpers } from './utils/helpers.js';

import type { SiyuanConfig } from './types/index.js';

/**
 * 思源笔记工具类
 * 整合了所有 API 操作的主类
 */
export class SiyuanTools {
  private client: SiyuanClient;

  /** 搜索相关 API */
  public readonly search: SiyuanSearchApi;

  /** 块操作相关 API */
  public readonly block: SiyuanBlockApi;

  /** 文档操作相关 API */
  public readonly document: SiyuanDocumentApi;

  /** 笔记本操作相关 API */
  public readonly notebook: SiyuanNotebookApi;

  /** 快照操作相关 API */
  public readonly snapshot: SiyuanSnapshotApi;

  /** 标签操作相关 API */
  public readonly tag: SiyuanTagApi;

  /** 今日笔记工具 */
  public readonly dailyNote: DailyNoteUtils;

  /** 辅助工具方法（提供增强功能，但按需使用以避免上下文过载） */
  public readonly helpers: SiyuanHelpers;

  constructor(config: SiyuanConfig) {
    this.client = new SiyuanClient(config);

    // 初始化各个 API 模块
    this.search = new SiyuanSearchApi(this.client);
    this.block = new SiyuanBlockApi(this.client);
    this.document = new SiyuanDocumentApi(this.client);
    this.notebook = new SiyuanNotebookApi(this.client);
    this.snapshot = new SiyuanSnapshotApi(this.client);
    this.tag = new SiyuanTagApi(this.client);
    this.dailyNote = new DailyNoteUtils(
      this.client,
      this.document,
      this.notebook,
      this.block
    );
    this.helpers = new SiyuanHelpers(this.client);
  }

  /**
   * 更新配置
   * @param config 新的配置（部分）
   */
  updateConfig(config: Partial<SiyuanConfig>): void {
    this.client.updateConfig(config);
  }

  /**
   * 获取当前配置
   */
  getConfig(): Readonly<SiyuanConfig> {
    return this.client.getConfig();
  }

  // ============ 便捷方法：常用操作的快捷方式 ============

  /**
   * 根据文件名搜索文件
   * @param fileName 文件名关键词
   * @param limit 返回结果数量限制，默认 10
   */
  async searchByFileName(fileName: string, limit?: number) {
    return this.search.searchByFileName(fileName, { limit });
  }

  /**
   * 根据文件内容搜索文件
   * @param content 内容关键词
   * @param limit 返回结果数量限制，默认 10
   */
  async searchByContent(content: string, limit?: number) {
    return this.search.searchByContent(content, { limit });
  }

  /**
   * 直查 SQL 的便捷方法（绕过 type-safe API 层）。
   * 主要给 overwriteFile 这类需要跨多个原子 API 的高级操作使用。
   * @param stmt SQL 语句
   * @returns Siyuan 原始响应
   */
  async querySQL<T = any>(stmt: string): Promise<{ code: number; msg?: string; data: T }> {
    return this.client.request<T>('/api/query/sql', { stmt });
  }

  /**
   * 查看文件内容
   * @param blockId 块 ID（文档 ID）
   * @returns Markdown 内容
   */
  async getFileContent(blockId: string): Promise<string> {
    return this.block.getBlockMarkdown(blockId);
  }

  /**
   * 将内容全覆盖到文件
   *
   * 修复（2026-08-20，bug 来源：会话 20260820_163654）：
   * 旧实现 `block.updateBlock(rootId, content)` 只更新根块 markdown 字段，
   * 旧子块全部残留，导致"新内容 + 旧内容"混杂。
   *
   * 新实现：删旧子块 → 清根块 markdown → append 新内容。
   *
   * @param blockId 块 ID（文档 ID）
   * @param content Markdown 内容
   * @returns 被删除的旧子块数量
   */
  async overwriteFile(blockId: string, content: string): Promise<number> {
    // 1) 列出旧子块（不含根块）
    const childIds = await this.block.listChildBlocks(blockId);

    // 2) 并行删除（限 5 并发，避免思源后端过载）
    const CONCURRENCY = 5;
    let deletedCount = 0;
    for (let i = 0; i < childIds.length; i += CONCURRENCY) {
      const batch = childIds.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        batch.map((id) => this.block.deleteBlock(id))
      );
      for (const r of results) {
        if (r.status === 'fulfilled') deletedCount++;
      }
    }

    // 3) 读根块 content（文档标题），用于首行 H1 去重
    let rootTitle = '';
    try {
      const sqlResp = await this.querySQL<Array<{ content: string }>>(
        `SELECT content FROM blocks WHERE id='${blockId}' AND type='d' LIMIT 1`
      );
      if (sqlResp.code === 0 && Array.isArray(sqlResp.data) && sqlResp.data[0]?.content) {
        rootTitle = sqlResp.data[0].content.trim();
      }
    } catch {
      // 静默：拿不到就跳过剥首行
    }

    // 4) 若新 markdown 首行是 `# xxx` 且与根块标题一致，剥掉首行
    let processedContent = content;
    if (rootTitle) {
      const lines = content.split('\n');
      let idx = 0;
      while (idx < lines.length && lines[idx].trim() === '') idx++;
      if (idx < lines.length) {
        const h1Match = lines[idx].match(/^#\s+(.+?)\s*$/);
        if (h1Match && h1Match[1].trim() === rootTitle) {
          lines.splice(idx, 1);
          while (lines.length > 0 && lines[0].trim() === '') lines.shift();
          processedContent = lines.join('\n');
        }
      }
    }

    // 5) 清空根块 markdown 字段（防止双重标题渲染）
    await this.block.updateBlock(blockId, '');

    // 6) 追加新内容到根块下
    if (processedContent.trim().length > 0) {
      await this.block.appendBlock(blockId, processedContent);
    }

    return deletedCount;
  }

  /**
   * 将内容追加到文件
   * @param blockId 块 ID（父块）
   * @param content Markdown 内容
   * @returns 新创建的块 ID
   */
  async appendToFile(blockId: string, content: string): Promise<string> {
    return this.block.appendBlock(blockId, content);
  }

  /**
   * 将内容创建为新的文档
   * @param notebookId 笔记本 ID
   * @param path 文档路径（如 /folder/filename）
   * @param content Markdown 内容
   * @returns 新创建的文档 ID
   */
  async createFile(notebookId: string, path: string, content: string): Promise<string> {
    return this.document.createDocument(notebookId, path, content);
  }

  /**
   * 将内容追加到今日笔记
   * @param notebookId 笔记本 ID
   * @param content Markdown 内容
   * @returns 新创建的块 ID
   */
  async appendToDailyNote(notebookId: string, content: string): Promise<string> {
    return this.dailyNote.appendToDailyNote(notebookId, content);
  }

  /**
   * 列出所有笔记本
   */
  async listNotebooks() {
    return this.notebook.listNotebooks();
  }
}

/**
 * 创建 SiyuanTools 实例的工厂函数
 * @param baseUrl 思源笔记服务地址，默认 http://127.0.0.1:6806
 * @param token API Token
 * @returns SiyuanTools 实例
 */
export function createSiyuanTools(baseUrl = 'http://127.0.0.1:6806', token: string): SiyuanTools {
  return new SiyuanTools({ baseUrl, token });
}

// 导出所有类型
export * from './types/index.js';
export * from './types/enhanced.js';

// 导出各个 API 类（供高级用户使用）
export { SiyuanClient } from './api/client.js';
export { SiyuanSearchApi } from './api/search.js';
export { SiyuanBlockApi } from './api/block.js';
export { SiyuanDocumentApi } from './api/document.js';
export { SiyuanNotebookApi } from './api/notebook.js';
export { SiyuanSnapshotApi } from './api/snapshot.js';
export { SiyuanTagApi } from './api/tag.js';
export { DailyNoteUtils } from './utils/daily-note.js';
export { SiyuanHelpers } from './utils/helpers.js';