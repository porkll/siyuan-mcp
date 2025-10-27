/**
 * 快照相关工具处理器
 */

import { BaseToolHandler } from './base.js';
import type { ExecutionContext, JSONSchema } from '../core/types.js';

/**
 * 创建数据快照
 */
export class CreateSnapshotHandler extends BaseToolHandler<
  { memo?: string },
  { success: boolean; memo: string; message: string }
> {
  readonly name = 'create_snapshot';
  readonly description = 'Create a data snapshot to backup current state (防止误操作可回滚)';
  readonly inputSchema: JSONSchema = {
    type: 'object',
    properties: {
      memo: {
        type: 'string',
        description: 'Snapshot description/memo (optional, default: "Auto snapshot")',
      },
    },
  };

  async execute(
    args: any,
    context: ExecutionContext
  ): Promise<{ success: boolean; memo: string; message: string }> {
    const memo = args.memo || 'Auto snapshot';
    const result = await context.siyuan.snapshot.createSnapshot(memo);
    return {
      ...result,
      message: `Snapshot created successfully with memo: "${memo}"`,
    };
  }
}

/**
 * 获取快照列表
 */
export class ListSnapshotsHandler extends BaseToolHandler<
  { page_number?: number },
  { snapshots: any[]; pageCount: number; totalCount: number }
> {
  readonly name = 'list_snapshots';
  readonly description = 'List available data snapshots with pagination';
  readonly inputSchema: JSONSchema = {
    type: 'object',
    properties: {
      page_number: {
        type: 'number',
        description: 'Page number (starts from 1, default: 1)',
      },
    },
  };

  async execute(
    args: any,
    context: ExecutionContext
  ): Promise<{ snapshots: any[]; pageCount: number; totalCount: number }> {
    const page = args.page_number || 1;
    return await context.siyuan.snapshot.getSnapshots(page);
  }
}

/**
 * 回滚到指定快照
 */
export class RollbackSnapshotHandler extends BaseToolHandler<
  { snapshot_id: string },
  { success: boolean; snapshot_id: string; message: string }
> {
  readonly name = 'rollback_to_snapshot';
  readonly description = 'Rollback to a specific snapshot (恢复到指定快照状态)';
  readonly inputSchema: JSONSchema = {
    type: 'object',
    properties: {
      snapshot_id: {
        type: 'string',
        description: 'Snapshot ID to rollback to',
      },
    },
    required: ['snapshot_id'],
  };

  async execute(
    args: any,
    context: ExecutionContext
  ): Promise<{ success: boolean; snapshot_id: string; message: string }> {
    await context.siyuan.snapshot.rollbackToSnapshot(args.snapshot_id);
    return {
      success: true,
      snapshot_id: args.snapshot_id,
      message: `Successfully rolled back to snapshot: ${args.snapshot_id}`,
    };
  }
}
