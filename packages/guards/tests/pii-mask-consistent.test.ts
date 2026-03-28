import { describe, it, expect } from 'vitest';
import { piiMaskConsistent } from '../src/pii-mask-consistent.js';

describe('pii-mask-consistent guard', () => {
  it('passes clean text with no masks', async () => {
    const guard = piiMaskConsistent({ action: 'warn' });
    const result = await guard.check('Hello world, this is a test.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('passes consistently masked text', async () => {
    const guard = piiMaskConsistent({ action: 'warn' });
    const result = await guard.check('Contact [EMAIL] or [PHONE] for info.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('detects partial masking patterns', async () => {
    const guard = piiMaskConsistent({ action: 'warn' });
    const result = await guard.check('User Jo**n Do** sent a message', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects length-revealing masks', async () => {
    const guard = piiMaskConsistent({ action: 'block' });
    const result = await guard.check('Name: [NAME:4] Phone: [PHONE:10]', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('detects overlapping mask types', async () => {
    const guard = piiMaskConsistent({ action: 'warn' });
    const result = await guard.check('Contact [EMAIL] and [EMAIL_ADDRESS] here', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('returns score based on issue count', async () => {
    const guard = piiMaskConsistent({ action: 'warn' });
    const result = await guard.check('User Jo**n has [NAME:4]', { pipelineType: 'output' });
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it('has correct guard metadata', () => {
    const guard = piiMaskConsistent({ action: 'warn' });
    expect(guard.name).toBe('pii-mask-consistent');
    expect(guard.category).toBe('privacy');
  });
});
