import { describe, it, expect } from 'vitest';
import { ssnDetect } from '../src/ssn-detect.js';

describe('ssn-detect guard', () => {
  it('detects valid SSN', async () => {
    const guard = ssnDetect({ action: 'block' });
    const result = await guard.check('SSN: 123-45-6789', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('rejects SSN starting with 000', async () => {
    const guard = ssnDetect({ action: 'block' });
    const result = await guard.check('SSN: 000-45-6789', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('rejects SSN starting with 666', async () => {
    const guard = ssnDetect({ action: 'block' });
    const result = await guard.check('SSN: 666-45-6789', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('rejects SSN starting with 9XX', async () => {
    const guard = ssnDetect({ action: 'block' });
    const result = await guard.check('SSN: 900-45-6789', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('allows normal text', async () => {
    const guard = ssnDetect({ action: 'block' });
    const result = await guard.check('Please verify your identity', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('returns count in details', async () => {
    const guard = ssnDetect({ action: 'block' });
    const result = await guard.check('SSN: 123-45-6789', { pipelineType: 'input' });
    expect(result.details?.ssnCount).toBe(1);
  });

  it('supports warn action', async () => {
    const guard = ssnDetect({ action: 'warn' });
    const result = await guard.check('SSN: 234-56-7890', { pipelineType: 'input' });
    expect(result.action).toBe('warn');
  });
});
