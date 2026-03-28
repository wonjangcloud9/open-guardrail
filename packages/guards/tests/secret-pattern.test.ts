import { describe, it, expect } from 'vitest';
import { secretPattern } from '../src/secret-pattern.js';

const ctx = { pipelineType: 'input' as const };

describe('secret-pattern guard', () => {
  it('detects environment variable secrets', async () => {
    const guard = secretPattern({ action: 'block' });
    const result = await guard.check('API_KEY=sk_live_abc123def456', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects connection strings', async () => {
    const guard = secretPattern({ action: 'block' });
    const result = await guard.check('mongodb://testuser:testpw@localhost:27017/testdb', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects private keys', async () => {
    const guard = secretPattern({ action: 'block' });
    const result = await guard.check('-----BEGIN RSA PRIVATE KEY-----', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects bearer tokens', async () => {
    const guard = secretPattern({ action: 'block' });
    const result = await guard.check('Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIx', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects webhook URLs', async () => {
    const guard = secretPattern({ action: 'block' });
    const result = await guard.check('https://hooks.slack.com/services/T00/B00/xxxx', ctx);
    expect(result.passed).toBe(false);
  });

  it('masks secrets correctly', async () => {
    const guard = secretPattern({ action: 'mask' });
    const result = await guard.check('TOKEN=my_secret_token_value_here', ctx);
    expect(result.passed).toBe(true);
    expect(result.action).toBe('override');
    expect(result.overrideText).toContain('[ENV_SECRET]');
  });

  it('filters by specific types', async () => {
    const guard = secretPattern({ action: 'block', types: ['private-key'] });
    const result = await guard.check('API_KEY=sk_live_abc123def456', ctx);
    expect(result.passed).toBe(true);
  });

  it('allows clean text', async () => {
    const guard = secretPattern({ action: 'block' });
    const result = await guard.check('Hello, how can I help you today?', ctx);
    expect(result.passed).toBe(true);
  });
});
