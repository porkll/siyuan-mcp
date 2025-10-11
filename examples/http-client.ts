/**
 * SiYuan MCP HTTP Client 示例
 *
 * 演示如何使用 HTTP/SSE 传输连接 SiYuan MCP 服务器
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

async function main() {
  // 1. 创建传输实例
  const transport = new StreamableHTTPClientTransport(
    new URL('http://localhost:3000/mcp')
  );

  // 2. 创建客户端实例
  const client = new Client(
    {
      name: 'siyuan-http-example',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  try {
    // 3. 连接到服务器
    console.log('Connecting to SiYuan MCP Server...');
    await client.connect(transport);
    console.log('✅ Connected successfully!');

    // 4. 列出所有可用工具
    console.log('\n📋 Available tools:');
    const { tools } = await client.listTools();
    tools.forEach((tool, index) => {
      console.log(`${index + 1}. ${tool.name} - ${tool.description}`);
    });

    // 5. 调用工具：列出笔记本
    console.log('\n📚 Listing notebooks...');
    const notebooksResult = await client.callTool({
      name: 'list_notebooks',
      arguments: {},
    });
    console.log('Notebooks:');
    const notebooks = JSON.parse(notebooksResult.content[0].text!);
    notebooks.forEach((nb: any) => {
      console.log(`  - ${nb.name} (ID: ${nb.id})`);
    });

    // 6. 调用工具：搜索文档
    console.log('\n🔍 Searching for documents...');
    const searchResult = await client.callTool({
      name: 'search_by_content',
      arguments: {
        content: '测试',
        limit: 3,
      },
    });
    console.log('Search results:');
    const results = JSON.parse(searchResult.content[0].text!);
    results.forEach((result: any, index: number) => {
      console.log(`  ${index + 1}. ${result.content} (${result.hpath})`);
    });

    // 7. 调用工具：获取最近更新的文档
    console.log('\n📄 Getting recently updated documents...');
    const recentResult = await client.callTool({
      name: 'get_recently_updated_documents',
      arguments: {
        limit: 5,
      },
    });
    console.log('Recent documents:');
    const recents = JSON.parse(recentResult.content[0].text!);
    recents.forEach((doc: any, index: number) => {
      console.log(`  ${index + 1}. ${doc.content || doc.fcontent}`);
    });

    console.log('\n✅ All operations completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // 8. 关闭连接
    await client.close();
    console.log('Connection closed.');
  }
}

// 运行示例
main().catch(console.error);
