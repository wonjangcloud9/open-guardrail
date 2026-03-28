import { describe, it, expect } from 'vitest';
import { contentPolicy } from '../src/content-policy.js';
const ctx = { pipelineType: 'output' as const };
describe('content-policy', () => {
  it('detects unauthorized advice', async () => {
    const g = contentPolicy({ action: 'block' });
    expect((await g.check('You should always invest in crypto', ctx)).passed).toBe(false);
  });
  it('detects unlicensed practice claims', async () => {
    const g = contentPolicy({ action: 'block' });
    expect((await g.check('I am a licensed doctor and recommend this', ctx)).passed).toBe(false);
  });
  it('detects guaranteed results', async () => {
    const g = contentPolicy({ action: 'warn' });
    const r = await g.check('Guaranteed results in 3 days', ctx);
    expect(r.passed).toBe(false);
    expect(r.action).toBe('warn');
  });
  it('detects no risk claims', async () => {
    const g = contentPolicy({ action: 'block' });
    expect((await g.check('There is no risk whatsoever', ctx)).passed).toBe(false);
  });
  it('allows compliant content', async () => {
    const g = contentPolicy({ action: 'block' });
    expect((await g.check('Please consult a professional for advice.', ctx)).passed).toBe(true);
  });
  it('supports custom rules', async () => {
    const g = contentPolicy({ action: 'block', rules: ['free\\s+money'] });
    expect((await g.check('Get free money now', ctx)).passed).toBe(false);
    expect((await g.check('Normal text here', ctx)).passed).toBe(true);
  });
});
