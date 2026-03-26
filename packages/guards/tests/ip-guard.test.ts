import { describe, it, expect } from 'vitest';
import { ipGuard } from '../src/ip-guard.js';

const ctx = { pipelineType: 'input' as const };

describe('ip-guard', () => {
  it('detects IPv4 address', async () => {
    const guard = ipGuard({ action: 'block' });
    const result = await guard.check('Server at 192.168.1.100', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects private IP addresses', async () => {
    const guard = ipGuard({ action: 'block' });
    const result = await guard.check('Internal: 10.0.0.1', ctx);
    expect(result.passed).toBe(false);
    expect(result.details?.detected[0].isPrivate).toBe(true);
  });

  it('skips private IPs when detectPrivate is false', async () => {
    const guard = ipGuard({ action: 'block', detectPrivate: false });
    const result = await guard.check('Server: 192.168.1.1', ctx);
    expect(result.passed).toBe(true);
  });

  it('respects allowList', async () => {
    const guard = ipGuard({ action: 'block', allowList: ['8.8.8.8'] });
    const result = await guard.check('DNS: 8.8.8.8', ctx);
    expect(result.passed).toBe(true);
  });

  it('masks IP addresses', async () => {
    const guard = ipGuard({ action: 'mask' });
    const result = await guard.check('Server at 10.0.0.1', ctx);
    expect(result.passed).toBe(true);
    expect(result.overrideText).toContain('[IP_ADDRESS]');
    expect(result.overrideText).not.toContain('10.0.0.1');
  });

  it('allows clean text without IPs', async () => {
    const guard = ipGuard({ action: 'block' });
    const result = await guard.check('The server is running fine', ctx);
    expect(result.passed).toBe(true);
  });

  it('rejects invalid IP octets', async () => {
    const guard = ipGuard({ action: 'block' });
    const result = await guard.check('Value is 999.999.999.999', ctx);
    expect(result.passed).toBe(true);
  });
});
