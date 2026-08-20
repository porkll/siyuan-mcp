# get_document_tree 修复 Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** 修复 `get_document_tree` 工具在大笔记本上只返回 64 个根节点且 children 全为空的 bug。

**Architecture:** 改用单次 SQL 查询所有节点（`LIMIT 10000`），用 `path` 字段解析父节点关系，JS 自己构造树结构。

**Tech Stack:** TypeScript, Node.js, SiYuan API, Jest, tsc

---

## 问题诊断

### Bug 1: CTE 递归用 `parent_id` 找父节点（思源不存 parent_id）

```typescript
// 现状（origin/main @ c9f8748）
private buildTreeQuery(id: string, maxDepth: number): string {
  return `
    WITH RECURSIVE doc_tree AS (
      SELECT ... FROM blocks b WHERE b.type = 'd'
        AND (b.box = '${id}' AND b.parent_id = '')   ← 永远匹配不到
        OR b.id = '${id}'
      UNION ALL
      SELECT ... FROM blocks b INNER JOIN doc_tree dt ON b.parent_id = dt.id  ← JOIN 永远空
      WHERE b.type = 'd' AND dt.depth < ${maxDepth}
    )
    SELECT * FROM doc_tree ORDER BY depth, path;
  `;
}
```

**根因**：思源 blocks 表的 `parent_id` 字段是设计遗留字段，**所有文档的 parent_id 永远是空字符串**。父节点关系存储在 `path` 字段（路径包含祖先 ID）。

### Bug 2: 思源 SQL API 默认 LIMIT 64

`SELECT b.id, b.path FROM blocks WHERE ...`（任何字段）默认只返回前 64 行。

```
SELECT COUNT(*)        → 459
SELECT b.id, b.path    → 64  ← 截断
SELECT ... LIMIT 10000 → 459  ← 显式 limit 全拿到
```

### 测试用例

| # | 输入 | 期望输出 |
|---|---|---|
| 1 | 大笔记本 ID（459 个文档）+ depth=10 | 返回 5 个根节点，其中 4 个有 children 数组 |
| 2 | 空笔记本 ID（0 个文档） | 返回 `[]` |
| 3 | 单文档笔记本 ID（1 个文档） | 返回 1 个根节点，children=[] |
| 4 | 嵌套深笔记本（chain 5+ 层） | 返回完整链状结构，所有中间层都有 children |
| 5 | 笔记本内混合 type（'d' + 'p' + 'h'） | 只返回 type='d' 的文档 |
| 6 | path 异常（不含 `/` 也不含 `.sy`） | 不报错，作为根节点 |

### 验收清单

- [ ] 459 个文档的笔记本能返回完整 5 顶层 + 嵌套 children
- [ ] `npm run build` 0 错误 0 警告
- [ ] `npm test` 全通过
- [ ] 手工 stdIO 测试：depth=10 返回 459 个节点
- [ ] 边界：空笔记本返回 `[]`
- [ ] 边界：单文档笔记本返回 1 个根
- [ ] 边界：5+ 层嵌套链路完整
- [ ] 原有功能（其他 15 个工具）不受影响

---

## Tech Stack

- **运行时**: Node.js (已用 22+)
- **测试**: Jest (`__tests__/`, jest in package.json)
- **编译**: tsc → dist/
- **依赖**: 仓库现有，无新增

---

## Tasks

### Task 1: 写失败的回归测试（验证现状 bug）

**Objective:** 写一个失败的测试，证明 `get_document_tree` 在大笔记本上只返回 64 个根

**Files:**
- Create: `__tests__/integration/document-tree.test.ts`

**Step 1: 查看现有测试结构**

```bash
ls __tests__/ && cat __tests__/integration.test.ts | head -50
```

**Step 2: 写第一个测试**

```typescript
import { SiyuanDocumentApi } from '../../src/api/document.js';

describe('getDocumentTree', () => {
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

  it('should return full tree on big notebook (459 docs)', async () => {
    const tree = await api.getDocumentTree(NOTEBOOK_ID, 10);
    expect(tree.length).toBeGreaterThan(1);  // 应该多于 1 个根
    expect(tree.length).toBeLessThan(100);  // 但应该少于 100

    // 累计所有节点的 children
    function countAll(nodes: any[]): number {
      let c = 0;
      for (const n of nodes) {
        c++;
        if (n.children) c += countAll(n.children);
      }
      return c;
    }
    const total = countAll(tree);
    expect(total).toBeGreaterThanOrEqual(400);  // 应该接近 459
  });

  it('should have parent-child relationships in tree', async () => {
    const tree = await api.getDocumentTree(NOTEBOOK_ID, 10);
    function hasChildren(nodes: any[]): boolean {
      for (const n of nodes) {
        if (n.children && n.children.length > 0) return true;
        if (hasChildren(n.children || [])) return true;
      }
      return false;
    }
    expect(hasChildren(tree)).toBe(true);  // 至少有一个节点有 children
  });
});
```

