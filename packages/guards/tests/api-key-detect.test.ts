import { describe, it, expect } from 'vitest';
import { apiKeyDetect } from '../src/api-key-detect.js';

const ctx = { pipelineType: 'output' as const };

describe('apiKeyDetect', () => {
  const guard = apiKeyDetect({ action: 'block' });

  it('allows text without keys', async () => {
    const r = await guard.check('Here is a helpful response about machine learning.', ctx);
    expect(r.passed).toBe(true);
    expect(r.action).toBe('allow');
  });

  it('detects OpenAI API key', async () => {
    const r = await guard.check('Your API key is sk-abcdefghijklmnopqrstuvwxyz1234567890', ctx);
    expect(r.passed).toBe(false);
    expect(r.action).toBe('block');
    expect(r.details?.findings).toContainEqual(expect.objectContaining({ type: 'openai' }));
  });

  it('detects Anthropic API key', async () => {
    const r = await guard.check('Use this key: sk-ant-api03-abcdefghijklmnopqrstuvwxyz', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects AWS access key', async () => {
    const r = await guard.check('AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects GitHub token', async () => {
    const r = await guard.check('ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmn', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects Google API key', async () => {
    const r = await guard.check('key=AIzaSyA1234567890abcdefghijklmnopqrstuvw', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects Stripe key', async () => {
    // Use sk_test_ prefix to avoid GitHub push protection false positive
    const r = await guard.check('sk_test_' + 'aB3dEfGhIjKlMnOpQrStUvWx12', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects JWT token', async () => {
    const r = await guard.check('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.abc123def456ghi789', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects generic api_key pattern', async () => {
    const r = await guard.check('api_key: "my_super_secret_key_12345678"', ctx);
    expect(r.passed).toBe(false);
  });

  it('masks keys in override mode', async () => {
    const maskGuard = apiKeyDetect({ action: 'override' });
    const r = await maskGuard.check('Key: sk-abcdefghijklmnopqrstuvwxyz1234567890', ctx);
    expect(r.passed).toBe(true);
    expect(r.action).toBe('override');
    expect(r.overrideText).toContain('[OPENAI_KEY]');
    expect(r.overrideText).not.toContain('sk-');
  });

  it('respects warn action', async () => {
    const warnGuard = apiKeyDetect({ action: 'warn' });
    const r = await warnGuard.check('ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmn', ctx);
    expect(r.action).toBe('warn');
  });

  it('supports extra patterns', async () => {
    const custom = apiKeyDetect({ action: 'block', extraPatterns: [/CUSTOM-[A-Z]{10,}/g] });
    const r = await custom.check('Token: CUSTOM-ABCDEFGHIJKLMNOP', ctx);
    expect(r.passed).toBe(false);
  });
});
