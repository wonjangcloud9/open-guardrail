import { describe, it, expect } from 'vitest';
import { toneProfessional } from '../src/tone-professional.js';
const ctx = { pipelineType: 'output' as const };
describe('tone-professional', () => {
  it('detects informal language', async () => {
    const g = toneProfessional({ action: 'warn' });
    expect((await g.check('lol that is so funny tbh', ctx)).passed).toBe(false);
  });
  it('detects excessive exclamation marks', async () => {
    const g = toneProfessional({ action: 'warn', maxExclamations: 2 });
    expect((await g.check('Great! Amazing! Wow! Fantastic!', ctx)).passed).toBe(false);
  });
  it('allows normal exclamation count', async () => {
    const g = toneProfessional({ action: 'warn', maxExclamations: 2 });
    expect((await g.check('Great job! Well done!', ctx)).passed).toBe(true);
  });
  it('detects ALL CAPS shouting', async () => {
    const g = toneProfessional({ action: 'warn' });
    expect((await g.check('This is ABSOLUTELY WRONG', ctx)).passed).toBe(false);
  });
  it('allows professional text', async () => {
    const g = toneProfessional({ action: 'block' });
    expect((await g.check('Please review the attached document at your convenience.', ctx)).passed).toBe(true);
  });
  it('returns warn action when configured', async () => {
    const g = toneProfessional({ action: 'warn' });
    const r = await g.check('omg this is so lit dude', ctx);
    expect(r.action).toBe('warn');
  });
});
