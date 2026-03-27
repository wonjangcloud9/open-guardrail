import { describe, it, expect } from 'vitest';
import { schemaDrift } from '../src/schema-drift.js';

describe('schema-drift guard', () => {
  it('passes matching schema', async () => {
    const guard = schemaDrift({ action: 'block', expectedKeys: ['name', 'age'] });
    const r = await guard.check('{"name":"Alice","age":30}', { pipelineType: 'output' });
    expect(r.passed).toBe(true);
  });
  it('blocks extra fields when not allowed', async () => {
    const guard = schemaDrift({ action: 'block', expectedKeys: ['name', 'age'], allowExtra: false });
    const r = await guard.check('{"name":"Alice","extra":"field"}', { pipelineType: 'output' });
    expect(r.passed).toBe(false);
  });
});
