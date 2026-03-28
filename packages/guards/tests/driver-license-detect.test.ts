import { describe, it, expect } from 'vitest';
import { driverLicenseDetect } from '../src/driver-license-detect.js';

describe('driver-license-detect guard', () => {
  it('detects CA/NY format', async () => {
    const guard = driverLicenseDetect({ action: 'block' });
    const result = await guard.check('DL: A1234567', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects WA format', async () => {
    const guard = driverLicenseDetect({ action: 'block' });
    const result = await guard.check('License: A123-4567-8901', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects numeric-only state format', async () => {
    const guard = driverLicenseDetect({ action: 'block' });
    const result = await guard.check('DL number: 12345678', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('allows normal text', async () => {
    const guard = driverLicenseDetect({ action: 'block' });
    const result = await guard.check('I have a valid license to drive', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('supports warn action', async () => {
    const guard = driverLicenseDetect({ action: 'warn' });
    const result = await guard.check('DL: A1234567', { pipelineType: 'input' });
    expect(result.action).toBe('warn');
  });
});
