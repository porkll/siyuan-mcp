/**
 * 标签相关工具处理器
 */

import { BaseToolHandler } from './base.js';
import type { ExecutionContext, JSONSchema } from '../core/types.js';

/**
 * 列出所有标签
 */
export class ListAllTagsHandler extends BaseToolHandler<
  { prefix?: string; depth?: number },
  Array<{ label: string; document_count: number }>
> {
  readonly name = 'list_all_tags';
  readonly description =
    'List all tags used across your SiYuan notes with usage counts. Useful for discovering how you organize your knowledge. Supports filtering by prefix and limiting by hierarchy depth';
  readonly inputSchema: JSONSchema = {
    type: 'object',
    properties: {
      prefix: {
        type: 'string',
        description:
          'Optional: Filter tags by prefix. Only tags starting with this prefix will be returned (e.g., "project" will match "project", "project/frontend", etc.)',
      },
      depth: {
        type: 'number',
        description:
          'Optional: Limit tag hierarchy depth (starts from 1). For example, depth=1 returns only top-level tags (e.g., "project"), depth=2 includes second level (e.g., "project/frontend"). Tags are split by "/" separator.',
      },
    },
  };

  async execute(args: any, context: ExecutionContext): Promise<Array<{ label: string; document_count: number }>> {
    return await context.siyuan.search.listAllTags(args.prefix, args.depth);
  }
}

/**
 * 替换标签
 */
export class ReplaceTagHandler extends BaseToolHandler<
  { old_tag: string; new_tag: string },
  { count: number; updatedIds: string[] }
> {
  readonly name = 'batch_replace_tag';
  readonly description =
    'Rename or remove a tag across all notes in SiYuan. Useful for reorganizing your knowledge base tags. Use empty string for new_tag to remove the tag entirely';

  readonly inputSchema: JSONSchema = {
    type: 'object',
    properties: {
      old_tag: {
        type: 'string',
        description: 'Old tag name to replace (without # symbol, e.g., "old-tag")',
      },
      new_tag: {
        type: 'string',
        description:
          'New tag name to replace with (without # symbol, e.g., "new-tag"). Use empty string to remove the tag.',
      },
    },
    required: ['old_tag', 'new_tag'],
  };

  async execute(
    args: any,
    context: ExecutionContext
  ): Promise<{ count: number; updatedIds: string[] }> {
    const oldTag = args.old_tag;
    const newTag = args.new_tag || '';

    const escapeSql = (value: string): string => value.replace(/'/g, "''");

    const oldTagEscaped = escapeSql(oldTag);
    const newTagEscaped = escapeSql(newTag);

    const oldTagPattern = `%#${oldTagEscaped}#%`;
    const newTagPattern = `%#${newTagEscaped}#%`;

    const beforeStmt = `SELECT id FROM blocks WHERE markdown LIKE '${oldTagPattern}'`;
    const beforeRows = await context.siyuan.search.query(beforeStmt);

    const beforeIds = Array.isArray(beforeRows)
      ? beforeRows
          .map((row: any) => row?.id)
          .filter((id: unknown): id is string => typeof id === 'string' && id.length > 0)
      : [];

    const ok = await context.siyuan.tag.replaceTag(oldTag, newTag);

    if (!ok) {
      return {
        count: 0,
        updatedIds: [],
      };
    }

    if (newTag === '') {
      if (beforeIds.length === 0) {
        return {
          count: 0,
          updatedIds: [],
        };
      }

      const verifyRemovedStmt = `SELECT id FROM blocks WHERE id IN (${beforeIds
        .map(id => `'${escapeSql(id)}'`)
        .join(', ')}) AND markdown LIKE '${oldTagPattern}'`;

      const stillOldRows = await context.siyuan.search.query(verifyRemovedStmt);

      const stillOldIds = new Set(
        (Array.isArray(stillOldRows) ? stillOldRows : [])
          .map((row: any) => row?.id)
          .filter((id: unknown): id is string => typeof id === 'string' && id.length > 0)
      );

      const updatedIds = beforeIds.filter(id => !stillOldIds.has(id));

      return {
        count: updatedIds.length,
        updatedIds,
      };
    }

    const afterStmt = `SELECT id FROM blocks WHERE markdown LIKE '${newTagPattern}'`;
    const afterRows = await context.siyuan.search.query(afterStmt);

    const afterIds = new Set(
      (Array.isArray(afterRows) ? afterRows : [])
        .map((row: any) => row?.id)
        .filter((id: unknown): id is string => typeof id === 'string' && id.length > 0)
    );

    const updatedIds = beforeIds.filter(id => afterIds.has(id));

    return {
      count: updatedIds.length,
      updatedIds,
    };
  }
}