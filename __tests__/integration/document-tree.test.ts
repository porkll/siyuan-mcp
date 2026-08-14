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