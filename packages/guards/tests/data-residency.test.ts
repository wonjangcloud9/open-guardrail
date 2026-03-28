import { describe, it, expect } from 'vitest';
import { dataResidency } from '../src/data-residency.js';

describe('data-residency guard', () => {
  it('detects disallowed region', async () => {
    const guard = dataResidency({ action: 'block', allowedRegions: ['us-east-1'] });
    const result = await guard.check('Data stored in eu-west-1 region', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('allows configured region', async () => {
    const guard = dataResidency({ action: 'block', allowedRegions: ['us-east-1', 'us-east'] });
    const result = await guard.check('Data stored in us-east-1 region', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('detects cross-border transfer references', async () => {
    const guard = dataResidency({ action: 'warn', allowedRegions: ['us-east-1'] });
    const result = await guard.check('We need to transfer data to another country', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('allows clean text without region references', async () => {
    const guard = dataResidency({ action: 'block', allowedRegions: ['us-east-1'] });
    const result = await guard.check('Hello, process this request please', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('detects data center location mentions', async () => {
    const guard = dataResidency({ action: 'block', allowedRegions: ['ap-northeast-2'] });
    const result = await guard.check('Store in a Frankfurt data center', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('returns issues list in details', async () => {
    const guard = dataResidency({ action: 'block', allowedRegions: [] });
    const result = await guard.check('Deploy to us-east-1 and eu-west-1', { pipelineType: 'input' });
    expect(result.details).toBeDefined();
    expect((result.details as any).issues.length).toBeGreaterThanOrEqual(2);
  });
});
