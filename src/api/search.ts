/**
 * 思源笔记搜索相关 API
 */

import type { SiyuanClient } from './client.js';
import type { Block, SearchOptions, SearchResultResponse } from '../types/index.js';
import { extractTitle, truncateContent } from '../utils/format.js';

export class SiyuanSearchApi {
  constructor(private client: SiyuanClient) {}

  /**
   * 根据文件名搜索文档
   * @param fileName 文件名关键词
   * @param options 搜索选项
   * @returns 搜索结果响应
   */
  async searchByFileName(fileName: string, options: SearchOptions = {}): Promise<SearchResultResponse[]> {
    const { limit = 10, notebook } = options;

    let stmt = `SELECT * FROM blocks WHERE type='d' AND content LIKE '%${this.escapeSql(fileName)}%'`;

    if (notebook) {
      stmt += ` AND box='${this.escapeSql(notebook)}'`;
    }

    stmt += ` LIMIT ${limit}`;

    const response = await this.client.request<Block[]>('/api/query/sql', { stmt });
    const blocks = response.data || [];
    return this.toSearchResultResponse(blocks);
  }

  /**
   * 根据文件内容搜索块
   * @param content 内容关键词
   * @param options 搜索选项
   * @returns 搜索结果响应
   */
  async searchByContent(content: string, options: SearchOptions = {}): Promise<SearchResultResponse[]> {
    const { limit = 10, notebook, types } = options;

    let stmt = `SELECT * FROM blocks WHERE content LIKE '%${this.escapeSql(content)}%'`;

    if (notebook) {
      stmt += ` AND box='${this.escapeSql(notebook)}'`;
    }

    if (types && types.length > 0) {
      const typeConditions = types.map((t) => `'${this.escapeSql(t)}'`).join(',');
      stmt += ` AND type IN (${typeConditions})`;
    }

    stmt += ` LIMIT ${limit}`;

    const response = await this.client.request<Block[]>('/api/query/sql', { stmt });
    const blocks = response.data || [];
    return this.toSearchResultResponse(blocks);
  }

  /**
   * 使用 SQL 查询
   * @param sql SQL 语句
   * @returns 查询结果
   */
  async query(sql: string): Promise<Block[]> {
    const response = await this.client.request<Block[]>('/api/query/sql', { stmt: sql });
    return response.data || [];
  }


  /**
   * 将Block数组转换为搜索结果响应
   */
  private toSearchResultResponse(blocks: Block[]): SearchResultResponse[] {
    return blocks.map(block => ({
      id: block.id,
      name: block.name || extractTitle(block.content),
      path: block.hpath || block.path,
      content: truncateContent(block.content, 200), // 截取前200字符作为摘要
      type: block.type,
      updated: block.updated
    }));
  }

  /**
   * 转义 SQL 特殊字符
   */
  private escapeSql(str: string): string {
    return str.replace(/'/g, "''");
  }
}
