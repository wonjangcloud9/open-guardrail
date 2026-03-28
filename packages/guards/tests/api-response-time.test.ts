import { describe, it, expect } from 'vitest';
import { apiResponseTime } from '../src/api-response-time.js';

describe('api-response-time', () => {
  it('allows normal response descriptions', async () => {
    const guard = apiResponseTime({ action: 'block' });
    const result = await guard.check('The API typically responds within 200ms.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('detects unrealistic instant response claims', async () => {
    const guard = apiResponseTime({ action: 'block' });
    const result = await guard.check('Our API provides instantaneous response for all queries.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects zero latency claims', async () => {
    const guard = apiResponseTime({ action: 'warn' });
    const result = await guard.check('The system has 0ms latency.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects unrealistic SLA claims', async () => {
    const guard = apiResponseTime({ action: 'block' });
    const result = await guard.check('We guarantee 100% uptime with zero downtime.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects never-fail claims', async () => {
    const guard = apiResponseTime({ action: 'block' });
    const result = await guard.check('Our server never goes down.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows realistic SLA descriptions', async () => {
    const guard = apiResponseTime({ action: 'block' });
    const result = await guard.check('We target 99.9% availability with a p99 latency of 500ms.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });
});
