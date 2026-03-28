import { describe, it, expect } from 'vitest';
import { idempotentResponse } from '../src/idempotent-response.js';

describe('idempotent-response guard', () => {
  it('detects ISO timestamps', async () => {
    const guard = idempotentResponse({ action: 'warn' });
    const result = await guard.check('The current time is 2024-03-15T14:30:00Z.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects "just now" temporal references', async () => {
    const guard = idempotentResponse({ action: 'block' });
    const result = await guard.check('I just now checked and the data is available.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects UUID strings', async () => {
    const guard = idempotentResponse({ action: 'warn' });
    const result = await guard.check('Your session ID is 550e8400-e29b-41d4-a716-446655440000.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows static factual responses', async () => {
    const guard = idempotentResponse({ action: 'block' });
    const result = await guard.check('The capital of France is Paris. It has been since 1944.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('detects "right now" references', async () => {
    const guard = idempotentResponse({ action: 'warn' });
    const result = await guard.check('Right now the server is running.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects random number indicators', async () => {
    const guard = idempotentResponse({ action: 'warn' });
    const result = await guard.check('Your random: 47382 has been generated.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('returns score within valid range', async () => {
    const guard = idempotentResponse({ action: 'warn' });
    const result = await guard.check('Right now at 2024-03-15T10:00:00Z, ID: 550e8400-e29b-41d4-a716-446655440000', { pipelineType: 'output' });
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });
});
