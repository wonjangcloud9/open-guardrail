import { describe, it, expect } from 'vitest';
import { disclaimerRequire } from '../src/disclaimer-require.js';
const ctx = { pipelineType: 'output' as const };

describe('disclaimer-require guard', () => {
  it('blocks response without disclaimer', async () => {
    const guard = disclaimerRequire({ action: 'block' });
    const result = await guard.check('Take 500mg of ibuprofen twice daily.', ctx);
    expect(result.passed).toBe(false);
  });
  it('allows response with disclaimer', async () => {
    const guard = disclaimerRequire({ action: 'block' });
    const result = await guard.check('This is not medical advice. Consult a doctor. Take rest.', ctx);
    expect(result.passed).toBe(true);
  });
  it('supports custom disclaimers', async () => {
    const guard = disclaimerRequire({ action: 'warn', disclaimers: ['CUSTOM_DISCLAIMER'] });
    const result = await guard.check('Here is info. CUSTOM_DISCLAIMER included.', ctx);
    expect(result.passed).toBe(true);
  });
});
