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
   * 列出所有标签
   * @returns 标签数组（去重后的）
   */
  async listAllTags(): Promise<string[]> {
    // 查询所有带标签的块（tag字段非空）
    const stmt = `SELECT DISTINCT tag FROM blocks WHERE tag != '' AND tag IS NOT NULL`;
    const response = await this.client.request<Array<{ tag: string }>>('/api/query/sql', { stmt });
    const blocks = response.data || [];

    // 展开多标签（标签可能是用逗号或空格分隔的）
    const tagSet = new Set<string>();
    blocks.forEach(block => {
      if (block.tag) {
        // 按空格分割标签（思源的标签格式如：#tag1# #tag2#）
        const tags = block.tag.split(/\s+/).filter(t => t.trim());
        tags.forEach(tag => {
          // 移除 # 符号并添加到集合
          const cleanTag = tag.replace(/#/g, '').trim();
          if (cleanTag) {
            tagSet.add(cleanTag);
          }
        });
      }
    });

    return Array.from(tagSet).sort();
  }

  /**
   * 根据标签查找相关文档
   * @param tag 标签名（不需要包含#符号）
   * @param limit 返回结果数量限制，默认 50
   * @returns 搜索结果响应
   */
  async searchByTag(tag: string, limit: number = 50): Promise<SearchResultResponse[]> {
    // 查询包含指定标签的块（文档类型）
    const cleanTag = tag.replace(/#/g, '').trim();
    const stmt = `SELECT * FROM blocks WHERE type='d' AND tag LIKE '%#${this.escapeSql(cleanTag)}#%' LIMIT ${limit}`;

    const response = await this.client.request<Block[]>('/api/query/sql', { stmt });
    const blocks = response.data || [];
    return this.toSearchResultResponse(blocks);
  }

  /**
   * 统一搜索接口：支持按内容、标签、文件名等多种条件搜索
   * @param options 搜索选项
   * @returns 搜索结果响应
   */
  async search(options: {
    content?: string;
    tag?: string;
    filename?: string;
    limit?: number;
    notebook?: string;
    types?: string[];
  }): Promise<SearchResultResponse[]> {
    const { content, tag, filename, limit = 10, notebook, types } = options;

    // 构建SQL查询条件
    const conditions: string[] = [];

    // 如果指定了文件名，搜索文档类型
    if (filename) {
      conditions.push(`type='d'`);
      conditions.push(`content LIKE '%${this.escapeSql(filename)}%'`);
    }

    // 如果指定了内容，搜索内容
    if (content) {
      conditions.push(`content LIKE '%${this.escapeSql(content)}%'`);
    }

    // 如果指定了标签，搜索标签
    if (tag) {
      const cleanTag = tag.replace(/#/g, '').trim();
      conditions.push(`tag LIKE '%#${this.escapeSql(cleanTag)}#%'`);
    }

    // 如果指定了笔记本
    if (notebook) {
      conditions.push(`box='${this.escapeSql(notebook)}'`);
    }

    // 如果指定了类型
    if (types && types.length > 0) {
      const typeConditions = types.map((t) => `'${this.escapeSql(t)}'`).join(',');
      conditions.push(`type IN (${typeConditions})`);
    }

    // 如果没有任何条件，返回空数组
    if (conditions.length === 0) {
      return [];
    }

    // 构建完整的SQL语句
    const stmt = `SELECT * FROM blocks WHERE ${conditions.join(' AND ')} LIMIT ${limit}`;

    const response = await this.client.request<Block[]>('/api/query/sql', { stmt });
    const blocks = response.data || [];
    return this.toSearchResultResponse(blocks);
  }

  /**
   * 转义 SQL 特殊字符
   */
  private escapeSql(str: string): string {
    return str.replace(/'/g, "''");
  }
}
