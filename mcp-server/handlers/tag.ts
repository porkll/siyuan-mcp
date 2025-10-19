/**
 * 标签相关工具处理器
 */

import { BaseToolHandler } from './base.js';
import type { ExecutionContext, JSONSchema } from '../core/types.js';

/**
 * 列出所有标签
 */
export class ListAllTagsHandler extends BaseToolHandler<Record<string, never>, string[]> {
  readonly name = 'list_all_tags';
  readonly description = 'List all unique document tags used in SiYuan workspace';
  readonly inputSchema: JSONSchema = {
    type: 'object',
    properties: {},
  };

  async execute(_args: any, context: ExecutionContext): Promise<string[]> {
    return await context.siyuan.search.listAllTags();
  }
}

/**
 * 根据标签查找文档
 */
export class SearchByTagHandler extends BaseToolHandler<
  { tag: string; limit?: number },
  any[]
> {
  readonly name = 'siyuan_search_by_tag';
  readonly description = 'Find documents by tag (returns documents that have the specified tag)';
  readonly inputSchema: JSONSchema = {
    type: 'object',
    properties: {
      tag: {
        type: 'string',
        description: 'Tag name to search for (without # symbol, e.g., "项目" not "#项目#")',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (default: 50)',
      },
    },
    required: ['tag'],
  };

  async execute(args: any, context: ExecutionContext): Promise<any[]> {
    const tag = args.tag;
    const limit = args.limit || 50;
    return await context.siyuan.search.searchByTag(tag, limit);
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
    'Batch replace all occurrences of a tag with another tag across all documents. Use empty string for new_tag to remove the tag.';
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
    return await context.siyuan.tag.replaceTag(oldTag, newTag);
  }
}
