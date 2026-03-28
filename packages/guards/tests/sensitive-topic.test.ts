import { describe, it, expect } from 'vitest';
import { sensitiveTopic } from '../src/sensitive-topic.js';
const ctx = { pipelineType: 'input' as const };
describe('sensitive-topic', () => {
  it('detects religion topic', async () => {
    const g = sensitiveTopic({ action: 'warn' });
    expect((await g.check('The church held a prayer service', ctx)).passed).toBe(false);
  });
  it('detects politics topic', async () => {
    const g = sensitiveTopic({ action: 'warn' });
    expect((await g.check('The election results were surprising', ctx)).passed).toBe(false);
  });
  it('detects mental health topic', async () => {
    const g = sensitiveTopic({ action: 'warn' });
    expect((await g.check('depression and anxiety are common', ctx)).passed).toBe(false);
  });
  it('allows neutral text', async () => {
    const g = sensitiveTopic({ action: 'block' });
    expect((await g.check('The weather is nice today', ctx)).passed).toBe(true);
  });
  it('respects topics filter', async () => {
    const g = sensitiveTopic({ action: 'warn', topics: ['religion'] });
    expect((await g.check('The election was controversial', ctx)).passed).toBe(true);
  });
  it('detects multiple topics', async () => {
    const g = sensitiveTopic({ action: 'warn' });
    const r = await g.check('Religious terrorism and political extremism', ctx);
    expect(r.passed).toBe(false);
    expect(r.details?.topics.length).toBeGreaterThanOrEqual(2);
  });
  it('returns warn action', async () => {
    const g = sensitiveTopic({ action: 'warn' });
    const r = await g.check('depression and anxiety resources', ctx);
    expect(r.action).toBe('warn');
  });
});
