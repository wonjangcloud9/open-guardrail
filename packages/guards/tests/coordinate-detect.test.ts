import { describe, it, expect } from 'vitest';
import { coordinateDetect } from '../src/coordinate-detect.js';

describe('coordinate-detect guard', () => {
  it('detects decimal degree coordinates', async () => {
    const guard = coordinateDetect({ action: 'block' });
    const result = await guard.check('Location: 37.7749, -122.4194', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects DMS format', async () => {
    const guard = coordinateDetect({ action: 'block' });
    const result = await guard.check('Position: 40°26\'46"N', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects labeled latitude', async () => {
    const guard = coordinateDetect({ action: 'block' });
    const result = await guard.check('latitude: 37.7749', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects labeled longitude', async () => {
    const guard = coordinateDetect({ action: 'block' });
    const result = await guard.check('longitude = -122.4194', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('allows normal text', async () => {
    const guard = coordinateDetect({ action: 'block' });
    const result = await guard.check('Meet me at the cafe downtown', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('supports warn action', async () => {
    const guard = coordinateDetect({ action: 'warn' });
    const result = await guard.check('lat: 35.6762', { pipelineType: 'input' });
    expect(result.action).toBe('warn');
  });
});
