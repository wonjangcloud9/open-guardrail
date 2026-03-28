import { describe, it, expect } from 'vitest';
import { contentWatermark } from '../src/content-watermark.js';

describe('content-watermark guard', () => {
  it('embeds watermark in output text', async () => {
    const guard = contentWatermark({ action: 'allow', watermarkId: 'test-123' });
    const result = await guard.check('Hello world', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
    expect(result.overrideText).toBeDefined();
    expect(result.overrideText!.length).toBeGreaterThan('Hello world'.length);
    expect(result.details?.embedded).toBe(true);
  });

  it('verifies existing watermark', async () => {
    const embedGuard = contentWatermark({ action: 'allow', watermarkId: 'abc' });
    const embedResult = await embedGuard.check('Test content', { pipelineType: 'output' });

    const verifyGuard = contentWatermark({ action: 'warn', watermarkId: 'abc', verifyOnly: true });
    const verifyResult = await verifyGuard.check(embedResult.overrideText!, { pipelineType: 'output' });
    expect(verifyResult.passed).toBe(true);
    expect(verifyResult.details?.watermarkId).toBe('abc');
  });

  it('fails verification on unwatermarked text', async () => {
    const guard = contentWatermark({ action: 'warn', watermarkId: 'x', verifyOnly: true });
    const result = await guard.check('Plain text without watermark', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('preserves original text content', async () => {
    const guard = contentWatermark({ action: 'allow', watermarkId: 'id1' });
    const original = 'Important content here';
    const result = await guard.check(original, { pipelineType: 'output' });
    expect(result.overrideText!.startsWith(original)).toBe(true);
  });

  it('returns latency in result', async () => {
    const guard = contentWatermark({ action: 'allow', watermarkId: 'perf' });
    const result = await guard.check('Test', { pipelineType: 'output' });
    expect(typeof result.latencyMs).toBe('number');
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('supported stage is output only', () => {
    const guard = contentWatermark({ action: 'allow', watermarkId: 'x' });
    expect(guard.supportedStages).toEqual(['output']);
  });
});
