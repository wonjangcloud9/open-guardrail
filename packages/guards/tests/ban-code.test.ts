import { describe, it, expect } from 'vitest';
import { banCode } from '../src/ban-code.js';

const ctx = { pipelineType: 'output' as const };

describe('ban-code guard', () => {
  it('detects markdown code blocks', async () => {
    const guard = banCode({ action: 'block' });
    const result = await guard.check('Here is code:\n```\nconsole.log("hi")\n```', ctx);
    expect(result.passed).toBe(false);
    expect(result.details?.detected['code-block']).toBe(1);
  });

  it('detects JavaScript patterns', async () => {
    const guard = banCode({ action: 'block', languages: ['javascript'] });
    const result = await guard.check('const foo = () => { return 1; }', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects Python patterns', async () => {
    const guard = banCode({ action: 'block', languages: ['python'] });
    const result = await guard.check('def hello():\n  print("hi")', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects shell commands', async () => {
    const guard = banCode({ action: 'block', languages: ['shell'] });
    const result = await guard.check('Run: sudo rm -rf /', ctx);
    expect(result.passed).toBe(false);
  });

  it('allows plain text', async () => {
    const guard = banCode({ action: 'block' });
    const result = await guard.check('The weather is nice today. No code here.', ctx);
    expect(result.passed).toBe(true);
  });

  it('filters by language', async () => {
    const guard = banCode({ action: 'block', languages: ['python'] });
    const result = await guard.check('const x = 5;', ctx);
    expect(result.passed).toBe(true);
  });
});
