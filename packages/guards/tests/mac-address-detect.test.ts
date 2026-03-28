import { describe, it, expect } from 'vitest';
import { macAddressDetect } from '../src/mac-address-detect.js';

describe('mac-address-detect guard', () => {
  it('detects colon-separated MAC', async () => {
    const guard = macAddressDetect({ action: 'block' });
    const result = await guard.check('MAC: 00:1A:2B:3C:4D:5E', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects dash-separated MAC', async () => {
    const guard = macAddressDetect({ action: 'block' });
    const result = await guard.check('Device: 00-1A-2B-3C-4D-5E', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('allows normal text', async () => {
    const guard = macAddressDetect({ action: 'block' });
    const result = await guard.check('Network is configured', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('returns mac count', async () => {
    const guard = macAddressDetect({ action: 'block' });
    const result = await guard.check('MAC: 00:1A:2B:3C:4D:5E', { pipelineType: 'input' });
    expect(result.details?.macCount).toBe(1);
  });

  it('supports warn action', async () => {
    const guard = macAddressDetect({ action: 'warn' });
    const result = await guard.check('MAC: AA:BB:CC:DD:EE:FF', { pipelineType: 'input' });
    expect(result.action).toBe('warn');
  });

  it('detects lowercase MAC', async () => {
    const guard = macAddressDetect({ action: 'block' });
    const result = await guard.check('mac: aa:bb:cc:dd:ee:ff', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });
});
