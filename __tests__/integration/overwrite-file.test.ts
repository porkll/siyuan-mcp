import { SiyuanTools } from '../../src/index.js';
import { SiyuanClient } from '../../src/api/client.js';

describe('overwriteFile (回归 - update_document bug)', () => {
  const BASE_URL = 'http://127.0.0.1:6806';
  const TOKEN = process.env.TEST_TOKEN || 'mqeejpiki94zd3ph';
  const TEST_DOC_ID = process.env.TEST_DOC_ID || '';

  let tools: SiyuanTools;
  let queryClient: SiyuanClient;

  beforeAll(() => {
    tools = new SiyuanTools({ baseUrl: BASE_URL, token: TOKEN });
    queryClient = new SiyuanClient({ baseUrl: BASE_URL, token: TOKEN });
  });

  /**
   * 用 exportMdContent 轮询等待指定内容出现。
   * 关键：exportMdContent 直接读块 DOM/kramdown，不走 SQL 索引，
   * 所以没有 200ms~2s 的延迟窗口。300ms 一次的轮询足够（实测通常 1-2 轮就中）。
   * @param docId 文档 ID
   * @param expectedContent 期望出现的 markdown 子串
   * @param mustNotContain 不能出现的子串（用于"旧内容应被删除"断言）
   * @param maxRetries 最大重试次数（默认 20 = 6s 上限）
   */
  const waitForExport = async (
    docId: string,
    expectedContent: string,
    mustNotContain?: string,
    maxRetries = 20
  ): Promise<string> => {
    let lastMd = '';
    for (let i = 0; i < maxRetries; i++) {
      const r = await queryClient.request<{ content: string }>(
        '/api/export/exportMdContent',
        { id: docId }
      );
      const md = r.data?.content || '';
      lastMd = md;
      const hasExpected = md.includes(expectedContent);
      const hasForbidden = mustNotContain ? md.includes(mustNotContain) : false;
      if (hasExpected && !hasForbidden) return md;
      await new Promise((res) => setTimeout(res, 300));
    }
    throw new Error(
      `exportMdContent timeout: expected="${expectedContent}"${
        mustNotContain ? `, mustNotContain="${mustNotContain}"` : ''
      }\nlastMd=${lastMd}`
    );
  };

  it('应该删除旧子块并写入新内容（不留残留）', async () => {
    // 1) 先灌入 3 个旧子块（无 H1，避免被剥）
    await tools.overwriteFile(TEST_DOC_ID, '段落 A\n\n段落 B\n\n段落 C\n');
    // 等旧子块可被 exportMdContent 看到
    await waitForExport(TEST_DOC_ID, '段落 A');

    // 2) 再 overwrite 一个完全不同的内容
    // # sandbox 会被剥（匹配根标题），实际 append 的是 "全新内容 X"
    await tools.overwriteFile(TEST_DOC_ID, '# sandbox\n\n全新内容 X\n');

    // 轮询 exportMdContent 直到"全新内容 X"出现且"段落 A/B/C"消失
    const md = await waitForExport(TEST_DOC_ID, '全新内容 X', '段落');

    // 验证
    expect(md).not.toContain('段落 A');
    expect(md).not.toContain('段落 B');
    expect(md).not.toContain('段落 C');
    expect(md).toContain('全新内容 X');
  });

  it('首行 H1 与根块标题重复时自动剥掉，避免双重渲染', async () => {
    // 测试文档标题固定为 "sandbox"
    await tools.overwriteFile(TEST_DOC_ID, '# sandbox\n\n正文 P1\n\n正文 P2\n');

    // 等导出看到 "正文 P1" 且看不到独立的 "# sandbox"
    const md = await waitForExport(TEST_DOC_ID, '正文 P1');

    // 正文必须出现
    expect(md).toContain('正文 P1');
    expect(md).toContain('正文 P2');
    // H1 已被剥掉（不出现重复 "# sandbox\n\n" 形式）
    expect(md).not.toMatch(/^# sandbox\n\n正文/m);

    // 🔴 关键补强：根块 markdown 字段必须被清空（SQL 直查，无 race 问题）
    // 旧实现会把整页 markdown（含 H1）塞根块 → 根块 markdown = "# sandbox\n\n正文 P1\n\n正文 P2"
    // 新实现应在 overwrite 末尾把根块 markdown 清空 → 根块 markdown = ""
    const rootResult = await queryClient.request<Array<{ markdown: string }>>(
      '/api/query/sql',
      {
        stmt: `SELECT markdown FROM blocks WHERE id='${TEST_DOC_ID}' AND type='d' LIMIT 1`,
      }
    );
    const rootMarkdown = (rootResult.data?.[0]?.markdown || '').trim();
    expect(rootMarkdown).toBe(''); // 根块 markdown 应为空（H1 只存在于 content 字段）
  });

  it('新内容不带 H1 时直接 append（不强行加标题）', async () => {
    await tools.overwriteFile(TEST_DOC_ID, '纯段落内容，无标题\n\n第二段\n');

    // 等两段都出现
    const md = await waitForExport(TEST_DOC_ID, '第二段');

    expect(md).toContain('纯段落内容');
    expect(md).toContain('第二段');
    // 段落不应被强行套标题（不会变成 "## 纯段落内容"）
    expect(md).not.toMatch(/^#+\s*纯段落内容/m);
  });
});
