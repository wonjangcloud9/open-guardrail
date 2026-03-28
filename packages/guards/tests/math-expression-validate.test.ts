import { describe, it, expect } from 'vitest';
import { mathExpressionValidate } from '../src/math-expression-validate.js';

const ctx = { pipelineType: 'output' as const };

describe('math-expression-validate guard', () => {
  it('passes valid math expression', async () => {
    const guard = mathExpressionValidate({ action: 'warn' });
    const result = await guard.check('The result is $2 + 3 = 5$.', ctx);
    expect(result.passed).toBe(true);
  });

  it('detects unbalanced parentheses', async () => {
    const guard = mathExpressionValidate({ action: 'block' });
    const result = await guard.check('Calculate $((2 + 3) * 4$.', ctx);
    expect(result.passed).toBe(false);
  });

  it('passes text without math', async () => {
    const guard = mathExpressionValidate({ action: 'block' });
    const result = await guard.check('No math here, just text.', ctx);
    expect(result.passed).toBe(true);
  });

  it('validates inline expressions', async () => {
    const guard = mathExpressionValidate({ action: 'warn' });
    const result = await guard.check('Compute (2+3)*4 for the answer.', ctx);
    expect(result.passed).toBe(true);
  });

  it('handles LaTeX block notation', async () => {
    const guard = mathExpressionValidate({ action: 'warn' });
    const result = await guard.check('The formula is \\[x + y = z\\]', ctx);
    expect(result.passed).toBe(true);
  });
});
