/**
 * 思源笔记搜索相关 API
 */

import type { SiyuanClient } from './client.js';
import type { Block, SearchOptions, SearchResultResponse, TagResponse } from '../types/index.js';
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
   * @param prefix 可选的标签前缀过滤
   * @param depth 可选的层级限制(从1开始计数,例如 depth=1 只返回顶层标签)
   * @returns 标签数组,包含标签名和使用次数
   */
  async listAllTags(prefix?: string, depth?: number): Promise<TagResponse[]> {
    // 使用思源官方的标签 API,传递 sort 参数
    // 注意:此 API 有 512 条的软限制(Conf.FileTree.MaxListCount)
    // 但对于大多数用户来说足够使用
    const response = await this.client.request<Array<{
      name: string;
      label: string;
      children?: any[];
      type: string;
      depth: number;
      count: number;
    }>>('/api/tag/getTag', { sort: 4 });

    const tags = response.data || [];

    // 递归提取所有标签的 label 和 count(包括子标签)
    const tagMap = new Map<string, number>();
    const extractTags = (tagList: any[]) => {
      for (const tag of tagList) {
        if (tag.label) {
          tagMap.set(tag.label, tag.count || 0);
        }
        // 递归处理子标签
        if (tag.children && tag.children.length > 0) {
          extractTags(tag.children);
        }
      }
    };
    extractTags(tags);

    // 转换为 TagResponse 数组
    let result: TagResponse[] = Array.from(tagMap.entries()).map(([label, count]) => ({
      label,
      document_count: count
    }));

    // 应用前缀过滤
    if (prefix) {
      result = result.filter(tag => tag.label.startsWith(prefix));
    }

    // 应用层级限制
    if (depth && depth > 0) {
      result = result.filter(tag => {
        // 计算标签的层级(通过分隔符 '/' 来判断)
        const level = tag.label.split('/').length;
        return level <= depth;
      });
    }

    // 按标签名排序
    return result.sort((a, b) => a.label.localeCompare(b.label));
  }

  /**
   * 根据标签查找相关文档
   * @param tag 标签名(不需要包含#符号)
   * @param limit 返回结果数量限制,默认 50
   * @returns 搜索结果响应
   */
  async searchByTag(tag: string, limit: number = 50): Promise<SearchResultResponse[]> {
    // 查询包含指定标签的块(文档类型)
    const cleanTag = tag.replace(/#/g, '').trim();
    const stmt = `SELECT * FROM blocks WHERE type='d' AND tag LIKE '%#${this.escapeSql(cleanTag)}#%' LIMIT ${limit}`;

    const response = await this.client.request<Block[]>('/api/query/sql', { stmt });
    const blocks = response.data || [];
    return this.toSearchResultResponse(blocks);
  }

  /**
   * 统一搜索接口:支持按内容、标签、文件名等多种条件搜索
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

    // 如果指定了文件名,搜索文档类型
    if (filename) {
      conditions.push(`type='d'`);
      conditions.push(`content LIKE '%${this.escapeSql(filename)}%'`);
    }

    // 如果指定了内容,搜索内容
    if (content) {
      conditions.push(`content LIKE '%${this.escapeSql(content)}%'`);
    }

    // 如果指定了标签,搜索标签
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

    // 如果没有任何条件,返回空数组
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
