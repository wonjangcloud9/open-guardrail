import { describe, it, expect } from 'vitest';
import { emotionalContent } from '../src/emotional-content.js';

describe('emotional-content guard', () => {
  it('detects urgency pressure', async () => {
    const guard = emotionalContent({ action: 'warn' });
    const result = await guard.check('Act now before it is too late!', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects limited time offers', async () => {
    const guard = emotionalContent({ action: 'block' });
    const result = await guard.check('This is a limited time offer!', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects fear-mongering', async () => {
    const guard = emotionalContent({ action: 'warn' });
    const result = await guard.check('They don\'t want you to know the truth', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects clickbait patterns', async () => {
    const guard = emotionalContent({ action: 'block' });
    const result = await guard.check('You won\'t believe what happened next', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects FOMO', async () => {
    const guard = emotionalContent({ action: 'warn' });
    const result = await guard.check('Don\'t miss out on this opportunity!', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows neutral text', async () => {
    const guard = emotionalContent({ action: 'block' });
    const result = await guard.check('The report shows a 5% increase in revenue.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });
});
