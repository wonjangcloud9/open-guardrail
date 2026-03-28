import { describe, it, expect } from 'vitest';
import { pciDssDetect } from '../src/pci-dss-detect.js';

describe('pci-dss-detect guard', () => {
  it('detects valid credit card number (Luhn)', async () => {
    const guard = pciDssDetect({ action: 'block' });
    const result = await guard.check('My card is 4532015112830366', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
    expect(result.details?.violations).toContain('credit_card_number');
  });

  it('detects CVV patterns', async () => {
    const guard = pciDssDetect({ action: 'warn' });
    const result = await guard.check('CVV: 123', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.details?.violations).toContain('cvv_exposed');
  });

  it('detects card expiry dates', async () => {
    const guard = pciDssDetect({ action: 'block' });
    const result = await guard.check('Expiry: 12/2025', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.details?.violations).toContain('card_expiry');
  });

  it('detects unencrypted storage mentions', async () => {
    const guard = pciDssDetect({ action: 'block' });
    const result = await guard.check('store credit card in plain text database', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.details?.violations).toContain('unencrypted_storage');
  });

  it('masks card numbers when maskCards is true', async () => {
    const guard = pciDssDetect({ action: 'warn', maskCards: true });
    const result = await guard.check('Card: 4532015112830366', { pipelineType: 'output' });
    expect(result.overrideText).toContain('****');
    expect(result.overrideText).not.toContain('4532015112830366');
  });

  it('allows normal text without card data', async () => {
    const guard = pciDssDetect({ action: 'block' });
    const result = await guard.check('The total amount is $50.00', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
    expect(result.action).toBe('allow');
  });

  it('rejects invalid Luhn numbers', async () => {
    const guard = pciDssDetect({ action: 'block' });
    const result = await guard.check('Number: 1234567890123456', { pipelineType: 'output' });
    // 1234567890123456 fails Luhn check
    expect(result.details?.violations ?? []).not.toContain('credit_card_number');
  });
});
