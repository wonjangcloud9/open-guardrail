import { describe, it, expect } from 'vitest';
import { caseValidation } from '../src/case-validation.js';

const ctx = { pipelineType: 'output' as const };

describe('case-validation guard', () => {
  it('validates uppercase', async () => {
    const guard = caseValidation({ action: 'block', expectedCase: 'uppercase' });
    expect((await guard.check('HELLO WORLD', ctx)).passed).toBe(true);
    expect((await guard.check('Hello World', ctx)).passed).toBe(false);
  });

  it('validates lowercase', async () => {
    const guard = caseValidation({ action: 'block', expectedCase: 'lowercase' });
    expect((await guard.check('hello world', ctx)).passed).toBe(true);
    expect((await guard.check('Hello World', ctx)).passed).toBe(false);
  });

  it('validates title case', async () => {
    const guard = caseValidation({ action: 'block', expectedCase: 'title-case' });
    expect((await guard.check('Hello World', ctx)).passed).toBe(true);
    expect((await guard.check('hello world', ctx)).passed).toBe(false);
  });

  it('validates sentence case', async () => {
    const guard = caseValidation({ action: 'block', expectedCase: 'sentence-case' });
    expect((await guard.check('Hello world. This is good.', ctx)).passed).toBe(true);
  });

  it('allows non-alphabetic text', async () => {
    const guard = caseValidation({ action: 'block', expectedCase: 'uppercase' });
    expect((await guard.check('12345', ctx)).passed).toBe(true);
  });
});
