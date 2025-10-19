/**
 * 思源笔记文档操作相关 API
 */

import type { SiyuanClient } from './client.js';
import type { DocTreeNode, DocTreeNodeResponse } from '../types/index.js';
import { extractTitle } from '../utils/format.js';

export class SiyuanDocumentApi {
  constructor(private client: SiyuanClient) {}

  /**
   * 创建文档（使用 Markdown）
   * @param notebookId 笔记本 ID
   * @param path 文档路径（如 /folder/filename）
   * @param markdown Markdown 内容
   * @returns 新创建的文档 ID
   */
  async createDocument(notebookId: string, path: string, markdown: string): Promise<string> {
    const response = await this.client.request<string>('/api/filetree/createDocWithMd', {
      notebook: notebookId,
      path: path,
      markdown: markdown,
    });

    if (response.code !== 0) {
      throw new Error(`Failed to create document: ${response.msg}`);
    }

    return response.data;
  }

  /**
   * 删除文档
   * @param notebookId 笔记本 ID
   * @param path 文档路径
   */
  async removeDocument(notebookId: string, path: string): Promise<void> {
    const response = await this.client.request('/api/filetree/removeDoc', {
      notebook: notebookId,
      path: path,
    });

    if (response.code !== 0) {
      throw new Error(`Failed to remove document: ${response.msg}`);
    }
  }

  /**
   * 重命名文档
   * @param notebookId 笔记本 ID
   * @param path 文档路径
   * @param newName 新名称
   */
  async renameDocument(notebookId: string, path: string, newName: string): Promise<void> {
    const response = await this.client.request('/api/filetree/renameDoc', {
      notebook: notebookId,
      path: path,
      title: newName,
    });

    if (response.code !== 0) {
      throw new Error(`Failed to rename document: ${response.msg}`);
    }
  }

  /**
   * 移动文档
   * @param fromNotebookId 源笔记本 ID
   * @param fromPath 源路径
   * @param toNotebookId 目标笔记本 ID
   * @param toPath 目标路径
   */
  async moveDocument(
    fromNotebookId: string,
    fromPath: string,
    toNotebookId: string,
    toPath: string
  ): Promise<void> {
    const response = await this.client.request('/api/filetree/moveDoc', {
      fromNotebook: fromNotebookId,
      fromPath: fromPath,
      toNotebook: toNotebookId,
      toPath: toPath,
    });

    if (response.code !== 0) {
      throw new Error(`Failed to move document: ${response.msg}`);
    }
  }

  /**
   * 根据ID移动文档到另一个文档下
   * @param fromIds 要移动的文档ID列表（可以是单个或多个）
   * @param toId 目标文档ID
   */
  async moveDocumentsByIds(fromIds: string | string[], toId: string): Promise<void> {
    const fromIdArray = Array.isArray(fromIds) ? fromIds : [fromIds];

    const response = await this.client.request('/api/filetree/moveDocsByID', {
      fromIDs: fromIdArray,
      toID: toId,
    });

    if (response.code !== 0) {
      throw new Error(`Failed to move documents: ${response.msg}`);
    }
  }

  /**
   * 根据ID移动文档到笔记本根目录
   * @param fromIds 要移动的文档ID列表（可以是单个或多个）
   * @param toNotebookId 目标笔记本ID
   */
  async moveDocumentsToNotebookRoot(fromIds: string | string[], toNotebookId: string): Promise<void> {
    const fromIdArray = Array.isArray(fromIds) ? fromIds : [fromIds];

    // 首先获取所有文档的路径
    const fromPaths: string[] = [];
    for (const docId of fromIdArray) {
      const stmt = `SELECT hpath FROM blocks WHERE id = '${docId}' AND type = 'd'`;
      const response = await this.client.request<any[]>('/api/query/sql', { stmt });
      const blocks = response.data || [];
      if (blocks.length > 0) {
        fromPaths.push(blocks[0].hpath);
      }
    }

    if (fromPaths.length === 0) {
      throw new Error('No valid documents found to move');
    }

    // 使用 moveDocs API 移动到笔记本根目录
    const response = await this.client.request('/api/filetree/moveDocs', {
      fromPaths: fromPaths,
      toNotebook: toNotebookId,
      toPath: '/',  // "/" 表示笔记本根目录
    });

    if (response.code !== 0) {
      throw new Error(`Failed to move documents to notebook root: ${response.msg}`);
    }
  }

