/**
 * 测试思源笔记 API 工具
 */

import { createSiyuanTools } from '../dist/index.js';

const API_TOKEN = '9vtvpbfnlsh7dcz8';
const BASE_URL = 'http://127.0.0.1:6806';

async function main() {
  console.log('🚀 开始测试思源笔记工具库...\n');

  // 创建工具实例
  const siyuan = createSiyuanTools(BASE_URL, API_TOKEN);

  try {
    // 1. 列出所有笔记本
    console.log('📚 测试: 列出所有笔记本');
    const notebooks = await siyuan.listNotebooks();
    console.log(`找到 ${notebooks.length} 个笔记本:`);
    notebooks.forEach((nb) => {
      console.log(`  - ${nb.name} (ID: ${nb.id})`);
    });
    console.log();

    if (notebooks.length === 0) {
      console.log('❌ 没有找到笔记本，请先创建一个笔记本');
      return;
    }

    const testNotebookId = notebooks[0].id;
    console.log(`✅ 使用笔记本: ${notebooks[0].name} (${testNotebookId})\n`);

    // 2. 搜索文档
    console.log('🔍 测试: 搜索文档');
    const searchResults = await siyuan.searchByFileName('', 5); // 搜索所有文档，限制 5 条
    console.log(`找到 ${searchResults.length} 个文档:`);
    searchResults.slice(0, 3).forEach((doc) => {
      console.log(`  - ${doc.content} (ID: ${doc.id})`);
    });
    console.log();

    // 3. 创建测试文档
    console.log('📝 测试: 创建新文档');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const newDocPath = `/测试文档_${timestamp}`;
    const newDocContent = `# 测试文档

这是一个通过 API 创建的测试文档。

创建时间: ${new Date().toLocaleString('zh-CN')}

## 功能测试

- [x] 创建文档
- [ ] 追加内容
- [ ] 读取内容
- [ ] 更新内容
`;

    const newDocId = await siyuan.createFile(testNotebookId, newDocPath, newDocContent);
    console.log(`✅ 成功创建文档，ID: ${newDocId}\n`);

    // 4. 读取文档内容
    console.log('📖 测试: 读取文档内容');
    const content = await siyuan.getFileContent(newDocId);
    console.log('文档内容前 200 字符:');
    console.log(content.substring(0, 200) + '...\n');

    // 5. 追加内容到文档
    console.log('➕ 测试: 追加内容到文档');
    const appendContent = `
## 新增内容

这是通过 appendToFile API 追加的内容。

时间: ${new Date().toLocaleString('zh-CN')}
`;
    const newBlockId = await siyuan.appendToFile(newDocId, appendContent);
    console.log(`✅ 成功追加内容，新块 ID: ${newBlockId}\n`);

    // 6. 测试今日笔记功能
    console.log('📅 测试: 追加到今日笔记');
    const dailyNoteContent = `
## 测试记录

- 测试时间: ${new Date().toLocaleString('zh-CN')}
- 测试内容: API 工具库正常工作
- 测试文档 ID: ${newDocId}
`;

    try {
      const dailyBlockId = await siyuan.appendToDailyNote(testNotebookId, dailyNoteContent);
      console.log(`✅ 成功追加到今日笔记，块 ID: ${dailyBlockId}\n`);
    } catch (error) {
      console.log(`⚠️  今日笔记操作失败: ${error.message}\n`);
    }

    // 7. 搜索内容
    console.log('🔎 测试: 搜索内容');
    const contentResults = await siyuan.searchByContent('测试', 5);
    console.log(`找到 ${contentResults.length} 个包含"测试"的块\n`);

    // 8. 获取文档树
    console.log('🌲 测试: 获取文档树');
    const docTree = await siyuan.document.getDocTree(testNotebookId);
    console.log(`文档树有 ${docTree.length} 个顶级节点\n`);

    console.log('✅ 所有测试完成！');
    console.log(`
📊 测试摘要:
- 笔记本数量: ${notebooks.length}
- 创建文档 ID: ${newDocId}
- 搜索到包含"测试"的块: ${contentResults.length} 个

🔗 可以在思源笔记中查看刚创建的测试文档
`);
  } catch (error) {
    console.error('❌ 测试失败:', error);
    if (error instanceof Error) {
      console.error('错误详情:', error.message);
      console.error('堆栈:', error.stack);
    }
  }
}

main();
