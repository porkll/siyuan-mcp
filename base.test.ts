import { BaseToolHandler } from './mcp-server/handlers/base.js';
import { makeContext } from './test-utils.js';
import type { JSONSchema } from './mcp-server/core/types.js';

class DemoHandler extends BaseToolHandler<{ name: string; count?: number }, { ok: true }> {
  readonly name = 'demo';
  readonly description = 'demo';

  readonly inputSchema: JSONSchema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      count: { type: 'number' },
    },
    required: ['name'],
  };

  async execute(): Promise<{ ok: true }> {
    return { ok: true };
  }

  public testRequireOneOf(args: Record<string, unknown>, fields: string[]) {
    return this.requireOneOf(args, fields);
  }

  public testForbidTogether(args: Record<string, unknown>, fields: string[]) {
    return this.forbidTogether(args, fields);
  }

  public testGetNumberInRange(value: unknown, field: string, opts: { min?: number; max?: number; defaultValue?: number } = {}) {
    return this.getNumberInRange(value, field, opts);
  }
}

describe('BaseToolHandler', () => {
  it('validate rejects non-object args', () => {
    const handler = new DemoHandler();
    expect(() => handler.validate(null)).toThrow('Arguments must be an object');
    expect(() => handler.validate([])).toThrow('Arguments must be an object');
  });

  it('validate rejects missing required fields', () => {
    const handler = new DemoHandler();
    expect(() => handler.validate({})).toThrow('Missing required field: name');
  });

  it('requireOneOf rejects when none are present', () => {
    const handler = new DemoHandler();
    expect(() => handler.testRequireOneOf({}, ['a', 'b'])).toThrow('One of [a, b] is required');
  });

  it('forbidTogether rejects when mutually exclusive fields are both present', () => {
    const handler = new DemoHandler();
    expect(() => handler.testForbidTogether({ a: 1, b: 2 }, ['a', 'b'])).toThrow('Fields are mutually exclusive: a, b');
  });

  it('getNumberInRange enforces bounds and default', () => {
    const handler = new DemoHandler();
    expect(handler.testGetNumberInRange(undefined, 'limit', { defaultValue: 10 })).toBe(10);
    expect(() => handler.testGetNumberInRange('x', 'limit')).toThrow('limit must be a number');
    expect(() => handler.testGetNumberInRange(0, 'limit', { min: 1 })).toThrow('limit must be >= 1');
    expect(() => handler.testGetNumberInRange(101, 'limit', { max: 100 })).toThrow('limit must be <= 100');
    expect(handler.testGetNumberInRange(5, 'limit', { min: 1, max: 10 })).toBe(5);
  });

  it('safeExecute validates, executes, and logs', async () => {
    const handler = new DemoHandler();
    const context = makeContext();
    await expect(handler.safeExecute({ name: 'ok' }, context)).resolves.toEqual({ ok: true });
    expect(context.logger.debug).toHaveBeenCalled();
  });
});
