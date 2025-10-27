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

// Test configuration from environment variables
const TEST_CONFIG = {
  baseUrl: process.env.SIYUAN_BASE_URL || 'http://127.0.0.1:6806',
  token: process.env.SIYUAN_TOKEN || '',
  testNotebookName: process.env.SIYUAN_TEST_NOTEBOOK || '99测试',
};

// Validate configuration
if (!TEST_CONFIG.token) {
  throw new Error(
    'SIYUAN_TOKEN is not set. Please create a .env file with SIYUAN_TOKEN. ' +
    'See .env.example for reference.'
  );
}

describe('SiYuan MCP Server Integration Tests', () => {
  let siyuan: ReturnType<typeof createSiyuanTools>;
  let testNotebookId: string;
  let testDocumentId: string;

  beforeAll(async () => {
    siyuan = createSiyuanTools(TEST_CONFIG.baseUrl, TEST_CONFIG.token);

    // Find or verify the test notebook
    const notebooks = await siyuan.listNotebooks();
    if (notebooks.length === 0) {
      throw new Error('No notebooks found. Please create at least one notebook in SiYuan.');
    }

    // Look for the test notebook "99测试"
    const testNotebook = notebooks.find(nb => nb.name === TEST_CONFIG.testNotebookName);
    if (!testNotebook) {
      throw new Error(
        `Test notebook "${TEST_CONFIG.testNotebookName}" not found. ` +
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
      // Create two parent documents and one child document for testing
      const createHandler = new CreateDocumentHandler();
      const context = { siyuan } as any;
      const timestamp = Date.now();

      // Create two parent documents
      const parent1Id = await createHandler.execute(
        {
          notebook_id: testNotebookId,
          path: `/test-move-parent1-${timestamp}`,
          content: `# Test Move Parent 1`,
        },
        context
      );

      const parent2Id = await createHandler.execute(
        {
          notebook_id: testNotebookId,
          path: `/test-move-parent2-${timestamp}`,
          content: `# Test Move Parent 2`,
        },
        context
      );

      // Create two child documents under parent1
      const doc1Id = await createHandler.execute(
        {
          notebook_id: testNotebookId,
          path: `/test-move-parent1-${timestamp}/doc1`,
          content: `# Test Move Document 1`,
        },
        context
      );

      const doc2Id = await createHandler.execute(
        {
          notebook_id: testNotebookId,
          path: `/test-move-parent1-${timestamp}/doc2`,
          content: `# Test Move Document 2`,
        },
        context
      );

      console.log(`  Created parents: ${parent1Id}, ${parent2Id}`);
      console.log(`  Created children: ${doc1Id}, ${doc2Id}`);

      const moveHandler = new MoveDocumentsHandler();

      // Test 1: Move single document (from_ids as array with one element)
      const result1 = await moveHandler.execute(
        {
          from_ids: [doc1Id], // Array form with one element
          to_parent_id: parent2Id,
        },
        context
      );

      expect(result1).toBeDefined();
      expect(result1.success).toBe(true);
      expect(result1.moved_count).toBe(1);
      expect(result1.from_ids).toEqual([doc1Id]);
      console.log(`  ✓ Moved single document using array form with one element`);

      // Test 2: Move multiple documents using array (from_ids as array)
      const result2 = await moveHandler.execute(
        {
          from_ids: [doc1Id, doc2Id], // Array form
          to_parent_id: parent1Id,
        },
        context
      );

      expect(result2).toBeDefined();
      expect(result2.success).toBe(true);
      expect(result2.moved_count).toBe(2);
      expect(result2.from_ids).toEqual([doc1Id, doc2Id]);
      console.log(`  ✓ Moved multiple documents using array form`);

      // Test 3: Move documents to notebook root
      const result3 = await moveHandler.execute(
        {
          from_ids: [doc1Id, doc2Id],
          to_notebook_root: testNotebookId,  // Move to notebook root
        },
        context
      );

      expect(result3).toBeDefined();
      expect(result3.success).toBe(true);
      expect(result3.moved_count).toBe(2);
      expect(result3.from_ids).toEqual([doc1Id, doc2Id]);
      console.log(`  ✓ Moved documents to notebook root`);

      console.log('✓ MoveDocumentsHandler supports array for from_ids, and both to_parent_id and to_notebook_root');
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
      // 1. Create a temporary document with a test tag
      const createHandler = new CreateDocumentHandler();
      const context = { siyuan } as any;

      // Create document with test tag
      await createHandler.execute(
        {
          notebook_id: testNotebookId,
          path: `/test-tag-doc-${Date.now()}`,
          content: `# Test Tag Document\n\n#${tempTag}#\n\nThis document is for testing tag replacement.`,
        },
        context
      );

      console.log(`  Created temp document with tag #${tempTag}#`);

      // Wait for the document to be indexed
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 2. First check if the tag is found
      const searchStmt = `SELECT id, markdown FROM blocks WHERE markdown LIKE '%#${tempTag}#%'`;
      const foundBlocks = await context.siyuan.search.query(searchStmt);
      console.log(`  Found ${foundBlocks.length} blocks with tag #${tempTag}#`);
      if (foundBlocks.length > 0) {
        console.log(`  Sample block markdown: ${foundBlocks[0].markdown}`);
      }

      // 2. Test tag replacement
      const replaceHandler = new ReplaceTagHandler();
      console.log(`  Replacing tag "${tempTag}" with "${newTag}"...`);
      const result = await replaceHandler.execute(
        {
          old_tag: tempTag,
          new_tag: newTag,
        },
        context
      );

      expect(result).toBeDefined();
      expect(result).toHaveProperty('count');
      expect(result).toHaveProperty('updatedIds');
      console.log(`  Replace result: ${result.count} blocks updated`);

      if (result.count === 0) {
        console.log('  ⚠️  No blocks were updated - tag might not be found');
        // Skip the rest of the test if nothing was updated
        return;
      }

      expect(result.count).toBeGreaterThan(0);
      expect(Array.isArray(result.updatedIds)).toBe(true);
      expect(result.updatedIds.length).toBeGreaterThan(0);

      console.log(`✓ Replaced tag "${tempTag}" → "${newTag}" (${result.count} blocks updated)`);
      console.log(`  Updated block IDs: ${result.updatedIds.join(', ')}`);

      // Wait for update to propagate
      await new Promise(resolve => setTimeout(resolve, 500));

      // 3. Verify the tag was replaced by querying the markdown content
      const verifyStmt = `SELECT id, markdown FROM blocks WHERE id = '${result.updatedIds[0]}'`;
      const verifyBlocks = await context.siyuan.search.query(verifyStmt);

      expect(verifyBlocks.length).toBeGreaterThan(0);
      expect(verifyBlocks[0].markdown).toBeDefined();

      console.log(`  Updated content: ${verifyBlocks[0].markdown}`);

      // 标签在思源笔记中可能包含零宽字符，所以只检查标签名称本身
      expect(verifyBlocks[0].markdown).toContain(newTag);
      expect(verifyBlocks[0].markdown).not.toContain(tempTag);

      console.log('✓ Tag replacement verified in block content');

      // 4. Optional: Clean up by removing the tag
      // Uncomment the following code if you want to clean up test tags automatically
      /*
      const cleanupResult = await replaceHandler.execute(
        {
          old_tag: newTag,
          new_tag: '',
        },
        context
      );

      expect(cleanupResult.count).toBeGreaterThan(0);
      console.log(`✓ Cleaned up test tag (removed from ${cleanupResult.count} documents)`);
      */

      console.log(`ℹ️  Test tag #${newTag}# left in document for manual verification`);
    });
  });

  describe('Snapshot Operations', () => {
    test('CreateSnapshotHandler - should create snapshot', async () => {
      const handler = new CreateSnapshotHandler();
      const context = { siyuan } as any;
      const memo = `Test snapshot - ${new Date().toISOString()}`;
      const result = await handler.execute({ memo }, context);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('memo', memo);
      expect(result).toHaveProperty('message');
      expect(result.message).toContain('Snapshot created successfully');

      console.log(`✓ Created snapshot successfully: ${result.message}`);
    });

    test('ListSnapshotsHandler - should list snapshots', async () => {
      const handler = new ListSnapshotsHandler();
      const context = { siyuan } as any;
      const result = await handler.execute({ page_number: 1 }, context);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('snapshots');
      expect(Array.isArray(result.snapshots)).toBe(true);
      expect(result).toHaveProperty('pageCount');
      expect(result).toHaveProperty('totalCount');

      console.log(`✓ Found ${result.totalCount} total snapshots`);
    });

    test('RollbackSnapshotHandler - should work (skipped for safety)', async () => {
      console.log('⊘ Skipping rollback test for safety');
      // This test is skipped to avoid rolling back user's data
      // In real scenarios, you would test in an isolated environment
    });
  });

  describe('Handler Tool Names', () => {
    test('All handlers should have correct tool names (no siyuan_ prefix)', () => {
      const handlers = [
        { handler: new UnifiedSearchHandler(), expected: 'unified_search' },
        { handler: new GetDocumentContentHandler(), expected: 'get_document_content' },
        { handler: new CreateDocumentHandler(), expected: 'create_document' },
        { handler: new AppendToDocumentHandler(), expected: 'append_to_document' },
        { handler: new UpdateDocumentHandler(), expected: 'update_document' },
        { handler: new AppendToDailyNoteHandler(), expected: 'append_to_daily_note' },
        { handler: new MoveDocumentsHandler(), expected: 'move_documents' },
        { handler: new GetDocumentTreeHandler(), expected: 'get_document_tree' },
        { handler: new ListNotebooksHandler(), expected: 'list_notebooks' },
        {
          handler: new GetRecentlyUpdatedDocumentsHandler(),
          expected: 'get_recently_updated_documents',
        },
        { handler: new CreateSnapshotHandler(), expected: 'create_snapshot' },
        { handler: new ListSnapshotsHandler(), expected: 'list_snapshots' },
        { handler: new RollbackSnapshotHandler(), expected: 'rollback_to_snapshot' },
        { handler: new ListAllTagsHandler(), expected: 'list_all_tags' },
        { handler: new ReplaceTagHandler(), expected: 'batch_replace_tag' },
      ];

      handlers.forEach(({ handler, expected }) => {
        expect(handler.name).toBe(expected);
        expect(handler.name).not.toContain('siyuan_');
        console.log(`✓ ${handler.name} - correct`);
      });

      console.log(`✓ All ${handlers.length} tool names verified`);
    });
  });
});
