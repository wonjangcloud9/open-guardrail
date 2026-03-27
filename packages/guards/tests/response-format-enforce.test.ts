import { describe, it, expect } from 'vitest';
import { responseFormatEnforce } from '../src/response-format-enforce.js';

describe('response-format-enforce guard', () => {
  it('passes valid JSON', async () => {
    const guard = responseFormatEnforce({ action: 'block', format: 'json' });
    const r = await guard.check('{"name": "Alice"}', { pipelineType: 'output' });
    expect(r.passed).toBe(true);
  });

  it('blocks non-JSON when expecting JSON', async () => {
    const guard = responseFormatEnforce({ action: 'block', format: 'json' });
    const r = await guard.check('Hello world', { pipelineType: 'output' });
    expect(r.passed).toBe(false);
  });

  it('passes valid markdown', async () => {
    const guard = responseFormatEnforce({ action: 'block', format: 'markdown' });
    const r = await guard.check('# Title\n\n**Bold** text\n- item 1', { pipelineType: 'output' });
    expect(r.passed).toBe(true);
  });

  it('has latencyMs', async () => {
    const guard = responseFormatEnforce({ action: 'block', format: 'json' });
    const r = await guard.check('{}', { pipelineType: 'output' });
    expect(r.latencyMs).toBeGreaterThanOrEqual(0);
  });
});
