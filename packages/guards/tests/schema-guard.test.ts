import { describe, it, expect } from 'vitest';
import { schemaGuard } from '../src/schema-guard.js';

describe('schema guard', () => {
  const personSchema = {
    type: 'object' as const,
    properties: {
      name: { type: 'string' as const },
      age: { type: 'number' as const },
    },
    required: ['name'],
  };

  it('passes valid JSON matching schema', async () => {
    const guard = schemaGuard({ schema: personSchema, action: 'block' });
    const result = await guard.check('{"name":"Alice","age":30}', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('blocks invalid JSON', async () => {
    const guard = schemaGuard({ schema: personSchema, action: 'block' });
    const result = await guard.check('not json at all', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.details?.reason).toContain('parse');
  });

  it('blocks JSON missing required field', async () => {
    const guard = schemaGuard({ schema: personSchema, action: 'block' });
    const result = await guard.check('{"age":30}', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('blocks JSON with wrong type', async () => {
    const guard = schemaGuard({ schema: personSchema, action: 'block' });
    const result = await guard.check('{"name":123}', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });
});
