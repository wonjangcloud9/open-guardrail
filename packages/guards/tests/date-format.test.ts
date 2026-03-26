import { describe, it, expect } from 'vitest';
import { dateFormat } from '../src/date-format.js';

const ctx = { pipelineType: 'output' as const };

describe('date-format guard', () => {
  it('detects ISO dates', async () => {
    const guard = dateFormat({ action: 'warn' });
    const result = await guard.check('Date: 2024-01-15', ctx);
    expect(result.details?.datesFound.length).toBeGreaterThan(0);
  });

  it('blocks non-allowed formats', async () => {
    const guard = dateFormat({ action: 'block', allowedFormats: ['ISO-8601'] });
    const result = await guard.check('Date: 01/15/2024', ctx);
    expect(result.passed).toBe(false);
  });

  it('allows correct format', async () => {
    const guard = dateFormat({ action: 'block', allowedFormats: ['ISO-8601'] });
    const result = await guard.check('Date: 2024-01-15', ctx);
    expect(result.passed).toBe(true);
  });

  it('detects Korean date format', async () => {
    const guard = dateFormat({ action: 'warn' });
    const result = await guard.check('날짜: 2024년 1월 15일', ctx);
    expect(result.details?.datesFound.length).toBeGreaterThan(0);
  });
});
