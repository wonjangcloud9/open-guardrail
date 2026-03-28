import { describe, it, expect } from 'vitest';
import { answerCitationNeeded } from '../src/answer-citation-needed.js';

describe('answer-citation-needed guard', () => {
  it('flags multiple uncited claims', async () => {
    const guard = answerCitationNeeded({ action: 'warn', threshold: 2 });
    const text = 'Studies show that 50% of people agree. Research suggests the trend continues. According to experts, this is true.';
    const result = await guard.check(text, { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows text with citations', async () => {
    const guard = answerCitationNeeded({ action: 'warn' });
    const text = 'Studies show improvement [1]. Research suggests growth (2023). Data shows 45% increase (source: WHO).';
    const result = await guard.check(text, { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('allows plain text without claims', async () => {
    const guard = answerCitationNeeded({ action: 'block' });
    const result = await guard.check('The sky is blue and the grass is green.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('detects percentage claims', async () => {
    const guard = answerCitationNeeded({ action: 'warn', threshold: 2 });
    const text = 'About 75% of users prefer this. Approximately 80% reported satisfaction. Roughly 60 million people agree.';
    const result = await guard.check(text, { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('respects threshold option', async () => {
    const guard = answerCitationNeeded({ action: 'warn', threshold: 5 });
    const text = 'Studies show one thing. Research suggests another.';
    const result = await guard.check(text, { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('returns details with uncited count', async () => {
    const guard = answerCitationNeeded({ action: 'warn', threshold: 1 });
    const text = 'Research shows that X is true. Studies suggest Y.';
    const result = await guard.check(text, { pipelineType: 'output' });
    expect(result.details).toBeDefined();
    expect(result.details?.uncitedClaims).toBeGreaterThanOrEqual(1);
  });
});