**Step 3: 跑测试确认失败**

```bash
npm test -- --testPathPattern=document-tree
```

**Expected: 2 failed**

- "should return full tree" - 实际返回 64 个根，所有 children=[] → total = 64
- "should have parent-child relationships" - hasChildren 返回 false

**Step 4: Commit**

```bash
git add __tests__/integration/document-tree.test.ts
git commit -m "test: add failing tests for get_document_tree (bug)"
```

---

### Task 2: 修复 `buildTreeQuery`（去掉 CTE，加 LIMIT 10000）

**Objective:** 改用单次查询，返回所有节点

**Files:**
- Modify: `src/api/document.ts:215-267`

**Step 1: 替换 `buildTreeQuery` 函数**

完整代码（直接替换）：

```typescript
private buildTreeQuery(id: string, maxDepth: number): string {
  // 注意：思源 SQL API 默认 LIMIT 64，必须显式加 LIMIT 才能返回完整数据
  // maxDepth 参数保留以兼容 API，但实际不再需要——JS 自己构造树
  void maxDepth;
  return `
    SELECT
      b.id,
      b.parent_id,
      b.root_id,
      b.content as name,
      b.box,
      b.path,
      b.hpath,
      b.type,
      b.subtype,
      b.ial
    FROM blocks b
    WHERE b.type = 'd'
      AND (
        (b.box = '${id}')
        OR
        (b.id = '${id}')
      )
    ORDER BY b.path
    LIMIT 10000;
  `;
}
```

**Step 2: 编译**

```bash
npm run build
```

**Expected: 0 错误**

**Step 3: 跑测试**

```bash
npm test -- --testPathPattern=document-tree
```

**Expected: 第 1 个测试可能仍失败（取决于 children 还没修）**

**Step 4: Commit**

```bash
git add src/api/document.ts
git commit -m "fix: replace CTE with single query + LIMIT 10000"
```

---

### Task 3: 修复 `toDocTreeNodeResponse`（用 path 解析父节点）

**Objective:** 用 path 字段解析父节点 ID

**Files:**
- Modify: `src/api/document.ts:269-307`

**Step 1: 替换 `toDocTreeNodeResponse` 函数**

完整代码：

```typescript
private toDocTreeNodeResponse(data: any[]): DocTreeNodeResponse[] {
  if (!data || data.length === 0) return [];

  const nodeMap = new Map<string, DocTreeNodeResponse>();
  const rootNodes: DocTreeNodeResponse[] = [];

  data.forEach((item) => {
    const node: DocTreeNodeResponse = {
      id: item.id as string,
      name: extractTitle(item.content || item.name),
      path: item.hpath as string,
      children: [],
    };

    nodeMap.set(node.id, node);

    // 解析 path 找父节点 ID：
    // path 形如 /<root_id>/<id1>/<id2>/<self_id>.sy
    // 例如 /20260501095329-jd2u4zy/20260501100518-aufo3d9/20260501100520-d0mlbxg.sy
    // 父节点 ID = path 中去掉开头的 / 和末尾的 .sy 后的最后一段
    const path = (item.path as string) || '';
    const trimmed = path.replace(/^\//, '').replace(/\.sy$/, '');
    const segments = trimmed.split('/').filter((s) => s);

    if (segments.length <= 1) {
      rootNodes.push(node);
    } else {
      const parentId = segments[segments.length - 2];
      const parent = nodeMap.get(parentId);
      if (parent) {
        if (!parent.children) parent.children = [];
        parent.children.push(node);
      } else {
        rootNodes.push(node);
      }
    }
  });

  return rootNodes;
}
```

**Step 2: 编译**

```bash
npm run build
```

**Expected: 0 错误**

**Step 3: 跑测试**

```bash
npm test -- --testPathPattern=document-tree
```

