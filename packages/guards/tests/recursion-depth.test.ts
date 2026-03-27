import { describe, it, expect } from 'vitest';
import { recursionDepth } from '../src/recursion-depth.js';

describe('recursion-depth guard', () => {
  it('passes within depth limit', async () => {
    const guard = recursionDepth({ action: 'block', maxDepth: 5 });
    const r = await guard.check(JSON.stringify({ depth: 3 }), { pipelineType: 'input' });
    expect(r.passed).toBe(true);
    expect(r.action).toBe('allow');
  });

  it('blocks when depth exceeds limit', async () => {
    const guard = recursionDepth({ action: 'block', maxDepth: 3 });
    const r = await guard.check(JSON.stringify({ depth: 4 }), { pipelineType: 'input' });
    expect(r.passed).toBe(false);
    expect(r.action).toBe('block');
    expect(r.details?.currentDepth).toBe(4);
  });

  it('detects delegation keywords', async () => {
    const guard = recursionDepth({ action: 'warn', maxDepth: 2 });
    const text = 'Delegating to sub_agent for sub_task processing via agent_call and dispatch';
    const r = await guard.check(text, { pipelineType: 'output' });
    expect(r.passed).toBe(false);
  });

  it('reads custom depth field', async () => {
    const guard = recursionDepth({ action: 'block', maxDepth: 2, depthField: 'nesting' });
    const r = await guard.check(JSON.stringify({ nesting: 3 }), { pipelineType: 'input' });
    expect(r.passed).toBe(false);
  });

  it('has latencyMs field', async () => {
    const guard = recursionDepth({ action: 'block' });
    const r = await guard.check('test', { pipelineType: 'input' });
    expect(r.latencyMs).toBeGreaterThanOrEqual(0);
  });
});
