import { describe, it, expect } from 'vitest';
import { domainAllowlist } from '../src/domain-allowlist.js';

describe('domain-allowlist guard', () => {
  it('blocks denied domains', async () => {
    const guard = domainAllowlist({ action: 'block', deniedDomains: ['evil.com'] });
    const result = await guard.check('Visit https://evil.com/page', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('blocks domains not in allowlist', async () => {
    const guard = domainAllowlist({ action: 'block', allowedDomains: ['example.com'] });
    const result = await guard.check('Check https://other.com/api', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('passes allowed domains', async () => {
    const guard = domainAllowlist({ action: 'block', allowedDomains: ['example.com'] });
    const result = await guard.check('Visit https://example.com/docs', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('matches subdomains', async () => {
    const guard = domainAllowlist({ action: 'block', allowedDomains: ['example.com'] });
    const result = await guard.check('Visit https://api.example.com/v1', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('passes text without URLs', async () => {
    const guard = domainAllowlist({ action: 'block', allowedDomains: ['example.com'] });
    const result = await guard.check('No links here at all.', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('reports blocked domains in details', async () => {
    const guard = domainAllowlist({ action: 'block', deniedDomains: ['bad.com'] });
    const result = await guard.check('See https://bad.com/page', { pipelineType: 'input' });
    expect(result.details).toHaveProperty('blockedDomains');
  });
});
