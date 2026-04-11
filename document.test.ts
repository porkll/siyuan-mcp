import { jest } from '@jest/globals';
import {
  AppendBlockIfMissingHandler,
  SearchBlocksScopedHandler,
  GetDocumentOutlineHandler,
  UpsertSectionByHeadingHandler,
} from './mcp-server/handlers/document.js';
import { makeContext } from './test-utils.js';

describe('AppendBlockIfMissingHandler', () => {
  it('creates a new block when missing', async () => {
    const handler = new AppendBlockIfMissingHandler();

    const appendBlock = jest.fn(async () => 'new-block-1');

    const blockApi = {
      getBlock: async (_blockId: string) => ({ id: 'parent-1' }),
      getChildBlocks: async (_blockId: string) => [],
      appendBlock,
    } as any;

    const context = makeContext({
      siyuan: {
        block: blockApi,
      } as any,
    });

    await expect(
      handler.execute({ parent_id: 'parent-1', content: 'Hello world' }, context)
    ).resolves.toEqual({
      success: true,
      created: true,
      block_id: 'new-block-1',
      message: 'Block appended',
    });
  });

  it('returns ALREADY_EXISTS when a matching child already exists', async () => {
    const handler = new AppendBlockIfMissingHandler();

    const appendBlock = jest.fn(async () => 'should-not-run');

    const blockApi = {
      getBlock: async (_blockId: string) => ({ id: 'parent-1' }),
      getChildBlocks: async (_blockId: string) => [
        { id: 'child-1', content: 'Hello world' },
      ],
      appendBlock,
    } as any;

    const context = makeContext({
      siyuan: {
        block: blockApi,
      } as any,
    });

    await expect(
      handler.execute({ parent_id: 'parent-1', content: 'Hello world' }, context)
    ).resolves.toEqual({
      success: true,
      created: false,
      block_id: 'child-1',
      message: 'Matching child block already exists',
      error_code: 'ALREADY_EXISTS',
    });

    expect(appendBlock).not.toHaveBeenCalled();
  });

  it('supports dry_run without mutating content', async () => {
    const handler = new AppendBlockIfMissingHandler();

    const appendBlock = jest.fn(async () => 'should-not-run');

    const blockApi = {
      getBlock: async (_blockId: string) => ({ id: 'parent-1' }),
      getChildBlocks: async (_blockId: string) => [],
      appendBlock,
    } as any;

    const context = makeContext({
      siyuan: {
        block: blockApi,
      } as any,
    });

    await expect(
      handler.execute(
        { parent_id: 'parent-1', content: 'Hello world', dry_run: true },
        context
      )
    ).resolves.toEqual({
      success: true,
      created: false,
      message: 'No matching child block found; append would create a new block',
    });

    expect(appendBlock).not.toHaveBeenCalled();
  });
});

