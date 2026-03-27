import { describe, it, expect } from 'vitest';
import { toolAbuse } from '../src/tool-abuse.js';

describe('tool-abuse guard', () => {
  it('passes non-tool-call text', async () => {
    const guard = toolAbuse({ action: 'block' });
    const r = await guard.check('Just a regular message', { pipelineType: 'output' });
    expect(r.passed).toBe(true);
    expect(r.action).toBe('allow');
  });

  it('passes normal tool call rate', async () => {
    const guard = toolAbuse({ action: 'block', maxCallsInWindow: 5 });
    const call = JSON.stringify({ tool: 'search', args: { query: 'test' } });
    const r = await guard.check(call, { pipelineType: 'output' });
    expect(r.passed).toBe(true);
  });

  it('blocks excessive same-tool calls', async () => {
    const guard = toolAbuse({ action: 'block', maxSameToolCalls: 2 });
    const call = JSON.stringify({ tool: 'delete', args: { id: '1' } });
    await guard.check(call, { pipelineType: 'output' });
    await guard.check(call, { pipelineType: 'output' });
    const r = await guard.check(call, { pipelineType: 'output' });
    expect(r.passed).toBe(false);
    expect(r.details?.violations).toBeDefined();
  });

  it('blocks denied sequences', async () => {
    const guard = toolAbuse({
      action: 'block',
      maxCallsInWindow: 100,
      maxSameToolCalls: 100,
      denySequences: [['read', 'delete']],
    });
    await guard.check(JSON.stringify({ tool: 'read', args: {} }), { pipelineType: 'output' });
    const r = await guard.check(JSON.stringify({ tool: 'delete', args: {} }), { pipelineType: 'output' });
    expect(r.passed).toBe(false);
    expect(r.details?.violations?.some((v: string) => v.includes('Denied sequence'))).toBe(true);
  });

  it('has latencyMs field', async () => {
    const guard = toolAbuse({ action: 'block' });
    const r = await guard.check('test', { pipelineType: 'output' });
    expect(r.latencyMs).toBeGreaterThanOrEqual(0);
  });
});
