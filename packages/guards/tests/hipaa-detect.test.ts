import { describe, it, expect } from 'vitest';
import { hipaaDetect } from '../src/hipaa-detect.js';

describe('hipaa-detect guard', () => {
  it('passes clean text', async () => {
    const guard = hipaaDetect({ action: 'block' });
    const r = await guard.check('The weather is nice today', { pipelineType: 'output' });
    expect(r.passed).toBe(true);
  });

  it('detects medical record numbers', async () => {
    const guard = hipaaDetect({ action: 'block' });
    const r = await guard.check('Patient MRN: 123456789', { pipelineType: 'output' });
    expect(r.passed).toBe(false);
  });

  it('detects medication info', async () => {
    const guard = hipaaDetect({ action: 'warn' });
    const r = await guard.check('Prescribed medication: Metformin 500mg', { pipelineType: 'output' });
    expect(r.passed).toBe(false);
  });

  it('masks PHI in mask mode', async () => {
    const guard = hipaaDetect({ action: 'mask' });
    const r = await guard.check('MRN: 123456789 for patient', { pipelineType: 'output' });
    expect(r.passed).toBe(true);
    expect(r.action).toBe('override');
    expect(r.overrideText).toContain('[MRN]');
  });
});
