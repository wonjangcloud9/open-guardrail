import { describe, it, expect } from 'vitest';
import { promptTemplateInject } from '../src/prompt-template-inject.js';

describe('prompt-template-inject guard', () => {
  it('passes clean text', async () => {
    const guard = promptTemplateInject({ action: 'block' });
    const r = await guard.check('Hello world', { pipelineType: 'input' });
    expect(r.passed).toBe(true);
  });
  it('blocks template injection', async () => {
    const guard = promptTemplateInject({ action: 'block' });
    const r = await guard.check('{{system.exec("ls")}}', { pipelineType: 'input' });
    expect(r.passed).toBe(false);
  });
});
