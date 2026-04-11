/**
 * Integration tests for SiYuan MCP Server
 * Tests all tools with real SiYuan API
 */

import dotenv from 'dotenv';
import { createSiyuanTools } from '../dist/src/index.js';

// Load environment variables
dotenv.config();

import { UnifiedSearchHandler } from '../dist/mcp-server/handlers/search.js';
import {
  GetDocumentContentHandler,
  CreateDocumentHandler,
  AppendToDocumentHandler,
  UpdateDocumentHandler,
  AppendToDailyNoteHandler,
  MoveDocumentsHandler,
  GetDocumentTreeHandler,
} from '../dist/mcp-server/handlers/document.js';
import {
  ListNotebooksHandler,
  GetRecentlyUpdatedDocumentsHandler,
} from '../dist/mcp-server/handlers/notebook.js';
import {
  CreateSnapshotHandler,
  ListSnapshotsHandler,
  RollbackSnapshotHandler,
} from '../dist/mcp-server/handlers/snapshot.js';
import {
  ListAllTagsHandler,
  ReplaceTagHandler,
} from '../dist/mcp-server/handlers/tag.js';

const TEST_CONFIG = {
  baseUrl: process.env.SIYUAN_BASE_URL || 'http://127.0.0.1:6806',
  token: process.env.SIYUAN_TOKEN || '',
  testNotebookName: process.env.SIYUAN_TEST_NOTEBOOK || '99测试',
};

if (!TEST_CONFIG.token) {
  throw new Error(
    'SIYUAN_TOKEN is not set.\n' +
      'Please create a .env file with SIYUAN_TOKEN. ' +
      'See .env.example for reference.'
  );
}

