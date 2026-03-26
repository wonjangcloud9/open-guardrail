import { describe, it, expect } from 'vitest';
import { timeSensitive } from '../src/time-sensitive.js';
const ctx = { pipelineType: 'output' as const };
describe('time-sensitive', () => {
  it('detects "as of today"', async () => {
    expect((await timeSensitive({ action: 'warn' }).check('As of today the price is $50', ctx)).passed).toBe(false);
  });
  it('detects year references', async () => {
    expect((await timeSensitive({ action: 'warn' }).check('Recent studies show significant growth last year', ctx)).passed).toBe(false);
  });
  it('allows timeless text', async () => {
    expect((await timeSensitive({ action: 'block' }).check('Water boils at 100 degrees Celsius.', ctx)).passed).toBe(true);
  });
});
