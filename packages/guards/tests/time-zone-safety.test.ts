import { describe, it, expect } from 'vitest';
import { timeZoneSafety } from '../src/time-zone-safety.js';

const ctx = { pipelineType: 'output' as const };

describe('time-zone-safety guard', () => {
  it('detects timestamp without timezone', async () => {
    const guard = timeZoneSafety({ action: 'block' });
    const result = await guard.check('Created at 2024-01-15T10:30:00 by admin', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects mixed timezone formats', async () => {
    const guard = timeZoneSafety({ action: 'warn' });
    const result = await guard.check('Meeting at UTC 10am, also scheduled for 3pm EST', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects new Date without timezone', async () => {
    const guard = timeZoneSafety({ action: 'block' });
    const result = await guard.check('new Date("2024-01-15")', ctx);
    expect(result.passed).toBe(false);
  });

  it('allows timestamp with Z suffix', async () => {
    const guard = timeZoneSafety({ action: 'block' });
    const result = await guard.check('Created at 2024-01-15T10:30:00Z', ctx);
    expect(result.passed).toBe(true);
  });

  it('allows timestamp with offset', async () => {
    const guard = timeZoneSafety({ action: 'block' });
    const result = await guard.check('Created at 2024-01-15T10:30:00+09:00', ctx);
    expect(result.passed).toBe(true);
  });

  it('allows plain text', async () => {
    const guard = timeZoneSafety({ action: 'block' });
    const result = await guard.check('The meeting is tomorrow morning', ctx);
    expect(result.passed).toBe(true);
  });
});
