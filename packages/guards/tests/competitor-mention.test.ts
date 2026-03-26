import { describe, it, expect } from 'vitest';
import { competitorMention } from '../src/competitor-mention.js';

const ctx = { pipelineType: 'output' as const };

describe('competitor-mention guard', () => {
  it('detects competitor brand name', async () => {
    const guard = competitorMention({
      action: 'block',
      competitors: ['CompetitorX', 'RivalCo'],
    });
    const result = await guard.check('Try CompetitorX instead', ctx);
    expect(result.passed).toBe(false);
    expect(result.details?.matched).toContain('CompetitorX');
  });

  it('case-insensitive by default', async () => {
    const guard = competitorMention({
      action: 'block',
      competitors: ['OpenAI'],
    });
    const result = await guard.check('use openai for this', ctx);
    expect(result.passed).toBe(false);
  });

  it('case-sensitive when configured', async () => {
    const guard = competitorMention({
      action: 'block',
      competitors: ['OpenAI'],
      caseSensitive: true,
    });
    const result = await guard.check('use openai for this', ctx);
    expect(result.passed).toBe(true);
  });

  it('allows text without competitors', async () => {
    const guard = competitorMention({
      action: 'block',
      competitors: ['CompetitorX'],
    });
    const result = await guard.check('Our product is great', ctx);
    expect(result.passed).toBe(true);
  });

  it('detects multiple competitors', async () => {
    const guard = competitorMention({
      action: 'warn',
      competitors: ['AlphaAI', 'BetaML'],
    });
    const result = await guard.check('Unlike AlphaAI and BetaML, we are better', ctx);
    expect(result.details?.matched).toContain('AlphaAI');
    expect(result.details?.matched).toContain('BetaML');
  });
});
