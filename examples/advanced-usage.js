/**
 * 高级使用示例
 * 展示更复杂的 API 组合使用
 */

import { createSiyuanTools } from '../dist/index.js';

const API_TOKEN = '9vtvpbfnlsh7dcz8';
const BASE_URL = 'http://127.0.0.1:6806';

async function advancedDemo() {
  const siyuan = createSiyuanTools(BASE_URL, API_TOKEN);

  // 1. 使用自定义 SQL 查询
  console.log('📊 使用自定义 SQL 查询最近更新的文档:');
  const recentDocs = await siyuan.search.query(`
    SELECT * FROM blocks
    WHERE type='d'
    ORDER BY updated DESC
    LIMIT 5
  `);

  recentDocs.forEach(doc => {
    console.log(`  - ${doc.content}`);
  });
  console.log();

  // 2. 获取笔记本配置
  console.log('⚙️  获取笔记本配置:');
  const notebooks = await siyuan.listNotebooks();
  const notebookId = notebooks[0].id;
  const config = await siyuan.notebook.getNotebookConf(notebookId);
  console.log(`  笔记本名称: ${config.name}`);
  console.log(`  今日笔记路径: ${config.dailyNoteSavePath}`);
  console.log();

  // 3. 创建文档并在不同位置插入内容
  console.log('📝 创建文档并插入多个块:');
  const docId = await siyuan.createFile(
    notebookId,
    '/API测试/高级示例',
    '# 高级示例文档\n\n初始内容'
  );
  console.log(`  创建文档: ${docId}`);

  // 追加多个块
  const block1 = await siyuan.block.appendBlock(docId, '## 第一部分\n\n内容 1');
  const block2 = await siyuan.block.appendBlock(docId, '## 第二部分\n\n内容 2');
  const block3 = await siyuan.block.appendBlock(docId, '## 第三部分\n\n内容 3');
  console.log(`  创建了 3 个子块`);
  console.log();

  // 4. 搜索特定笔记本的内容
  console.log('🔍 在特定笔记本中搜索:');
  const searchResults = await siyuan.search.searchByContent('高级', {
    limit: 5,
    notebook: notebookId
  });
  console.log(`  找到 ${searchResults.length} 个结果`);
  console.log();

  // 5. 获取文档树结构
  console.log('🌲 获取文档树:');
  const tree = await siyuan.document.getDocTree(notebookId);
  console.log(`  顶级节点数: ${tree.length}`);
  if (tree.length > 0) {
    console.log(`  第一个节点: ${tree[0].name}`);
    if (tree[0].children && tree[0].children.length > 0) {
      console.log(`    子节点数: ${tree[0].children.length}`);
    }
  }
  console.log();

  // 6. 获取或创建今日笔记（不追加内容）
  console.log('📅 获取今日笔记:');
  const dailyNoteId = await siyuan.dailyNote.getOrCreateDailyNote(notebookId);
  console.log(`  今日笔记 ID: ${dailyNoteId}`);

  // 在开头插入内容
  await siyuan.dailyNote.prependToDailyNote(
    notebookId,
    '## 待办事项\n\n- [ ] 完成高级示例测试'
  );
  console.log(`  已在今日笔记开头插入待办事项`);
  console.log();

  // 7. 读取并展示文档完整内容
  console.log('📖 读取刚创建的文档:');
  const fullContent = await siyuan.getFileContent(docId);
  console.log('  内容预览:');
  console.log('  ' + fullContent.split('\n').slice(0, 10).join('\n  '));
  console.log();

  console.log('✅ 高级演示完成！');
  console.log(`
📊 演示摘要:
- 使用了自定义 SQL 查询
- 获取了笔记本配置
- 创建了包含多个块的文档
- 在特定笔记本中进行了搜索
- 获取了文档树结构
- 操作了今日笔记（创建+在开头插入）
`);
}

// 运行演示
advancedDemo().catch(console.error);