describe('SearchBlocksScopedHandler', () => {
  it('falls back to global search when no scope is provided', async () => {
    const handler = new SearchBlocksScopedHandler();

    const blockApi = {
      searchBlocks: async (_query: string, _limit?: number) => [
        {
          block_id: 'b1',
          parent_id: 'p1',
          root_id: 'r1',
          hpath: '/doc',
          snippet: 'Token Efficiency Summary',
        },
      ],
    } as any;

    const context = makeContext({
      siyuan: {
        block: blockApi,
      } as any,
    });

    const result = await handler.execute(
      { query: 'Token Efficiency Summary', limit: 5 },
      context
    );

    expect(result.success).toBe(true);
    expect(result.scope_used).toBe('global');
    expect(result.count).toBe(1);
    expect(result.items[0]).toEqual({
      id: 'b1',
      content_snippet: 'Token Efficiency Summary',
      parent_id: 'p1',
      path: '/doc',
    });
  });

  it('narrows results using direct metadata checks', async () => {
    const handler = new SearchBlocksScopedHandler();

    const blockApi = {
      searchBlocks: async (_query: string, _limit?: number) => [
        {
          block_id: 'b1',
          parent_id: 'scope-1',
          root_id: 'r1',
          hpath: '/doc/a',
          snippet: 'Key Findings',
        },
        {
          block_id: 'b2',
          parent_id: 'other',
          root_id: 'r2',
          hpath: '/doc/b',
          snippet: 'Key Findings',
        },
      ],
      getBlockContext: async (_blockId: string) => ({ parents: [] }),
    } as any;

    const context = makeContext({
      siyuan: {
        block: blockApi,
      } as any,
    });

    const result = await handler.execute(
      { query: 'Key Findings', parent_id: 'scope-1', limit: 5 },
      context
    );

    expect(result.success).toBe(true);
    expect(result.scope_used).toBe('subtree');
    expect(result.count).toBe(1);
    expect(result.items[0].id).toBe('b1');
  });

  it('narrows results using ancestor context when metadata is insufficient', async () => {
    const handler = new SearchBlocksScopedHandler();

    const blockApi = {
      searchBlocks: async (_query: string, _limit?: number) => [
        {
          block_id: 'b1',
          parent_id: 'other-parent',
          root_id: 'other-root',
          hpath: '/doc/a',
          snippet: 'Nested Match',
        },
      ],
      getBlockContext: async (_blockId: string) => ({
        parents: [{ id: 'scope-1' }, { id: 'root-1' }],
      }),
    } as any;

    const context = makeContext({
      siyuan: {
        block: blockApi,
      } as any,
    });

    const result = await handler.execute(
      { query: 'Nested Match', root_id: 'scope-1', limit: 5 },
      context
    );

    expect(result.success).toBe(true);
    expect(result.scope_used).toBe('subtree');
    expect(result.count).toBe(1);
    expect(result.items[0].id).toBe('b1');
  });
});

describe('GetDocumentOutlineHandler', () => {
  it('extracts markdown headings from a document', async () => {
    const handler = new GetDocumentOutlineHandler();

    const siyuanApi = {
      getFileContent: async (_documentId: string) =>
        ['# Top', 'intro', '## Details', '### Deep', 'text'].join('\n'),
    } as any;

    const context = makeContext({
      siyuan: siyuanApi,
    });

    const result = await handler.execute(
      { document_id: 'doc-1', max_headings: 10, max_depth: 3 },
      context
    );

    expect(result.success).toBe(true);
    expect(result.count).toBe(3);
    expect(result.items.map((x: any) => ({ text: x.text, level: x.level }))).toEqual([
      { text: 'Top', level: 1 },
      { text: 'Details', level: 2 },
      { text: 'Deep', level: 3 },
    ]);
  });
});

describe('UpsertSectionByHeadingHandler', () => {
  it('reuses an existing heading section and avoids duplicate append', async () => {
    const handler = new UpsertSectionByHeadingHandler();

    const appendBlock = jest.fn(async () => 'should-not-run');

    const blockApi = {
      getBlock: async (_blockId: string) => ({ id: 'root-1', content: '# Root' }),
      findHeadingInTree: async (
        _blockId: string,
        _headingQuery: string,
        _depth?: number
      ) => [{ id: 'heading-1', content: '## Daily Log' }],
      getChildBlocks: async (_blockId: string) => [
        { id: 'child-1', content: 'Already there' },
      ],
      appendBlock,
    } as any;

    const context = makeContext({
      siyuan: {
        block: blockApi,
      } as any,
    });

    const result = await handler.execute(
      {
        block_id: 'root-1',
        heading: 'Daily Log',
        content: 'Already there',
        create_if_missing: true,
        append_if_missing: true,
        exact_match: true,
      },
      context
    );

    expect(result.success).toBe(true);
    expect(result.heading_block_id).toBe('heading-1');
    expect(result.created_heading).toBe(false);
    expect(result.created_block).toBe(false);
    expect(appendBlock).not.toHaveBeenCalled();
  });
});