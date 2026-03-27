import { describe, it, expect } from 'vitest';
import { boundaryTest } from '../src/boundary-test.js';

describe('boundary-test guard', () => {
  it('passes normal text', async () => {
    const guard = boundaryTest({ action: 'block' });
    const r = await guard.check('Normal text', { pipelineType: 'input' });
    expect(r.passed).toBe(true);
  });
  it('blocks text with null byte', async () => {
    const guard = boundaryTest({ action: 'block' });
    const r = await guard.check('\x00hidden', { pipelineType: 'input' });
    expect(r.passed).toBe(false);
  });
});
