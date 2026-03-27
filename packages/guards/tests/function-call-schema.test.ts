import { describe, it, expect } from 'vitest';
import { functionCallSchema } from '../src/function-call-schema.js';

describe('function-call-schema guard', () => {
  it('passes valid function call', async () => {
    const guard = functionCallSchema({
      action: 'block',
      schemas: [{ name: 'search', params: [{ name: 'query', type: 'string', required: true }] }],
    });
    const r = await guard.check('{"name":"search","arguments":{"query":"test"}}', { pipelineType: 'output' });
    expect(r.passed).toBe(true);
  });

  it('blocks unknown function', async () => {
    const guard = functionCallSchema({ action: 'block', schemas: [{ name: 'search', params: [] }] });
    const r = await guard.check('{"name":"delete_all","arguments":{}}', { pipelineType: 'output' });
    expect(r.passed).toBe(false);
  });

  it('blocks missing required params', async () => {
    const guard = functionCallSchema({
      action: 'block',
      schemas: [{ name: 'search', params: [{ name: 'query', type: 'string', required: true }] }],
    });
    const r = await guard.check('{"name":"search","arguments":{}}', { pipelineType: 'output' });
    expect(r.passed).toBe(false);
  });
});