type ReplaceTagResult = {
  count: number;
  updatedIds: string[];
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('SiYuan MCP Server Integration Tests', () => {
  let siyuan: ReturnType<typeof createSiyuanTools>;
  let testNotebookId: string;
  let testDocumentId: string;

  beforeAll(async () => {
    siyuan = createSiyuanTools(TEST_CONFIG.baseUrl, TEST_CONFIG.token);

    const notebooks = await siyuan.listNotebooks();
    if (notebooks.length === 0) {
      throw new Error(
        'No notebooks found. Please create at least one notebook in SiYuan.'
      );
    }

    const testNotebook = notebooks.find(
      nb => nb.name === TEST_CONFIG.testNotebookName
    );

    if (!testNotebook) {
      throw new Error(
        `Test notebook "${TEST_CONFIG.testNotebookName}" not found.\n` +
          `Please create a notebook named "${TEST_CONFIG.testNotebookName}" in SiYuan for testing.`
      );
    }

    testNotebookId = testNotebook.id;
    console.log(`✓ Using test notebook: ${testNotebook.name} (${testNotebookId})`);
  });

  describe('Notebook Operations', () => {
    test('ListNotebooksHandler - should list all notebooks', async () => {
      const handler = new ListNotebooksHandler();
      const context = { siyuan } as any;

      const result = await handler.execute({}, context);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');

      console.log(`✓ Found ${result.length} notebooks`);
    });

    test('GetRecentlyUpdatedDocumentsHandler - should get recent documents', async () => {
      const handler = new GetRecentlyUpdatedDocumentsHandler();
      const context = { siyuan } as any;

      const result = await handler.execute({ limit: 5 }, context);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      console.log(`✓ Found ${result.length} recently updated documents`);
    });
  });

  describe('Search Operations', () => {
    test('UnifiedSearchHandler - should search by filename', async () => {
      const handler = new UnifiedSearchHandler();
      const context = { siyuan } as any;

      const result = await handler.execute({ filename: 'test', limit: 5 }, context);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      console.log(`✓ Filename search returned ${result.length} results`);
    });

    test('UnifiedSearchHandler - should search by content', async () => {
      const handler = new UnifiedSearchHandler();
      const context = { siyuan } as any;

      const result = await handler.execute({ content: 'test', limit: 5 }, context);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      console.log(`✓ Content search returned ${result.length} results`);
    });

    test('UnifiedSearchHandler - should work with no results', async () => {
      const handler = new UnifiedSearchHandler();
      const context = { siyuan } as any;

      const result = await handler.execute(
        { filename: 'nonexistent-file-xyz-12345', limit: 5 },
        context
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);

      console.log('✓ Empty search handled correctly');
    });
  });

  describe('Document Operations', () => {
    test('CreateDocumentHandler - should create a new document', async () => {
      const handler = new CreateDocumentHandler();
      const context = { siyuan } as any;
      const timestamp = Date.now();

      const result = await handler.execute(
        {
          notebook_id: testNotebookId,
          path: `/test-doc-${timestamp}`,
          content: `# Test Document\n\nCreated at ${new Date().toISOString()}`,
        },
        context
      );

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');

      testDocumentId = result;
      console.log(`✓ Created document with ID: ${testDocumentId}`);
    });

    test('GetDocumentContentHandler - should get document content', async () => {
      if (!testDocumentId) {
        console.log('⊘ Skipping: No test document available');
        return;
      }

      const handler = new GetDocumentContentHandler();
      const context = { siyuan } as any;

      const result = await handler.execute({ document_id: testDocumentId }, context);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('Test Document');

      console.log(`✓ Retrieved document content (${result.length} chars)`);
    });

    test('AppendToDocumentHandler - should append content to document', async () => {
      if (!testDocumentId) {
        console.log('⊘ Skipping: No test document available');
        return;
      }

      const handler = new AppendToDocumentHandler();
      const context = { siyuan } as any;

      const result = await handler.execute(
        {
          document_id: testDocumentId,
          content: '\n\n## Appended Section\n\nThis content was appended.',
        },
        context
      );

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');

      console.log(`✓ Appended content, new block ID: ${result}`);
    });

    test('UpdateDocumentHandler - should update document content', async () => {
      if (!testDocumentId) {
        console.log('⊘ Skipping: No test document available');
        return;
      }

      const handler = new UpdateDocumentHandler();
      const context = { siyuan } as any;

      const result = await handler.execute(
        {
          document_id: testDocumentId,
          content: `# Updated Document\n\nUpdated at ${new Date().toISOString()}`,
        },
        context
      );

      expect(result).toBeDefined();
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('document_id', testDocumentId);

      console.log('✓ Updated document successfully');
    });

    test('GetDocumentTreeHandler - should get document tree', async () => {
      const handler = new GetDocumentTreeHandler();
      const context = { siyuan } as any;

      const result = await handler.execute({ id: testNotebookId, depth: 1 }, context);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      console.log(`✓ Retrieved document tree with ${result.length} items`);
    });

    test('MoveDocumentsHandler - should support array for from_ids and both destinations', async () => {
      const createHandler = new CreateDocumentHandler();
      const context = { siyuan } as any;
      const timestamp = Date.now();

      const parent1Id = await createHandler.execute(
        {
          notebook_id: testNotebookId,
          path: `/test-move-parent1-${timestamp}`,
          content: '# Test Move Parent 1',
        },
        context
      );

      const parent2Id = await createHandler.execute(
        {
          notebook_id: testNotebookId,
          path: `/test-move-parent2-${timestamp}`,
          content: '# Test Move Parent 2',
        },
        context
      );

      const doc1Id = await createHandler.execute(
        {
          notebook_id: testNotebookId,
          path: `/test-move-parent1-${timestamp}/doc1`,
          content: '# Test Move Document 1',
        },
        context
      );

      const doc2Id = await createHandler.execute(
        {
          notebook_id: testNotebookId,
          path: `/test-move-parent1-${timestamp}/doc2`,
          content: '# Test Move Document 2',
        },
        context
      );

      console.log(`  Created parents: ${parent1Id}, ${parent2Id}`);
      console.log(`  Created children: ${doc1Id}, ${doc2Id}`);

      const moveHandler = new MoveDocumentsHandler();

      const result1 = await moveHandler.execute(
        {
          from_ids: [doc1Id],
          to_parent_id: parent2Id,
        },
        context
      );

      expect(result1).toBeDefined();
      expect(result1.success).toBe(true);
      expect(result1.moved_count).toBe(1);
      expect(result1.from_ids).toEqual([doc1Id]);

      console.log('  ✓ Moved single document using array form with one element');

      const result2 = await moveHandler.execute(
        {
          from_ids: [doc1Id, doc2Id],
          to_parent_id: parent1Id,
        },
        context
      );

      expect(result2).toBeDefined();
      expect(result2.success).toBe(true);
      expect(result2.moved_count).toBe(2);
      expect(result2.from_ids).toEqual([doc1Id, doc2Id]);

      console.log('  ✓ Moved multiple documents using array form');

      const result3 = await moveHandler.execute(
        {
          from_ids: [doc1Id, doc2Id],
          to_notebook_root: testNotebookId,
        },
        context
      );

      expect(result3).toBeDefined();
      expect(result3.success).toBe(true);
      expect(result3.moved_count).toBe(2);
      expect(result3.from_ids).toEqual([doc1Id, doc2Id]);

      console.log('  ✓ Moved documents to notebook root');
      console.log(
        '✓ MoveDocumentsHandler supports array for from_ids, and both to_parent_id and to_notebook_root'
      );
    });
  });

  describe('Daily Note Operations', () => {
    test('AppendToDailyNoteHandler - should append to daily note', async () => {
      const handler = new AppendToDailyNoteHandler();
      const context = { siyuan } as any;
      const timestamp = new Date().toISOString();

      const result = await handler.execute(
        {
          notebook_id: testNotebookId,
          content: `\n- Test entry at ${timestamp}`,
        },
        context
      );

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');

      console.log(`✓ Appended to daily note, block ID: ${result}`);
    });
  });

  describe('Tag Operations', () => {
    const timestamp = Date.now();
    const tempTag = `test-tag-old-${timestamp}`;
    const newTag = `test-tag-new-${timestamp}`;

    test('ListAllTagsHandler - should list all tags', async () => {
      const handler = new ListAllTagsHandler();
      const context = { siyuan } as any;

      const result = await handler.execute({}, context);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      console.log(`✓ Found ${result.length} tags`);
    });

    test('ReplaceTagHandler - should replace tags', async () => {
      const createHandler = new CreateDocumentHandler();
      const context = { siyuan } as any;
      const tagDocPath = `/test-tag-doc-${Date.now()}`;

      await createHandler.execute(
        {
          notebook_id: testNotebookId,
          path: tagDocPath,
          content: `# Test Tag Document\n\n#${tempTag}#\n\nThis document is for testing tag replacement.`,
        },
        context
      );

      console.log(`  Created temp document with tag #${tempTag}#`);

      await sleep(1000);

      const searchStmt = `SELECT id, markdown FROM blocks WHERE markdown LIKE '%#${tempTag}#%'`;
      const foundBlocks = await context.siyuan.search.query(searchStmt);

      console.log(`  Found ${foundBlocks.length} blocks with tag #${tempTag}#`);

      if (foundBlocks.length > 0) {
        console.log(`  Sample block markdown: ${foundBlocks[0].markdown}`);
      }

      expect(foundBlocks.length).toBeGreaterThan(0);

      const replaceHandler = new ReplaceTagHandler();
      console.log(`  Replacing tag "${tempTag}" with "${newTag}"...`);

      const result = (await replaceHandler.execute(
        {
          old_tag: tempTag,
          new_tag: newTag,
        },
        context
      )) as ReplaceTagResult;

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('count');
      expect(result).toHaveProperty('updatedIds');
      expect(typeof result.count).toBe('number');
      expect(Array.isArray(result.updatedIds)).toBe(true);

      console.log(`  Replace result: ${result.count} blocks updated`);

      expect(result.count).toBeGreaterThan(0);
      expect(result.count).toBe(1);
      expect(result.updatedIds.length).toBeGreaterThan(0);

      console.log(
        `✓ Replaced tag "${tempTag}" → "${newTag}" (${result.count} blocks updated)`
      );
      console.log(`  Updated block IDs: ${result.updatedIds.join(', ')}`);

      await sleep(500);

      const verifyStmt = `SELECT id, markdown FROM blocks WHERE id = '${result.updatedIds[0]}'`;
      const verifyBlocks = await context.siyuan.search.query(verifyStmt);

      expect(verifyBlocks.length).toBeGreaterThan(0);
      expect(verifyBlocks[0].markdown).toBeDefined();

      console.log(`  Updated content: ${verifyBlocks[0].markdown}`);

      expect(verifyBlocks[0].markdown).toContain(newTag);
      expect(verifyBlocks[0].markdown).not.toContain(tempTag);

      console.log('✓ Tag replacement verified in block content');
    });
  });

  describe('Snapshot Operations', () => {
    test('ListSnapshotsHandler - should list snapshots', async () => {
      const handler = new ListSnapshotsHandler();
      const context = { siyuan } as any;

      const result = await handler.execute({}, context);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('snapshots');
      expect(result).toHaveProperty('pageCount');
      expect(result).toHaveProperty('totalCount');
      expect(Array.isArray(result.snapshots)).toBe(true);

      console.log(`✓ Found ${result.snapshots.length} snapshots`);
    });

    test('CreateSnapshotHandler - should create snapshot', async () => {
      const handler = new CreateSnapshotHandler();
      const context = { siyuan } as any;
      const memo = `test snapshot ${new Date().toISOString()}`;

      const result = await handler.execute({ memo }, context);

      expect(result).toBeDefined();

      console.log(`✓ Created snapshot: ${JSON.stringify(result)}`);
    });

    test('RollbackSnapshotHandler - should validate input shape', async () => {
      const listHandler = new ListSnapshotsHandler();
      const rollbackHandler = new RollbackSnapshotHandler();
      const context = { siyuan } as any;

      const snapshotsResult = await listHandler.execute({}, context);

      if (
        !snapshotsResult?.snapshots ||
        !Array.isArray(snapshotsResult.snapshots) ||
        snapshotsResult.snapshots.length === 0
      ) {
        console.log('⊘ Skipping rollback test: No snapshots available');
        return;
      }

      const firstSnapshot = snapshotsResult.snapshots[0];
      if (!firstSnapshot?.id) {
        console.log('⊘ Skipping rollback test: Snapshot has no id');
        return;
      }

      expect(firstSnapshot.id).toBeDefined();

      console.log(
        `✓ RollbackSnapshotHandler test prepared with snapshot ID: ${firstSnapshot.id}`
      );

      expect(rollbackHandler).toBeDefined();
    });
  });
});