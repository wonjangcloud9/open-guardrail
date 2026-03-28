import { describe, it, expect } from 'vitest';
import { biasGender } from '../src/bias-gender.js';
const ctx = { pipelineType: 'output' as const };
describe('bias-gender', () => {
  it('detects gendered job titles', async () => {
    const g = biasGender({ action: 'warn' });
    const r = await g.check('The chairman will decide.', ctx);
    expect(r.passed).toBe(false);
    expect(r.details?.issues?.[0]).toContain('chairperson');
  });
  it('detects stereotype patterns', async () => {
    const g = biasGender({ action: 'block' });
    expect((await g.check('Women should stay home.', ctx)).passed).toBe(false);
  });
  it('detects man up pattern', async () => {
    const g = biasGender({ action: 'warn' });
    expect((await g.check('Just man up and deal with it.', ctx)).passed).toBe(false);
  });
  it('detects fireman', async () => {
    const g = biasGender({ action: 'warn' });
    const r = await g.check('The fireman arrived quickly.', ctx);
    expect(r.passed).toBe(false);
  });
  it('allows gender-neutral text', async () => {
    const g = biasGender({ action: 'block' });
    expect((await g.check('The chairperson opened the meeting.', ctx)).passed).toBe(true);
  });
  it('allows neutral professional text', async () => {
    const g = biasGender({ action: 'block' });
    expect((await g.check('All candidates are evaluated equally.', ctx)).passed).toBe(true);
  });
});
