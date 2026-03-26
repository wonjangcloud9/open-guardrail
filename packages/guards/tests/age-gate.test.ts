import { describe, it, expect } from 'vitest';
import { ageGate } from '../src/age-gate.js';
const ctx = { pipelineType: 'input' as const };
describe('age-gate', () => {
  it('detects alcohol content', async () => {
    const g = ageGate({ action: 'block', topics: ['alcohol'] });
    expect((await g.check('Best vodka cocktail recipes', ctx)).passed).toBe(false);
  });
  it('detects gambling content', async () => {
    const g = ageGate({ action: 'block', topics: ['gambling'] });
    expect((await g.check('Win big at the casino', ctx)).passed).toBe(false);
  });
  it('detects Korean age-restricted terms', async () => {
    const g = ageGate({ action: 'block' });
    expect((await g.check('소주 한잔 하자', ctx)).passed).toBe(false);
  });
  it('allows clean text', async () => {
    const g = ageGate({ action: 'block' });
    expect((await g.check('The weather is nice today', ctx)).passed).toBe(true);
  });
});
