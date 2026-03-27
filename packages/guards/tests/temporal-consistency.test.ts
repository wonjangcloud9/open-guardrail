import { describe, it, expect } from 'vitest';
import { temporalConsistency } from '../src/temporal-consistency.js';

describe('temporal-consistency guard', () => {
  it('passes valid year reference', async () => {
    const guard = temporalConsistency({ action: 'block', currentYear: 2026 });
    const r = await guard.check('In 2025 the event happened', { pipelineType: 'output' });
    expect(r.passed).toBe(true);
  });
  it('blocks far future year reference', async () => {
    const guard = temporalConsistency({ action: 'block', currentYear: 2026 });
    const r = await guard.check('In 2050 this will happen', { pipelineType: 'output' });
    expect(r.passed).toBe(false);
  });
});
