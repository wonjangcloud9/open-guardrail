import { describe, it, expect } from 'vitest';
import { medicalAdvice } from '../src/medical-advice.js';
const ctx = { pipelineType: 'output' as const };
describe('medical-advice', () => {
  it('detects dosage advice', async () => {
    const g = medicalAdvice({ action: 'block' });
    expect((await g.check('Take 500mg of ibuprofen twice daily', ctx)).passed).toBe(false);
  });
  it('detects diagnosis', async () => {
    const g = medicalAdvice({ action: 'warn' });
    expect((await g.check('You probably have a thyroid disorder', ctx)).passed).toBe(false);
  });
  it('allows general health info', async () => {
    const g = medicalAdvice({ action: 'block' });
    expect((await g.check('Exercise and a balanced diet are important for health.', ctx)).passed).toBe(true);
  });
});