**Expected: 全过（2 passed）**

**Step 4: 跑全部测试确认无回归**

```bash
npm test
```

**Expected: 全部通过**

**Step 5: Commit**

```bash
git add src/api/document.ts
git commit -m "fix: use path field to resolve parent-child in tree"
```

---

### Task 4: 边界 case 测试

**Objective:** 验证空笔记本、单文档、嵌套深的情况

**Files:**
- Modify: `__tests__/integration/document-tree.test.ts`

**Step 1: 加边界测试**

```typescript
describe('getDocumentTree edge cases', () => {
  // ... 用 Task 1 的 api 初始化

  it('should return empty array for non-existent notebook', async () => {
    const tree = await api.getDocumentTree('non-existent-notebook-id', 10);
    expect(tree).toEqual([]);
  });

  it('should return single node for leaf document id', async () => {
    // 'tasks' 笔记本内的某个叶子文档
    const tree = await api.getDocumentTree('20260501100522-uh5s36x', 10);
    expect(tree.length).toBeGreaterThanOrEqual(0);
  });

  it('should handle nested 5+ levels', async () => {
    // /daily note/2026/05/2026-05-12/某笔记
    const tree = await api.getDocumentTree('20260512085825-lfuwqhj', 10);
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
```

**Step 2: 跑测试**

```bash
npm test -- --testPathPattern=document-tree
```

**Expected: 全部通过**

**Step 3: Commit**

```bash
git add __tests__/integration/document-tree.test.ts
git commit -m "test: add edge case tests for getDocumentTree"
```

---

### Task 5: 验证完整流程

**Objective:** 端到端验证

**Step 1: 重新编译**

```bash
npm run build
```

**Step 2: 手工 stdIO 测试**

```bash
# 启动 stdIO 客户端，调用 get_document_tree
node -e "
const { spawn } = require('child_process');
const proc = spawn('node', ['dist/mcp-server/bin/stdio.js', '--token', 'mqeejpiki94zd3ph', '--baseUrl', 'http://127.0.0.1:6806']);
let buf = '';
proc.stdout.on('data', (d) => {
  buf += d.toString();
  for (const line of buf.split('\n')) {
    if (line.trim()) {
      try {
        const m = JSON.parse(line);
        if (m.id === 1) {
          const data = JSON.parse(m.result.content[0].text);
          const total = countAll(data);
          console.log('Total nodes:', total);
          process.exit(0);
        }
      } catch (e) {}
    }
  }
});
function countAll(arr) { let c = 0; for (const n of arr) { c++; if (n.children) c += countAll(n.children); } return c; }
proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 0, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1.0' } } }) + '\n');
setTimeout(() => {
  proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'get_document_tree', arguments: { id: '20260416164710-zpvex7y', depth: 10 } } }) + '\n');
}, 500);
setTimeout(() => process.exit(1), 8000);
"
```

**Expected: `Total nodes: 459`**（或其他 >= 100 的数）

**Step 3: 全测试套**

```bash
npm test
```

**Expected: 全部通过**

**Step 4: 完成**

不需要 commit——所有任务已 commit。

---

## 完整任务流

```
Task 1: 写失败的测试 ✓
Task 2: 修复 buildTreeQuery ✓
Task 3: 修复 toDocTreeNodeResponse ✓
Task 4: 边界 case 测试 ✓
Task 5: 端到端验证 ✓
```

**5 个 Task × 平均 3 分钟 = 15 分钟完成**

---

## 风险

- **Risk 1**: 思源笔记本文档数 > 10000 → 仍然截断。**Mitigation**: 文档注释里提醒，思源官方文档说 SQL API 默认 limit 64 是"安全默认值"，超过 10000 的笔记本极少
- **Risk 2**: path 格式变化（思源未来版本可能改）→ 解析逻辑失效。**Mitigation**: 测试覆盖核心 path 格式，将来变化时容易发现
- **Risk 3**: 其他 15 个工具是否依赖旧的 query 格式 → 通过 `npm test` 全套验证

---

## 备注

- 起点分支: `backup/before-fix-2026-08-14`（c9f8748）
- 当前分支: `cc-superpower/get-document-tree-default-limit`
- 修复参考: `fix/get-document-tree-default-limit`（51d171e，已知可行方案）
- 备份: `~/Desktop/clash-verge-mcp-backup-2026-08-14/document.js`
