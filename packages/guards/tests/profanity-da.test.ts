import { describe, it, expect } from 'vitest';
import { profanityDa } from '../src/profanity-da.js';

describe('profanity-da guard', () => {
  it('detects "lort"', async () => {
    const guard = profanityDa({ action: 'block' });
    const result = await guard.check('Det er noget lort det her', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('detects "helvede"', async () => {
    const guard = profanityDa({ action: 'warn' });
    const result = await guard.check('Hvad helvede sker der!', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('detects "kraftedeme"', async () => {
    const guard = profanityDa({ action: 'block' });
    const result = await guard.check('kraftedeme det var dumt', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('allows clean Danish text', async () => {
    const guard = profanityDa({ action: 'block' });
    const result = await guard.check('Hej, hvordan har du det?', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
    expect(result.action).toBe('allow');
  });

  it('detects "røv"', async () => {
    const guard = profanityDa({ action: 'block' });
    const result = await guard.check('Hold din røv lukket', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('scores higher for multiple matches', async () => {
    const guard = profanityDa({ action: 'block' });
    const result = await guard.check('lort pis fanden helvede', { pipelineType: 'input' });
    expect(result.score).toBeGreaterThan(0.5);
  });
});
