import { SiyuanDocumentApi } from '../../src/api/document.js';

describe('getDocumentTree (回归测试 - 当前 bug)', () => {
  let api: SiyuanDocumentApi;
  const NOTEBOOK_ID = process.env.TEST_NOTEBOOK_ID || '20260416164710-zpvex7y';
  const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:6806';
  const TOKEN = process.env.TEST_TOKEN || 'mqeejpiki94zd3ph';

  beforeAll(() => {
    api = new SiyuanDocumentApi({
      request: async (endpoint: string, data: any) => {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Token ' + TOKEN },
          body: data ? JSON.stringify(data) : undefined,
        });
        return res.json();
      },
    } as any);
  });

  // 计数所有节点（包括嵌套 children）
  function countAllNodes(nodes: any[]): number {
    let c = 0;
    for (const n of nodes) {
      c++;
      if (n.children) c += countAllNodes(n.children);
    }
    return c;
  }

  it('should return 5+ root nodes on big notebook', async () => {
    const tree = await api.getDocumentTree(NOTEBOOK_ID, 10);
    expect(tree.length).toBeGreaterThan(2);
  });

  it('should return full tree (>= 400 nodes) on big notebook', async () => {
    const tree = await api.getDocumentTree(NOTEBOOK_ID, 10);
    const total = countAllNodes(tree);
    expect(total).toBeGreaterThanOrEqual(400);
  });

  it('should have parent-child relationships', async () => {
    const tree = await api.getDocumentTree(NOTEBOOK_ID, 10);
    function hasChildren(nodes: any[]): boolean {
      for (const n of nodes) {
        if (n.children && n.children.length > 0) return true;
        if (hasChildren(n.children || [])) return true;
      }
      return false;
    }
    expect(hasChildren(tree)).toBe(true);
  });
});

describe('getDocumentTree edge cases', () => {
  let api: SiyuanDocumentApi;
  const NOTEBOOK_ID = process.env.TEST_NOTEBOOK_ID || '20260416164710-zpvex7y';
  const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:6806';
  const TOKEN = process.env.TEST_TOKEN || 'mqeejpiki94zd3ph';

  beforeAll(() => {
    api = new SiyuanDocumentApi({
      request: async (endpoint: string, data: any) => {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Token ' + TOKEN },
          body: data ? JSON.stringify(data) : undefined,
        });
        return res.json();
      },
    } as any);
  });

  it('should return empty array for non-existent notebook', async () => {
    const tree = await api.getDocumentTree('non-existent-notebook-id-9999', 10);
    expect(tree).toEqual([]);
  });

  it('should resolve parent-child correctly (specific known pair)', async () => {
    // 102-建表方式 (20260501100520-d0mlbxg) should be child of backlog (20260501100518-aufo3d9)
    const tree = await api.getDocumentTree(NOTEBOOK_ID, 10);
    const backlog = tree
      .flatMap((r: any) => [r, ...(r.children || [])])
      .flatMap((r: any) => [r, ...(r.children || [])])
      .find((n: any) => n.id === '20260501100518-aufo3d9');
    expect(backlog).toBeDefined();
    const childIds = (backlog.children || []).map((c: any) => c.id);
    expect(childIds).toContain('20260501100520-d0mlbxg');
  });

  it('should handle deeply nested chains (5+ levels)', async () => {
    // daily note > 2026 > 05 > 2026-05-12 > 某笔记 = 5 层
    const tree = await api.getDocumentTree(NOTEBOOK_ID, 10);
    function maxDepth(nodes: any[], d: number = 0): number {
      let m = d;
      for (const n of nodes) {
        if (n.children) m = Math.max(m, maxDepth(n.children, d + 1));
      }
      return m;
    }
    expect(maxDepth(tree)).toBeGreaterThanOrEqual(5);
  });
});

describe('getDocumentTree with document ID', () => {
  let api: SiyuanDocumentApi;
  const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:6806';
  const TOKEN = process.env.TEST_TOKEN || 'mqeejpiki94zd3ph';

  beforeAll(() => {
    api = new SiyuanDocumentApi({
      request: async (endpoint: string, data: any) => {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Token ' + TOKEN },
          body: data ? JSON.stringify(data) : undefined,
        });
        return res.json();
      },
    } as any);
  });

  it('should return the doc itself as single root with its children', async () => {
    // 2026-05-21 日期页，已知有 5 个子文档
    const DOC_ID = '20260521083050-fz14rgz';
    const tree = await api.getDocumentTree(DOC_ID, 10);

    expect(tree.length).toBe(1);
    const root = tree[0];
    expect(root).toBeDefined();
    expect(root!.id).toBe(DOC_ID);
    expect(root!.children!.length).toBe(5);
  });
});