import { describe, it, expect } from 'vitest';
import { legalDisclaimerCheck } from '../src/legal-disclaimer-check.js';

describe('legal-disclaimer-check guard', () => {
  it('flags investment advice without disclaimer', async () => {
    const guard = legalDisclaimerCheck({ action: 'warn' });
    const result = await guard.check('You should invest in these stocks for high dividend returns.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows investment advice with disclaimer', async () => {
    const guard = legalDisclaimerCheck({ action: 'block' });
    const text = 'Consider these stocks for dividends. This is not financial advice. Consult a financial advisor.';
    const result = await guard.check(text, { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('flags medical content without disclaimer', async () => {
    const guard = legalDisclaimerCheck({ action: 'warn' });
    const result = await guard.check('For your symptoms, take this medication at a 500mg dosage.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('flags legal content without disclaimer', async () => {
    const guard = legalDisclaimerCheck({ action: 'warn' });
    const result = await guard.check('You have legal rights to sue the contractor for liability.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows non-sensitive content', async () => {
    const guard = legalDisclaimerCheck({ action: 'block' });
    const result = await guard.check('The weather today is sunny with clear skies.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('respects requireFor option', async () => {
    const guard = legalDisclaimerCheck({ action: 'warn', requireFor: ['medical'] });
    const result = await guard.check('You should invest in stocks for dividends.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('returns details with missing disclaimers', async () => {
    const guard = legalDisclaimerCheck({ action: 'warn' });
    const result = await guard.check('Take this medication for symptoms.', { pipelineType: 'output' });
    expect(result.details?.missingDisclaimers).toContain('medical');
  });
});
