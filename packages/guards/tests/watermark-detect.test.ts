import { describe, it, expect } from 'vitest';
import { watermarkDetect } from '../src/watermark-detect.js';

describe('watermark-detect guard', () => {
  it('detects common AI disclosure phrases (high sensitivity)', async () => {
    const guard = watermarkDetect({ action: 'warn', sensitivity: 'high' });
    const result = await guard.check('As an AI language model, I cannot help with that.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.details?.markers).toBeDefined();
  });

  it('detects multiple AI markers together (medium sensitivity)', async () => {
    const guard = watermarkDetect({ action: 'warn' });
    const text = 'As an AI language model, it is important to note that I hope this helps you understand the topic better. Please be aware of limitations.';
    const result = await guard.check(text, { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects hedging language clusters', async () => {
    const guard = watermarkDetect({ action: 'warn', sensitivity: 'high' });
    const text = 'It is important to note that this information is for educational purposes only. ' +
      'Please be aware that I must emphasize the importance of consulting a professional. ' +
      'It is worth noting that results may vary.';
    const result = await guard.check(text, { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects repetitive sentence structure', async () => {
    const guard = watermarkDetect({ action: 'warn', sensitivity: 'high' });
    const text = 'Here are the key points. First, we need to consider X. Second, we need to consider Y. Third, we need to consider Z. Fourth, we need to consider W. Fifth, we need to consider V.';
    const result = await guard.check(text, { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows natural human text', async () => {
    const guard = watermarkDetect({ action: 'warn' });
    const result = await guard.check('Had a great coffee this morning. The weather is nice.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('returns confidence score with multiple markers', async () => {
    const guard = watermarkDetect({ action: 'warn', sensitivity: 'high' });
    const result = await guard.check('As an AI, let me help. It is important to note that this is complex. I hope this helps.', { pipelineType: 'output' });
    expect(result.score).toBeGreaterThan(0);
  });
});
