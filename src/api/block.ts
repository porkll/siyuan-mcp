/**
 * 思源笔记块操作相关 API
 */

import type { SiyuanClient } from './client.js';

export class SiyuanBlockApi {
  constructor(private client: SiyuanClient) {}

  private normalizeResult<T = any>(result: any): T {
    if (result && typeof result === 'object' && 'data' in result) {
      return result.data as T;
    }

    return result as T;
  }

  private escapeSqlString(value: string): string {
    return value.replace(/'/g, "''");
  }

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
   * 获取块基础信息
   * @param blockId 块 ID
   * @returns 块信息
   */
  async getBlock(blockId: string): Promise<any> {
    const response = await this.client.request(
      '/api/block/getBlockInfo',
      { id: blockId }
    );

    if (response.code !== 0) {
      throw new Error(`Failed to get block: ${response.msg}`);
    }
    const normalized = this.normalizeResult(response);

    // SiYuan's /api/block/getBlockInfo metadata may omit the requested block id
    // even when the block exists. Several higher-level handlers rely on `id`
    // being present for existence checks and block unwrapping, so preserve the
    // requested id when the API response does not include one.
    if (normalized && typeof normalized === 'object' && !Array.isArray(normalized)) {
      return {
        ...normalized,
        id: normalized.id ?? blockId,
      };
    }

    return normalized;
  }

  /**
   * 获取直接子块
   * @param blockId 父块 ID
   * @returns 子块列表
   */
  async getChildBlocks(blockId: string): Promise<any[]> {
    const response = await this.client.request(
      '/api/block/getChildBlocks',
      { id: blockId }
    );

    if (response.code !== 0) {
      throw new Error(`Failed to get child blocks: ${response.msg}`);
    }

    const normalized = this.normalizeResult<any[]>(response);
    return Array.isArray(normalized) ? normalized : [];
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
   * 在父块下前插子块
   * @param parentId 父块 ID
   * @param content Markdown 内容
   * @returns 新创建的块 ID
   */
  async prependBlock(parentId: string, content: string): Promise<string> {
    interface BlockOperation {
      doOperations: Array<{ id: string; action: string }>;
    }

    const response = await this.client.request<BlockOperation[]>(
      '/api/block/prependBlock',
      {
        parentID: parentId,
        dataType: 'markdown',
        data: content,
      }
    );

    if (response.code !== 0) {
      throw new Error(`Failed to prepend block: ${response.msg}`);
    }

    return response.data[0].doOperations[0].id;
  }

  /**
   * 在指定块之前插入块
   * @param nextId 参考块 ID（新块会插入到它前面）
   * @param content Markdown 内容
   * @returns 新创建的块 ID
   */
  async insertBlockBefore(nextId: string, content: string): Promise<string> {
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
      throw new Error(`Failed to insert block before: ${response.msg}`);
    }

    return response.data[0].doOperations[0].id;
  }

  /**
   * 在指定块之后插入块
   * @param previousId 参考块 ID（新块会插入到它后面）
   * @param content Markdown 内容
   * @returns 新创建的块 ID
   */
  async insertBlockAfter(previousId: string, content: string): Promise<string> {
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
      throw new Error(`Failed to insert block after: ${response.msg}`);
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

  /**
   * Replace text inside a single block without rewriting the whole document tree.
   */
  async replaceTextInBlock(
    blockId: string,
    find: string,
    replace: string,
    replaceAll = false
  ): Promise<{
    success: boolean;
    blockId: string;
    replacements: number;
    changed: boolean;
  }> {
    if (!find || find.length === 0) {
      throw new Error('Parameter "find" must not be empty');
    }

    const originalContent = await this.getBlockMarkdown(blockId);

    if (!originalContent.includes(find)) {
      return {
        success: true,
        blockId,
        replacements: 0,
        changed: false,
      };
    }

    let updatedContent: string;
    let replacements = 0;

    if (replaceAll) {
      replacements = originalContent.split(find).length - 1;
      updatedContent = originalContent.split(find).join(replace);
    } else {
      replacements = 1;
      updatedContent = originalContent.replace(find, replace);
    }

    if (updatedContent === originalContent) {
      return {
        success: true,
        blockId,
        replacements: 0,
        changed: false,
      };
    }

    await this.updateBlock(blockId, updatedContent);

    return {
      success: true,
      blockId,
      replacements,
      changed: true,
    };
  }

  /**
   * Replace text inside a block only if optional surrounding context matches.
   */
  async replaceTextInBlockStrict(
    blockId: string,
    find: string,
    replace: string,
    options?: {
      replaceAll?: boolean;
      beforeContext?: string;
      afterContext?: string;
      mustMatchExactlyOnce?: boolean;
    }
  ): Promise<{
    success: boolean;
    blockId: string;
    replacements: number;
    changed: boolean;
    total_plain_matches: number;
    strict_matches: number;
    matched_ranges: Array<{ start: number; end: number }>;
    block_preview: string;
  }> {
    if (!find || find.length === 0) {
      throw new Error('Parameter "find" must not be empty');
    }

    const {
      replaceAll = false,
      beforeContext,
      afterContext,
      mustMatchExactlyOnce = true,
    } = options || {};

    const originalContent = await this.getBlockMarkdown(blockId);

    const plainMatches: Array<{ start: number; end: number }> = [];
    const strictMatches: Array<{ start: number; end: number }> = [];

    let searchFrom = 0;

    while (true) {
      const index = originalContent.indexOf(find, searchFrom);
      if (index === -1) {
        break;
      }

      const start = index;
      const end = index + find.length;

      plainMatches.push({ start, end });

      const beforeOk =
        beforeContext === undefined ||
        originalContent.slice(
          Math.max(0, start - beforeContext.length),
          start
        ) === beforeContext;

      const afterOk =
        afterContext === undefined ||
        originalContent.slice(end, end + afterContext.length) === afterContext;

      if (beforeOk && afterOk) {
        strictMatches.push({ start, end });
      }

      searchFrom = index + Math.max(find.length, 1);
    }

    const preview = originalContent.slice(0, 300);

    if (mustMatchExactlyOnce) {
      if (strictMatches.length === 0) {
        throw new Error(
          `Strict replace found no matching text in block. plain_matches=${plainMatches.length}, strict_matches=0`
        );
      }

      if (strictMatches.length !== 1) {
        throw new Error(
          `Strict replace expected exactly 1 strict match, but found ${strictMatches.length}`
        );
      }
    } else if (strictMatches.length === 0) {
      return {
        success: true,
        blockId,
        replacements: 0,
        changed: false,
        total_plain_matches: plainMatches.length,
        strict_matches: 0,
        matched_ranges: [],
        block_preview: preview,
      };
    }

    let updatedContent = originalContent;
    let replacements = 0;

    if (replaceAll) {
      let offset = 0;

      for (const match of strictMatches) {
        const adjustedStart = match.start + offset;
        const adjustedEnd = match.end + offset;

        updatedContent =
          updatedContent.slice(0, adjustedStart) +
          replace +
          updatedContent.slice(adjustedEnd);

        offset += replace.length - (match.end - match.start);
        replacements += 1;
      }
    } else {
      const match = strictMatches[0];
      updatedContent =
        originalContent.slice(0, match.start) +
        replace +
        originalContent.slice(match.end);

      replacements = 1;
    }

    if (updatedContent === originalContent) {
      return {
        success: true,
        blockId,
        replacements: 0,
        changed: false,
        total_plain_matches: plainMatches.length,
        strict_matches: strictMatches.length,
        matched_ranges: strictMatches,
        block_preview: preview,
      };
    }

    await this.updateBlock(blockId, updatedContent);

    return {
      success: true,
      blockId,
      replacements,
      changed: true,
      total_plain_matches: plainMatches.length,
      strict_matches: strictMatches.length,
      matched_ranges: strictMatches,
      block_preview: preview,
    };
  }

  /**
   * Get contextual blocks around a given block
   */
  async getBlockContext(
    blockId: string,
    options?: {
      parents?: number;
      siblingsBefore?: number;
      siblingsAfter?: number;
      children?: number;
    }
  ): Promise<{
    target: any;
    parents: any[];
    siblings_before: any[];
    siblings_after: any[];
    children: any[];
  }> {
    const {
      parents = 1,
      siblingsBefore = 1,
      siblingsAfter = 1,
      children = 2,
    } = options || {};

    const target = await this.getBlock(blockId);

    if (!target) {
      throw new Error(`Block not found: ${blockId}`);
    }

    const getParentId = (block: any): string | undefined =>
      block?.parentID || block?.parentId || block?.parent_id;

    const getBlockId = (block: any): string | undefined =>
      block?.id || block?.blockID || block?.blockId || block?.block_id;

    let parentBlocks: any[] = [];
    let current = target;

    for (let i = 0; i < parents; i++) {
      const parentId = getParentId(current);
      if (!parentId) {
        break;
      }

      const parent = await this.getBlock(parentId);
      if (!parent) {
        break;
      }

      parentBlocks.unshift(parent);
      current = parent;
    }

    let siblingsBeforeBlocks: any[] = [];
    let siblingsAfterBlocks: any[] = [];

    const parentId = getParentId(target);
    if (parentId) {
      const siblings = await this.getChildBlocks(parentId);
      const index = siblings.findIndex((b: any) => getBlockId(b) === blockId);

      if (index !== -1) {
        siblingsBeforeBlocks = siblings.slice(
          Math.max(0, index - siblingsBefore),
          index
        );

        siblingsAfterBlocks = siblings.slice(
          index + 1,
          index + 1 + siblingsAfter
        );
      }
    }

    let childBlocks: any[] = [];
    if (children > 0) {
      childBlocks = await this.getChildBlocks(blockId);
      childBlocks = childBlocks.slice(0, children);
    }

    return {
      target,
      parents: parentBlocks,
      siblings_before: siblingsBeforeBlocks,
      siblings_after: siblingsAfterBlocks,
      children: childBlocks,
    };
  }

  /**
   * Get a compact subtree slice starting from one block.
   */
  async getBlockTreeSlice(
    blockId: string,
    depth = 2
  ): Promise<any> {
    const safeDepth = Math.max(0, Math.min(depth, 8));

    const getBlockId = (block: any): string | undefined =>
      block?.id || block?.blockID || block?.blockId || block?.block_id;

    const getParentId = (block: any): string | undefined =>
      block?.parentID || block?.parentId || block?.parent_id;

    const getRootId = (block: any): string | undefined =>
      block?.rootID || block?.rootId || block?.root_id;

    const getContent = (block: any): string =>
      String(block?.content || block?.name || block?.markdown || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 180);

    const buildNode = async (id: string, currentDepth: number): Promise<any> => {
      const block = await this.getBlock(id);

      const node: any = {
        id: getBlockId(block) || id,
        parent_id: getParentId(block),
        root_id: getRootId(block),
        type: block?.type,
        content: getContent(block),
        children: [],
      };

      if (currentDepth <= 0) {
        return node;
      }

      const children = await this.getChildBlocks(id);

      node.children = await Promise.all(
        children.map(async (child: any) => {
          const childId = getBlockId(child);

          if (!childId) {
            return {
              id: undefined,
              parent_id: id,
              root_id: getRootId(child),
              type: child?.type,
              content: getContent(child),
              children: [],
            };
          }

          return buildNode(childId, currentDepth - 1);
        })
      );

      return node;
    };

    return buildNode(blockId, safeDepth);
  }

  /**
   * Find heading-like blocks within a local subtree by text match.
   */
  async findHeadingInTree(
    blockId: string,
    headingQuery: string,
    depth = 4
  ): Promise<any[]> {
    const tree = await this.getBlockTreeSlice(blockId, depth);
    const needle = headingQuery.trim().toLowerCase();

    if (!needle) {
      throw new Error('Parameter "headingQuery" must not be empty');
    }

    const matches: any[] = [];

    const walk = (node: any) => {
      const content = String(node?.content || '').toLowerCase();
      const type = String(node?.type || '');

      if (
        content.includes(needle) &&
        (type.startsWith('h') || type.includes('heading') || type === 'NodeHeading')
      ) {
        matches.push({
          id: node.id,
          parent_id: node.parent_id,
          root_id: node.root_id,
          type: node.type,
          content: node.content,
        });
      }

      for (const child of node?.children || []) {
        walk(child);
      }
    };

    walk(tree);
    return matches;
  }

  /**
   * Get a section by heading text within a local subtree.
   */
  async getSectionByHeading(
    blockId: string,
    headingQuery: string
  ): Promise<{
    heading: any;
    section_blocks: any[];
  }> {
    const matches = await this.findHeadingInTree(blockId, headingQuery, 6);

    if (matches.length === 0) {
      throw new Error(`No heading found matching "${headingQuery}"`);
    }

    if (matches.length > 1) {
      throw new Error(`Multiple headings found matching "${headingQuery}"`);
    }

    const heading = matches[0];
    const parentId = heading.parent_id;

    if (!parentId) {
      return {
        heading,
        section_blocks: [heading],
      };
    }

    const siblings = await this.getChildBlocks(parentId);

    const getBlockId = (block: any): string | undefined =>
      block?.id || block?.blockID || block?.blockId || block?.block_id;

    const headingIndex = siblings.findIndex(
      (b: any) => getBlockId(b) === heading.id
    );

    if (headingIndex === -1) {
      return {
        heading,
        section_blocks: [heading],
      };
    }

    const getHeadingLevel = (block: any): number => {
      const type = String(block?.type || '');
      const content = String(block?.content || '');

      const typeMatch = type.match(/^h([1-6])$/i);
      if (typeMatch) {
        return Number(typeMatch[1]);
      }

      const markdownStyleMatch = content.match(/^(#{1,6})\s+/);
      if (markdownStyleMatch) {
        return markdownStyleMatch[1].length;
      }

      if (type.includes('heading') || type === 'NodeHeading') {
        return 6;
      }

      return 99;
    };

    const currentLevel = getHeadingLevel(heading);
    const sectionBlocks: any[] = [heading];

    for (let i = headingIndex + 1; i < siblings.length; i++) {
      const sibling = siblings[i];
      const siblingType = String(sibling?.type || '');

      const isHeadingLike =
        siblingType.startsWith('h') ||
        siblingType.includes('heading') ||
        siblingType === 'NodeHeading';

      if (isHeadingLike) {
        const siblingLevel = getHeadingLevel(sibling);
        if (siblingLevel <= currentLevel) {
          break;
        }
      }

      sectionBlocks.push(sibling);
    }

    return {
      heading,
      section_blocks: sectionBlocks,
    };
  }

  /**
   * Search blocks across the whole document tree.
   */
  async searchBlocks(
    query: string,
    limit = 10
  ): Promise<
    Array<{
      block_id: string;
      parent_id?: string;
      root_id?: string;
      type?: string;
      hpath?: string;
      snippet: string;
      updated?: string;
    }>
  > {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      throw new Error('Parameter "query" must not be empty');
    }

    const safeLimit = Math.max(1, Math.min(limit, 50));
    const sqlQuery = this.escapeSqlString(trimmedQuery);

    const stmt = `
      SELECT
        id AS block_id,
        parent_id,
        root_id,
        type,
        hpath,
        content,
        markdown,
        updated
      FROM blocks
      WHERE markdown LIKE '%${sqlQuery}%'
         OR content LIKE '%${sqlQuery}%'
      ORDER BY updated DESC
      LIMIT ${safeLimit};
    `;

    const response = await this.client.request('/api/query/sql', { stmt });

    if (response.code !== 0) {
      throw new Error(`Failed to search blocks: ${response.msg}`);
    }

    const rows = this.normalizeResult<any[]>(response);
    const list = Array.isArray(rows) ? rows : [];

    return list.map((row: any) => {
      const raw = String(row.content || row.markdown || '')
        .replace(/\s+/g, ' ')
        .trim();

      return {
        block_id: row.block_id,
        parent_id: row.parent_id,
        root_id: row.root_id,
        type: row.type,
        hpath: row.hpath,
        updated: row.updated,
        snippet: raw.slice(0, 240),
      };
    });
  }

  /**
   * Replace a specific character range inside a block
   */
  async replaceRangeInBlock(
    blockId: string,
    start: number,
    end: number,
    replacement: string
  ): Promise<{
    success: boolean;
    blockId: string;
    changed: boolean;
  }> {
    if (start < 0 || end < start) {
      throw new Error('Invalid range: start/end');
    }

    const originalContent = await this.getBlockMarkdown(blockId);

    if (start > originalContent.length || end > originalContent.length) {
      throw new Error('Invalid range: outside block length');
    }

    const updatedContent =
      originalContent.slice(0, start) +
      replacement +
      originalContent.slice(end);

    if (updatedContent === originalContent) {
      return {
        success: true,
        blockId,
        changed: false,
      };
    }

    await this.updateBlock(blockId, updatedContent);

    return {
      success: true,
      blockId,
      changed: true,
    };
  }

  /**
   * Get block attributes
   */
  async getBlockAttributes(blockId: string): Promise<Record<string, string>> {
    const response = await this.client.request('/api/attr/getBlockAttrs', {
      id: blockId,
    });

    if (response.code !== 0) {
      throw new Error(`Failed to get block attrs: ${response.msg}`);
    }

    const normalized = this.normalizeResult<Record<string, string>>(response);
    return normalized && typeof normalized === 'object' ? normalized : {};
  }

  /**
   * Set block attributes
   */
  async setBlockAttributes(
    blockId: string,
    attrs: Record<string, string>
  ): Promise<void> {
    const response = await this.client.request('/api/attr/setBlockAttrs', {
      id: blockId,
      attrs,
    });

    if (response.code !== 0) {
      throw new Error(`Failed to set block attrs: ${response.msg}`);
    }
  }

  /**
   * Update one block attribute
   */
  async updateBlockAttribute(
    blockId: string,
    key: string,
    value: string
  ): Promise<void> {
    const attrs = await this.getBlockAttributes(blockId);

    await this.setBlockAttributes(blockId, {
      ...attrs,
      [key]: value,
    });
  }

  /**
   * Apply multiple block operations in a single MCP tool call
   */
  async applyOperations(
    operations: Array<
      | { op: 'insert_before'; target_block_id: string; markdown: string }
      | { op: 'insert_after'; target_block_id: string; markdown: string }
      | { op: 'append'; parent_block_id: string; markdown: string }
      | { op: 'prepend'; parent_block_id: string; markdown: string }
      | { op: 'delete'; block_id: string }
      | { op: 'move'; block_id: string; parent_id?: string; previous_id?: string }
      | { op: 'replace_range'; block_id: string; start: number; end: number; replacement: string }
      | { op: 'set_attr'; block_id: string; key: string; value: string }
    >
  ): Promise<any[]> {
    const results: any[] = [];

    for (const operation of operations) {
      switch (operation.op) {
        case 'insert_before':
          results.push(
            await this.insertBlockBefore(
              operation.target_block_id,
              operation.markdown
            )
          );
          break;

        case 'insert_after':
          results.push(
            await this.insertBlockAfter(
              operation.target_block_id,
              operation.markdown
            )
          );
          break;

        case 'append':
          results.push(
            await this.appendBlock(
              operation.parent_block_id,
              operation.markdown
            )
          );
          break;

        case 'prepend':
          results.push(
            await this.prependBlock(
              operation.parent_block_id,
              operation.markdown
            )
          );
          break;

        case 'delete':
          await this.deleteBlock(operation.block_id);
          results.push({ success: true, block_id: operation.block_id });
          break;

        case 'move':
          await this.moveBlock(
            operation.block_id,
            operation.previous_id,
            operation.parent_id
          );
          results.push({ success: true, block_id: operation.block_id });
          break;

        case 'replace_range':
          results.push(
            await this.replaceRangeInBlock(
              operation.block_id,
              operation.start,
              operation.end,
              operation.replacement
            )
          );
          break;

        case 'set_attr':
          await this.updateBlockAttribute(
            operation.block_id,
            operation.key,
            operation.value
          );
          results.push({
            success: true,
            block_id: operation.block_id,
            key: operation.key,
          });
          break;

        default:
          throw new Error(`Unsupported operation: ${(operation as any).op}`);
      }
    }

    return results;
  }
}