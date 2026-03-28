import { describe, it, expect } from 'vitest';
import { ipAddressDetect } from '../src/ip-address-detect.js';

describe('ip-address-detect guard', () => {
  it('detects public IPv4', async () => {
    const guard = ipAddressDetect({ action: 'block' });
    const result = await guard.check('Server at 203.0.113.50', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('allows private IP by default', async () => {
    const guard = ipAddressDetect({ action: 'block' });
    const result = await guard.check('Connect to 192.168.1.1', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('detects private IP when allowPrivate false', async () => {
    const guard = ipAddressDetect({ action: 'block', allowPrivate: false });
    const result = await guard.check('Connect to 192.168.1.1', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('allows localhost by default', async () => {
    const guard = ipAddressDetect({ action: 'block' });
    const result = await guard.check('Listening on 127.0.0.1', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('allows normal text', async () => {
    const guard = ipAddressDetect({ action: 'block' });
    const result = await guard.check('The server is running fine', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('supports warn action', async () => {
    const guard = ipAddressDetect({ action: 'warn' });
    const result = await guard.check('IP: 8.8.8.8', { pipelineType: 'input' });
    expect(result.action).toBe('warn');
  });

  it('returns ip count in details', async () => {
    const guard = ipAddressDetect({ action: 'block' });
    const result = await guard.check('Servers: 8.8.8.8 and 1.1.1.1', { pipelineType: 'input' });
    expect(result.details?.ipCount).toBe(2);
  });
});
