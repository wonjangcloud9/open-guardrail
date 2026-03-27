import { describe, it, expect } from 'vitest';
import { structuredOutput } from '../src/structured-output.js';

describe('structured-output guard', () => {
  it('passes valid structured output', async () => {
    const guard = structuredOutput({
      action: 'block',
      fields: [
        { field: 'name', type: 'string', required: true },
        { field: 'age', type: 'number', required: true },
      ],
    });
    const r = await guard.check('{"name": "Alice", "age": 30}', { pipelineType: 'output' });
    expect(r.passed).toBe(true);
  });

  it('blocks missing required fields', async () => {
    const guard = structuredOutput({
      action: 'block',
      fields: [{ field: 'name', type: 'string', required: true }],
    });
    const r = await guard.check('{"age": 30}', { pipelineType: 'output' });
    expect(r.passed).toBe(false);
  });

  it('blocks invalid JSON', async () => {
    const guard = structuredOutput({ action: 'block', fields: [] });
    const r = await guard.check('not json', { pipelineType: 'output' });
    expect(r.passed).toBe(false);
  });

  it('validates enum values', async () => {
    const guard = structuredOutput({
      action: 'warn',
      fields: [{ field: 'status', enum: ['active', 'inactive'] }],
    });
    const r = await guard.check('{"status": "unknown"}', { pipelineType: 'output' });
    expect(r.passed).toBe(false);
  });
});
