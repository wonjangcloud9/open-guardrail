import { describe, it, expect } from 'vitest';
import { codeExecutionDetect } from '../src/code-execution-detect.js';

describe('code-execution-detect guard', () => {
  it('passes clean text', async () => {
    const guard = codeExecutionDetect({ action: 'block' });
    const r = await guard.check('Hello world', { pipelineType: 'input' });
    expect(r.passed).toBe(true);
  });
  it('blocks eval execution', async () => {
    const guard = codeExecutionDetect({ action: 'block' });
    const r = await guard.check('eval("alert(1)")', { pipelineType: 'input' });
    expect(r.passed).toBe(false);
  });
});
