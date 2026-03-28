import { describe, it, expect } from 'vitest';
import { codeReviewSafety } from '../src/code-review-safety.js';
const ctx = { pipelineType: 'input' as const };
describe('code-review-safety', () => {
  it('detects hardcoded credentials', async () => {
    const g = codeReviewSafety({ action: 'block' });
    const r = await g.check('const password = "super_secret_123"', ctx);
    expect(r.passed).toBe(false);
    expect(r.details?.issues).toContain('hardcoded credential');
  });
  it('detects AWS access keys', async () => {
    const g = codeReviewSafety({ action: 'block' });
    expect((await g.check('AKIAIOSFODNN7EXAMPLE', ctx)).passed).toBe(false);
  });
  it('detects eval usage', async () => {
    const g = codeReviewSafety({ action: 'warn' });
    const r = await g.check('eval(userInput)', ctx);
    expect(r.passed).toBe(false);
    expect(r.action).toBe('warn');
  });
  it('detects SQL string concatenation', async () => {
    const g = codeReviewSafety({ action: 'block' });
    const code = 'const q = "SELECT * FROM users WHERE id = " + userId + " LIMIT 1"';
    expect((await g.check(code, ctx)).passed).toBe(false);
  });
  it('allows safe code', async () => {
    const g = codeReviewSafety({ action: 'block' });
    expect((await g.check('function add(a, b) { return a + b; }', ctx)).passed).toBe(true);
  });
  it('detects GitHub tokens', async () => {
    const g = codeReviewSafety({ action: 'block' });
    expect((await g.check('ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh1234', ctx)).passed).toBe(false);
  });
});
