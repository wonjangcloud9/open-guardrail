import { describe, it, expect } from 'vitest';
import { jsonDepthLimit } from '../src/json-depth-limit.js';

describe('json-depth-limit', () => {
  it('allows shallow JSON', async () => {
    const guard = jsonDepthLimit({ action: 'block', maxDepth: 5 });
    const result = await guard.check('{"a": {"b": 1}}', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('blocks deeply nested JSON', async () => {
    const guard = jsonDepthLimit({ action: 'block', maxDepth: 3 });
    const nested = '{"a":{"b":{"c":{"d":1}}}}';
    const result = await guard.check(nested, { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('counts array nesting', async () => {
    const guard = jsonDepthLimit({ action: 'block', maxDepth: 2 });
    const result = await guard.check('[[[1]]]', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('allows text without JSON', async () => {
    const guard = jsonDepthLimit({ action: 'block' });
    const result = await guard.check('Hello world', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('uses default maxDepth of 20', async () => {
    const guard = jsonDepthLimit({ action: 'block' });
    const result = await guard.check('{"a": 1}', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
    expect(result.details?.maxDepth).toBe(20);
  });

  it('reports depth in details', async () => {
    const guard = jsonDepthLimit({ action: 'warn', maxDepth: 2 });
    const result = await guard.check('{"a":{"b":{"c":1}}}', { pipelineType: 'input' });
    expect(result.details?.depth).toBe(3);
  });
});
