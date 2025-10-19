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
