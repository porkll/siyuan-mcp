/**
 * 搜索相关工具处理器
 */
import { BaseToolHandler } from './base.js';
import type { ExecutionContext, JSONSchema } from '../core/types.js';
import type { SearchResultResponse } from '../../src/types/index.js';

/**
 * 统一搜索工具：支持内容、标签、文件名等多种条件
 */
export class UnifiedSearchHandler extends BaseToolHandler<
  {
    content?: string;
    tag?: string;
    filename?: string;
    limit?: number;
    notebook_id?: string;
    types?: string[];
  },
  SearchResultResponse[]
> {
  readonly name = 'unified_search';

  readonly description =
    'Search notes and blocks in SiYuan by content, tag, filename, or combined filters. ' +
    'Use when the target note or block is not yet known. ' +
    'Prefer scoped block or tree tools when a parent document or subtree is already known. ' +
    'Returns broad discovery results rather than localized editing context.';

  readonly inputSchema: JSONSchema = {
    type: 'object',
    properties: {
      content: {
        type: 'string',
        description:
          'Content keyword for broad discovery. Use when the target note or block is not yet known.',
      },
      tag: {
        type: 'string',
        description:
          'Tag filter without the leading # symbol. Use to narrow discovery by tag.',
      },
      filename: {
        type: 'string',
        description:
          'Note title or filename keyword. Prefer this when identifying a document by name.',
      },
      limit: {
        type: 'number',
        description:
          'Maximum number of results to return. Keep small for lower token usage. Default: 10.',
        default: 10,
      },
      notebook_id: {
        type: 'string',
        description:
          'Restrict broad discovery to a single notebook.',
      },
      types: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Optional SiYuan block types to include in the search results.',
      },
    },
  };

  validate(args: any): args is {
    content?: string;
    tag?: string;
    filename?: string;
    limit?: number;
    notebook_id?: string;
    types?: string[];
  } {
    super.validate(args);
    this.requireOneOf(args, ['content', 'tag', 'filename']);
    if (args.limit !== undefined) {
      this.getNumberInRange(args.limit, 'limit', { min: 1, max: 100 });
    }
    return true;
  }

  async execute(
    args: {
      content?: string;
      tag?: string;
      filename?: string;
      limit?: number;
      notebook_id?: string;
      types?: string[];
    },
    context: ExecutionContext
  ): Promise<SearchResultResponse[]> {
    return await context.siyuan.search.search({
      content: args.content,
      tag: args.tag,
      filename: args.filename,
      limit: args.limit ?? 10,
      notebook: args.notebook_id,
      types: args.types,
    });
  }
}