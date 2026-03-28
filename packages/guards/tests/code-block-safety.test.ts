import { describe, it, expect } from 'vitest';
import { codeBlockSafety } from '../src/code-block-safety.js';

describe('code-block-safety guard', () => {
  it('detects rm -rf /', async () => {
    const guard = codeBlockSafety({ action: 'block' });
    const result = await guard.check('Run: rm -rf / to clean up', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('detects DROP TABLE', async () => {
    const guard = codeBlockSafety({ action: 'block' });
    const result = await guard.check('Execute DROP TABLE users;', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects eval with user input', async () => {
    const guard = codeBlockSafety({ action: 'warn' });
    const result = await guard.check('eval(user_input)', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects hardcoded passwords', async () => {
    const guard = codeBlockSafety({ action: 'block' });
    const result = await guard.check('password = "admin123"', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects chmod 777', async () => {
    const guard = codeBlockSafety({ action: 'block' });
    const result = await guard.check('chmod 777 /var/www', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows safe code', async () => {
    const guard = codeBlockSafety({ action: 'block' });
    const result = await guard.check('const x = 1 + 2; console.log(x);', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('returns score', async () => {
    const guard = codeBlockSafety({ action: 'block' });
    const result = await guard.check('rm -rf / and DROP TABLE x', { pipelineType: 'output' });
    expect(result.score).toBeGreaterThan(0);
  });
});
