import { describe, it, expect } from 'vitest';
import { dateAccuracy } from '../src/date-accuracy.js';

describe('date-accuracy guard', () => {
  it('detects impossible date Feb 30', async () => {
    const guard = dateAccuracy({ action: 'block' });
    const result = await guard.check('The event is on 2024-02-30.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects month 13', async () => {
    const guard = dateAccuracy({ action: 'warn' });
    const result = await guard.check('Date: 2024-13-01 is correct.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects far future dates', async () => {
    const guard = dateAccuracy({ action: 'warn' });
    const result = await guard.check('The report from 2045-06-15 shows.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows valid dates', async () => {
    const guard = dateAccuracy({ action: 'block' });
    const result = await guard.check('The event happened on 2024-03-15.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('allows text without dates', async () => {
    const guard = dateAccuracy({ action: 'block' });
    const result = await guard.check('Hello, this is a simple response.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('detects Feb 29 in non-leap year', async () => {
    const guard = dateAccuracy({ action: 'block' });
    const result = await guard.check('The date is 2023-02-29.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows Feb 29 in leap year', async () => {
    const guard = dateAccuracy({ action: 'block' });
    const result = await guard.check('The date is 2024-02-29.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });
});
