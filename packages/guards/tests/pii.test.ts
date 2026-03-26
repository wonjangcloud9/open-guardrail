import { describe, it, expect } from 'vitest';
import { pii } from '../src/pii.js';

describe('pii guard', () => {
  it('detects email addresses', async () => {
    const guard = pii({ entities: ['email'], action: 'block' });
    const result = await guard.check('contact me at user@example.com', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.details?.detected).toContainEqual(expect.objectContaining({ type: 'email' }));
  });

  it('detects phone numbers', async () => {
    const guard = pii({ entities: ['phone'], action: 'block' });
    const result = await guard.check('call 010-1234-5678', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects credit card numbers', async () => {
    const guard = pii({ entities: ['credit-card'], action: 'block' });
    const result = await guard.check('card: 4111-1111-1111-1111', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('masks detected PII when action is mask', async () => {
    const guard = pii({ entities: ['email'], action: 'mask' });
    const result = await guard.check('email: user@example.com', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
    expect(result.action).toBe('override');
    expect(result.overrideText).toContain('[EMAIL]');
    expect(result.overrideText).not.toContain('user@example.com');
  });

  it('detects US passport number', async () => {
    const guard = pii({ entities: ['passport'], action: 'block' });
    const result = await guard.check('passport C12345678', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects driver license number', async () => {
    const guard = pii({ entities: ['driver-license'], action: 'block' });
    const result = await guard.check('license S123-4567-8901', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects ITIN', async () => {
    const guard = pii({ entities: ['itin'], action: 'block' });
    const result = await guard.check('ITIN: 912-78-1234', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects Medicare number', async () => {
    const guard = pii({ entities: ['medicare'], action: 'block' });
    const result = await guard.check('medicare 1EG4-TE5-MK72', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('masks passport correctly', async () => {
    const guard = pii({ entities: ['passport'], action: 'mask' });
    const result = await guard.check('passport C12345678', { pipelineType: 'input' });
    expect(result.overrideText).toContain('[PASSPORT]');
  });

  it('allows clean text', async () => {
    const guard = pii({ entities: ['email', 'phone'], action: 'block' });
    const result = await guard.check('hello world', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });
});
