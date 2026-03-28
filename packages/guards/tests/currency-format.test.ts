import { describe, it, expect } from 'vitest';
import { currencyFormat } from '../src/currency-format.js';

const ctx = { pipelineType: 'output' as const };

describe('currency-format guard', () => {
  it('detects mixed currency symbols', async () => {
    const guard = currencyFormat({ action: 'block' });
    const result = await guard.check('The price is $100 €200', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects too many decimal places', async () => {
    const guard = currencyFormat({ action: 'block' });
    const result = await guard.check('Total: $19.999', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects negative currency without parens', async () => {
    const guard = currencyFormat({ action: 'warn' });
    const result = await guard.check('Balance: -$50.00', ctx);
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('detects mismatched symbol and name', async () => {
    const guard = currencyFormat({ action: 'block' });
    const result = await guard.check('Price: $100 euros', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects symbol with code mismatch', async () => {
    const guard = currencyFormat({ action: 'block' });
    const result = await guard.check('USD $100 or EUR $200', ctx);
    expect(result.passed).toBe(false);
  });

  it('allows proper currency format', async () => {
    const guard = currencyFormat({ action: 'block' });
    const result = await guard.check('The total is $19.99', ctx);
    expect(result.passed).toBe(true);
  });

  it('allows text without currency', async () => {
    const guard = currencyFormat({ action: 'block' });
    const result = await guard.check('Hello world', ctx);
    expect(result.passed).toBe(true);
  });
});
