import { describe, it, expect } from 'vitest';
import { creditCardLuhn } from '../src/credit-card-luhn.js';

describe('credit-card-luhn guard', () => {
  it('detects valid Visa number', async () => {
    const guard = creditCardLuhn({ action: 'block' });
    const result = await guard.check('Card: 4532015112830366', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('passes on invalid Luhn number', async () => {
    const guard = creditCardLuhn({ action: 'block' });
    const result = await guard.check('Card: 4532015112830360', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('detects number with dashes', async () => {
    const guard = creditCardLuhn({ action: 'block' });
    const result = await guard.check('Pay with 4532-0151-1283-0366', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('masks card by default', async () => {
    const guard = creditCardLuhn({ action: 'block' });
    const result = await guard.check('Card: 4532015112830366', { pipelineType: 'input' });
    expect(result.details?.masked?.[0]).toContain('****');
  });

  it('allows normal text', async () => {
    const guard = creditCardLuhn({ action: 'block' });
    const result = await guard.check('The order total is $42.00', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('detects Amex format', async () => {
    const guard = creditCardLuhn({ action: 'warn' });
    const result = await guard.check('Amex: 378282246310005', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('returns score 1 for valid cards', async () => {
    const guard = creditCardLuhn({ action: 'block' });
    const result = await guard.check('Card: 4532015112830366', { pipelineType: 'input' });
    expect(result.score).toBe(1.0);
  });
});
