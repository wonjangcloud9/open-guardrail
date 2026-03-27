import { describe, it, expect } from 'vitest';
import { apiResponseValidate } from '../src/api-response-validate.js';

describe('api-response-validate guard', () => {
  it('passes clean response', async () => {
    const guard = apiResponseValidate({ action: 'block' });
    const r = await guard.check('OK result', { pipelineType: 'output' });
    expect(r.passed).toBe(true);
  });
  it('blocks error response', async () => {
    const guard = apiResponseValidate({ action: 'block' });
    const r = await guard.check('500 Internal Server Error', { pipelineType: 'output' });
    expect(r.passed).toBe(false);
  });
});
