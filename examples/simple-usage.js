/**
 * 简单使用示例
 * 展示最常用的功能
 */

import { createSiyuanTools } from '../dist/index.js';

// 配置
const API_TOKEN = '9vtvpbfnlsh7dcz8';
const BASE_URL = 'http://127.0.0.1:6806';

async function simpleDemo() {
  // 1. 创建工具实例
  const siyuan = createSiyuanTools(BASE_URL, API_TOKEN);

  // 2. 获取第一个笔记本
  const notebooks = await siyuan.listNotebooks();
  const notebookId = notebooks[0].id;

  console.log(`使用笔记本: ${notebooks[0].name}\n`);

  // 3. 搜索笔记
  console.log('搜索包含"测试"的笔记:');
  const results = await siyuan.searchByContent('测试', 3);
  results.forEach(block => {
    console.log(`  - ${block.content.substring(0, 50)}...`);
  });
  console.log();

  // 4. 创建新笔记
  console.log('创建新笔记...');
  const newDocId = await siyuan.createFile(
    notebookId,
    '/API测试/简单示例',
    '# 简单示例\n\n这是一个简单的测试笔记。'
  );
  console.log(`创建成功，文档ID: ${newDocId}\n`);

  // 5. 追加内容
  console.log('追加内容到新笔记...');
  await siyuan.appendToFile(newDocId, '## 新增段落\n\n这是追加的内容。');
  console.log('追加成功\n');

  // 6. 读取内容
  console.log('读取笔记内容:');
  const content = await siyuan.getFileContent(newDocId);
  console.log(content.substring(0, 200));
  console.log();

  // 7. 追加到今日笔记
  console.log('追加到今日笔记...');
  await siyuan.appendToDailyNote(
    notebookId,
    `## ${new Date().toLocaleTimeString()}\n\n完成了 API 测试。`
  );
  console.log('追加成功\n');

  console.log('✅ 演示完成！');
}

// 运行演示
simpleDemo().catch(console.error);
