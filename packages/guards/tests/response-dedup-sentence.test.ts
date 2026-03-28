import { describe, it, expect } from 'vitest';
import { responseDedupSentence } from '../src/response-dedup-sentence.js';

const ctx = { pipelineType: 'output' as const };

describe('response-dedup-sentence guard', () => {
  it('passes unique sentences', async () => {
    const guard = responseDedupSentence({ action: 'warn' });
    const result = await guard.check('Hello world. This is unique. Another sentence.', ctx);
    expect(result.passed).toBe(true);
  });

  it('allows up to maxDuplicates', async () => {
    const guard = responseDedupSentence({ action: 'block', maxDuplicates: 2 });
    const result = await guard.check('Hello world. Hello world. Different.', ctx);
    expect(result.passed).toBe(true);
  });

  it('detects excessive duplicates', async () => {
    const guard = responseDedupSentence({ action: 'block', maxDuplicates: 1 });
    const result = await guard.check('I am here. I am here. I am here.', ctx);
    expect(result.passed).toBe(false);
  });

  it('handles near-duplicate with case differences', async () => {
    const guard = responseDedupSentence({ action: 'warn', maxDuplicates: 1 });
    const result = await guard.check('Hello World. hello world. HELLO WORLD.', ctx);
    expect(result.passed).toBe(false);
  });

  it('passes empty text', async () => {
    const guard = responseDedupSentence({ action: 'block' });
    const result = await guard.check('', ctx);
    expect(result.passed).toBe(true);
  });

  it('returns duplicate count in details', async () => {
    const guard = responseDedupSentence({ action: 'warn', maxDuplicates: 1 });
    const result = await guard.check('Dup. Dup. Dup. Other.', ctx);
    expect(result.details?.duplicateCount).toBeGreaterThan(0);
  });
});
