import { describe, it, expect } from 'vitest';
import { spellingCommon } from '../src/spelling-common.js';

const ctx = { pipelineType: 'output' as const };

describe('spelling-common guard', () => {
  it('passes clean text', async () => {
    const guard = spellingCommon({ action: 'warn' });
    const result = await guard.check('This is perfectly spelled text.', ctx);
    expect(result.passed).toBe(true);
  });

  it('allows up to maxErrors', async () => {
    const guard = spellingCommon({ action: 'block', maxErrors: 3 });
    const result = await guard.check('I definately and seperately went.', ctx);
    expect(result.passed).toBe(true);
  });

  it('fails when exceeding maxErrors', async () => {
    const guard = spellingCommon({ action: 'block', maxErrors: 1 });
    const result = await guard.check('I definately accomodate the occurence of wierd things.', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects common misspelling: accomodate', async () => {
    const guard = spellingCommon({ action: 'warn', maxErrors: 0 });
    const result = await guard.check('We will accomodate your request.', ctx);
    expect(result.details?.errorCount).toBeGreaterThan(0);
  });

  it('passes empty text', async () => {
    const guard = spellingCommon({ action: 'block' });
    const result = await guard.check('', ctx);
    expect(result.passed).toBe(true);
  });

  it('reports corrections in details', async () => {
    const guard = spellingCommon({ action: 'warn', maxErrors: 0 });
    const result = await guard.check('This is definately a seperate issue.', ctx);
    expect(result.details?.samples?.length).toBeGreaterThan(0);
  });

  it('is case insensitive', async () => {
    const guard = spellingCommon({ action: 'warn', maxErrors: 0 });
    const result = await guard.check('DEFINATELY wrong.', ctx);
    expect(result.details?.errorCount).toBeGreaterThan(0);
  });
});