  /**
   * 根据路径获取文档 ID
   * @param notebookId 笔记本 ID
   * @param path 文档路径
   * @returns 文档 ID 列表
   */
  async getDocIdsByPath(notebookId: string, path: string): Promise<string[]> {
    const response = await this.client.request<string[]>('/api/filetree/getIDsByHPath', {
      notebook: notebookId,
      path: path,
    });

    return response.data || [];
  }

  /**
   * 获取文档树
   * @param notebookId 笔记本 ID
   * @param path 起始路径（可选）
   * @returns 文档树
   */
  async getDocTree(notebookId: string, path?: string): Promise<DocTreeNode[]> {
    const response = await this.client.request<DocTreeNode[]>('/api/filetree/listDocTree', {
      notebook: notebookId,
      path: path,
    });

    return response.data || [];
  }

  /**
   * 获取人类可读的文档路径
   * @param blockId 块 ID
   * @returns 人类可读路径
   */
  async getHumanReadablePath(blockId: string): Promise<string> {
    const response = await this.client.request<{ hPath: string }>(
      '/api/filetree/getHPathByID',
      {
        id: blockId,
      }
    );

    return response.data.hPath;
  }

  /**
   * 获取文档树结构（带深度限制）
   * @param id 文档ID或笔记本ID
   * @param maxDepth 最大深度（1表示只返回直接子节点，默认为1）
   * @returns 文档树响应节点数组
   */
  async getDocumentTree(id: string, maxDepth: number = 1): Promise<DocTreeNodeResponse[]> {
    // 使用SQL查询获取文档树结构
    const sql = this.buildTreeQuery(id, maxDepth);
    const response = await this.client.request<any[]>('/api/query/sql', {
      stmt: sql,
    });

    if (response.code !== 0) {
      throw new Error(`Failed to get document tree: ${response.msg}`);
    }

    // 转换为响应树形结构 - response.data 是对象数组
    return this.toDocTreeNodeResponse(response.data || []);
  }

  /**
   * 构建查询文档树的SQL语句
   */
  private buildTreeQuery(id: string, maxDepth: number): string {
    // 查询指定ID下的所有文档，按深度限制
    return `
      WITH RECURSIVE doc_tree AS (
        -- 基础查询：获取起始节点
        -- 情况1: id 是笔记本ID (box) - 获取该笔记本的顶层文档
        -- 情况2: id 是文档ID - 获取该文档及其子文档
        SELECT
          b.id,
          b.parent_id,
          b.root_id,
          b.content as name,
          b.box,
          b.path,
          b.hpath,
          b.type,
          b.subtype,
          b.ial,
          0 as depth
        FROM blocks b
        WHERE b.type = 'd'
          AND (
            -- 情况1: 笔记本的顶层文档 (box匹配且parent_id为空)
            (b.box = '${id}' AND b.parent_id = '')
            OR
            -- 情况2: 指定文档ID
            b.id = '${id}'
          )

        UNION ALL

        -- 递归查询：获取子节点
        SELECT
          b.id,
          b.parent_id,
          b.root_id,
          b.content as name,
          b.box,
          b.path,
          b.hpath,
          b.type,
          b.subtype,
          b.ial,
          dt.depth + 1 as depth
        FROM blocks b
        INNER JOIN doc_tree dt ON b.parent_id = dt.id
        WHERE b.type = 'd'
          AND dt.depth < ${maxDepth}
      )
      SELECT * FROM doc_tree
      ORDER BY depth, path;
    `;
  }

  /**
   * 从查询结果构建文档树响应结构
   */
  private toDocTreeNodeResponse(data: any[]): DocTreeNodeResponse[] {
    if (!data || data.length === 0) return [];

    // 将对象数据转换为响应节点对象
    const nodeMap = new Map<string, DocTreeNodeResponse>();
    const rootNodes: DocTreeNodeResponse[] = [];

    data.forEach((item) => {
      const node: DocTreeNodeResponse = {
        id: item.id as string,
        name: extractTitle(item.content || item.name), // content/name
        path: item.hpath as string, // 人类可读路径
        children: [],
      };

      nodeMap.set(node.id, node);

      // 如果是根节点或没有父节点
      const parentId = item.parent_id as string;
      const depth = item.depth as number;

      if (depth === 0 || !parentId) {
        rootNodes.push(node);
      } else {
        const parent = nodeMap.get(parentId);
        if (parent) {
          if (!parent.children) {
            parent.children = [];
          }
          parent.children.push(node);
        }
      }
    });

    return rootNodes;
  }


}
