import { describe, it, expect } from 'vitest';
import { agentLoopDetect } from '../src/agent-loop-detect.js';

describe('agent-loop-detect guard', () => {
  it('passes on unique messages', async () => {
    const guard = agentLoopDetect({ action: 'block', maxRepetitions: 3 });
    const r1 = await guard.check('Hello world', { pipelineType: 'input' });
    const r2 = await guard.check('Different message', { pipelineType: 'input' });
    expect(r1.passed).toBe(true);
    expect(r2.passed).toBe(true);
  });

  it('blocks after repeated similar messages', async () => {
    const guard = agentLoopDetect({ action: 'block', maxRepetitions: 2 });
    await guard.check('checking the status now', { pipelineType: 'output' });
    await guard.check('checking the status now', { pipelineType: 'output' });
    const r = await guard.check('checking the status now', { pipelineType: 'output' });
    expect(r.passed).toBe(false);
    expect(r.action).toBe('block');
    expect(r.details?.similarCount).toBeGreaterThanOrEqual(2);
  });

  it('detects similar but not identical messages', async () => {
    const guard = agentLoopDetect({ action: 'warn', maxRepetitions: 2, similarityThreshold: 0.6 });
    await guard.check('checking the database status for you now', { pipelineType: 'output' });
    await guard.check('checking the database status for you here', { pipelineType: 'output' });
    const r = await guard.check('checking the database status for you again', { pipelineType: 'output' });
    expect(r.action).toBe('warn');
  });

  it('has latencyMs field', async () => {
    const guard = agentLoopDetect({ action: 'block' });
    const r = await guard.check('test', { pipelineType: 'input' });
    expect(r.latencyMs).toBeGreaterThanOrEqual(0);
  });
});
