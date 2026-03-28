import { describe, it, expect } from 'vitest';
import { inputLengthAnomaly } from '../src/input-length-anomaly.js';
const ctx = { pipelineType: 'input' as const };
describe('input-length-anomaly', () => {
  it('detects too-short input', async () => {
    const g = inputLengthAnomaly({ action: 'block' });
    const r = await g.check('hi', ctx);
    expect(r.passed).toBe(false);
    expect(r.details?.issues).toContain('too-short');
  });
  it('detects too-long input', async () => {
    const g = inputLengthAnomaly({ action: 'warn', maxLength: 100 });
    const r = await g.check('a'.repeat(200), ctx);
    expect(r.passed).toBe(false);
    expect(r.action).toBe('warn');
  });
  it('allows normal length input', async () => {
    const g = inputLengthAnomaly({ action: 'block' });
    expect((await g.check('What is the weather today?', ctx)).passed).toBe(true);
  });
  it('respects custom minLength', async () => {
    const g = inputLengthAnomaly({ action: 'block', minLength: 10 });
    expect((await g.check('short', ctx)).passed).toBe(false);
    expect((await g.check('this is long enough text', ctx)).passed).toBe(true);
  });
  it('respects custom maxLength', async () => {
    const g = inputLengthAnomaly({ action: 'block', maxLength: 20 });
    expect((await g.check('this text is definitely too long for the limit', ctx)).passed).toBe(false);
  });
});
