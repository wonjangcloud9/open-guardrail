import { describe, it, expect } from 'vitest';
import { deanonymize } from '../src/deanonymize.js';

const ctx = { pipelineType: 'output' as const };

describe('deanonymize guard', () => {
  it('detects leaked [EMAIL] label', async () => {
    const guard = deanonymize({ action: 'warn' });
    const result = await guard.check('Contact us at [EMAIL] for help', ctx);
    expect(result.passed).toBe(false);
    expect(result.details?.leakedLabels).toContain('[EMAIL]');
  });

  it('detects leaked Korean PII labels', async () => {
    const guard = deanonymize({ action: 'block' });
    const result = await guard.check('주민번호: [주민등록번호]', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects leaked Japanese PII labels', async () => {
    const guard = deanonymize({ action: 'block' });
    const result = await guard.check('番号: [マイナンバー]', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects leaked Chinese PII labels', async () => {
    const guard = deanonymize({ action: 'block' });
    const result = await guard.check('号码: [身份证号]', ctx);
    expect(result.passed).toBe(false);
  });

  it('allows clean text', async () => {
    const guard = deanonymize({ action: 'block' });
    const result = await guard.check('Hello, how can I help you?', ctx);
    expect(result.passed).toBe(true);
  });

  it('supports custom labels', async () => {
    const guard = deanonymize({ action: 'warn', labels: ['[CUSTOM_PII]'] });
    const result = await guard.check('Value: [CUSTOM_PII]', ctx);
    expect(result.passed).toBe(false);
  });
});
