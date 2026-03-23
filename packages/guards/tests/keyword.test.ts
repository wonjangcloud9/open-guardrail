import { describe, it, expect } from 'vitest';
import { keyword } from '../src/keyword.js';

describe('keyword guard', () => {
  it('blocks text containing denied keywords', async () => {
    const guard = keyword({ denied: ['spam', 'scam'], action: 'block' });
    const result = await guard.check('this is a scam', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('allows text without denied keywords', async () => {
    const guard = keyword({ denied: ['spam'], action: 'block' });
    const result = await guard.check('hello world', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('case insensitive by default', async () => {
    const guard = keyword({ denied: ['SPAM'], action: 'block' });
    const result = await guard.check('this is spam', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('supports allowed-only mode', async () => {
    const guard = keyword({ allowed: ['greeting', 'farewell'], action: 'block' });
    const result = await guard.check('hello greeting', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('blocks when no allowed keyword found', async () => {
    const guard = keyword({ allowed: ['greeting'], action: 'block' });
    const result = await guard.check('random text', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });
});
