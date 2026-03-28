import { describe, it, expect } from 'vitest';
import { vehicleIdDetect } from '../src/vehicle-id-detect.js';

describe('vehicle-id-detect guard', () => {
  it('detects valid VIN', async () => {
    const guard = vehicleIdDetect({ action: 'block' });
    const result = await guard.check('VIN: 1HGCM82633A004352', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('rejects VIN with I, O, Q characters', async () => {
    const guard = vehicleIdDetect({ action: 'block' });
    const result = await guard.check('VIN: 1HGIM82633A004352', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('allows normal text', async () => {
    const guard = vehicleIdDetect({ action: 'block' });
    const result = await guard.check('I bought a new car yesterday', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('returns vin count', async () => {
    const guard = vehicleIdDetect({ action: 'block' });
    const result = await guard.check('VIN: 1HGCM82633A004352', { pipelineType: 'input' });
    expect(result.details?.vinCount).toBe(1);
  });

  it('supports warn action', async () => {
    const guard = vehicleIdDetect({ action: 'warn' });
    const result = await guard.check('VIN: 1HGCM82633A004352', { pipelineType: 'input' });
    expect(result.action).toBe('warn');
  });
});
