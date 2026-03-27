import { describe, it, expect } from 'vitest';
import { tokenEfficiency } from '../src/token-efficiency.js';

describe('token-efficiency guard', () => {
  it('passes concise text', async () => {
    const guard = tokenEfficiency({ action: 'warn' });
    const r = await guard.check('The API returns a JSON response with user data.', { pipelineType: 'output' });
    expect(r.passed).toBe(true);
  });

  it('warns on filler-heavy text', async () => {
    const guard = tokenEfficiency({ action: 'warn', minDensity: 0.8 });
    const r = await guard.check('basically actually literally obviously clearly certainly definitely honestly really very quite just like you know', { pipelineType: 'output' });
    expect(r.passed).toBe(false);
  });

  it('has score', async () => {
    const guard = tokenEfficiency({ action: 'warn' });
    const r = await guard.check('Hello world', { pipelineType: 'output' });
    expect(r.score).toBeDefined();
  });
});
