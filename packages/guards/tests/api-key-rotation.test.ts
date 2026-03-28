import { describe, it, expect } from 'vitest';
import { apiKeyRotation } from '../src/api-key-rotation.js';
const ctx = { pipelineType: 'input' as const };
describe('api-key-rotation', () => {
  it('detects "expired key" reference', async () => {
    const g = apiKeyRotation({ action: 'block' });
    const r = await g.check('The expired key should not be used', ctx);
    expect(r.passed).toBe(false);
  });
  it('detects "revoked token"', async () => {
    const g = apiKeyRotation({ action: 'block' });
    const r = await g.check('This revoked token is invalid', ctx);
    expect(r.passed).toBe(false);
  });
  it('detects "rotate this key"', async () => {
    const g = apiKeyRotation({ action: 'warn' });
    const r = await g.check('Please rotate this key immediately', ctx);
    expect(r.passed).toBe(false);
    expect(r.action).toBe('warn');
  });
  it('detects api_key = expired', async () => {
    const g = apiKeyRotation({ action: 'block' });
    const r = await g.check('api_key = "expired"', ctx);
    expect(r.passed).toBe(false);
  });
  it('allows normal text', async () => {
    const g = apiKeyRotation({ action: 'block' });
    const r = await g.check('Please use the latest API version', ctx);
    expect(r.passed).toBe(true);
  });
  it('has correct metadata', async () => {
    const g = apiKeyRotation({ action: 'block' });
    expect(g.name).toBe('api-key-rotation');
    expect(g.category).toBe('security');
  });
});
