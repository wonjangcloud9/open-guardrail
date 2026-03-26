import { describe, it, expect } from 'vitest';
import { selfHarmDetect } from '../src/self-harm-detect.js';
const ctx = { pipelineType: 'input' as const };
describe('self-harm-detect', () => {
  it('detects self-harm language', async () => {
    const g = selfHarmDetect({ action: 'block' });
    const r = await g.check('I want to hurt myself', ctx);
    expect(r.passed).toBe(false);
    expect(r.details?.crisisResources).toBeDefined();
  });
  it('detects suicidal content', async () => {
    const g = selfHarmDetect({ action: 'block' });
    expect((await g.check('thinking about ending my life', ctx)).passed).toBe(false);
  });
  it('allows normal text', async () => {
    const g = selfHarmDetect({ action: 'block' });
    expect((await g.check('I love life and sunshine', ctx)).passed).toBe(true);
  });
  it('provides crisis resources', async () => {
    const g = selfHarmDetect({ action: 'warn' });
    const r = await g.check('I want to kill myself', ctx);
    expect(r.details?.crisisResources?.US).toContain('988');
    expect(r.details?.crisisResources?.KR).toContain('1393');
  });
});
