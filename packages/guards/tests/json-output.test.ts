import { describe, it, expect } from 'vitest';
import { jsonOutput } from '../src/json-output.js';

const ctx = { pipelineType: 'output' as const };

describe('json-output guard', () => {
  it('allows valid JSON', async () => {
    const guard = jsonOutput({ action: 'block' });
    const result = await guard.check('{"name": "test", "value": 42}', ctx);
    expect(result.passed).toBe(true);
  });

  it('blocks invalid JSON', async () => {
    const guard = jsonOutput({ action: 'block' });
    const result = await guard.check('not json at all', ctx);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('not valid JSON');
  });

  it('checks required keys', async () => {
    const guard = jsonOutput({ action: 'block', requireKeys: ['name', 'age'] });
    const result = await guard.check('{"name": "test"}', ctx);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('age');
  });

  it('checks max depth', async () => {
    const guard = jsonOutput({ action: 'warn', maxDepth: 2 });
    const result = await guard.check('{"a": {"b": {"c": {"d": 1}}}}', ctx);
    expect(result.passed).toBe(false);
  });

  it('passes all requirements', async () => {
    const guard = jsonOutput({ action: 'block', requireKeys: ['name'], maxDepth: 3 });
    const result = await guard.check('{"name": "test", "data": {"value": 1}}', ctx);
    expect(result.passed).toBe(true);
  });
});
