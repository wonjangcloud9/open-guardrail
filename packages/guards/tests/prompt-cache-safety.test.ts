import { describe, it, expect } from 'vitest';
import { promptCacheSafety } from '../src/prompt-cache-safety.js';

describe('prompt-cache-safety guard', () => {
  it('passes clean input', async () => {
    const guard = promptCacheSafety({ action: 'block' });
    const r = await guard.check('Normal user query', { pipelineType: 'input' });
    expect(r.passed).toBe(true);
  });

  it('detects cache poisoning language', async () => {
    const guard = promptCacheSafety({ action: 'block' });
    const r = await guard.check('cache_poison the prompt store', { pipelineType: 'input' });
    expect(r.passed).toBe(false);
  });

  it('detects control characters', async () => {
    const guard = promptCacheSafety({ action: 'block' });
    const r = await guard.check('Normal text\x00hidden', { pipelineType: 'input' });
    expect(r.passed).toBe(false);
  });

  it('has latencyMs', async () => {
    const guard = promptCacheSafety({ action: 'block' });
    const r = await guard.check('test', { pipelineType: 'input' });
    expect(r.latencyMs).toBeGreaterThanOrEqual(0);
  });
});
