import { describe, it, expect } from 'vitest';
import { responseFormatJson } from '../src/response-format-json.js';

describe('response-format-json guard', () => {
  it('rejects invalid JSON', async () => {
    const guard = responseFormatJson({ action: 'block' });
    const result = await guard.check('not json at all', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.score).toBe(1.0);
  });

  it('accepts valid JSON', async () => {
    const guard = responseFormatJson({ action: 'block' });
    const result = await guard.check('{"name": "test", "value": 42}', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('detects excessive nesting depth', async () => {
    const guard = responseFormatJson({ action: 'block', maxDepth: 3 });
    const deep = JSON.stringify({ a: { b: { c: { d: { e: 1 } } } } });
    const result = await guard.check(deep, { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects oversized arrays', async () => {
    const guard = responseFormatJson({ action: 'warn', maxArrayLength: 5 });
    const arr = JSON.stringify({ items: Array.from({ length: 10 }, (_, i) => i) });
    const result = await guard.check(arr, { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('checks required fields', async () => {
    const guard = responseFormatJson({ action: 'block', requiredFields: ['id', 'name'] });
    const result = await guard.check('{"id": 1}', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('passes when required fields present', async () => {
    const guard = responseFormatJson({ action: 'block', requiredFields: ['id', 'name'] });
    const result = await guard.check('{"id": 1, "name": "test"}', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('returns issues in details', async () => {
    const guard = responseFormatJson({ action: 'block' });
    const result = await guard.check('{invalid}', { pipelineType: 'output' });
    expect(result.details).toBeDefined();
  });
});
