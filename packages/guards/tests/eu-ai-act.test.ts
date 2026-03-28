import { describe, it, expect } from 'vitest';
import { euAiAct } from '../src/eu-ai-act.js';

describe('eu-ai-act guard', () => {
  it('detects social scoring (unacceptable risk)', async () => {
    const guard = euAiAct({ action: 'block' });
    const result = await guard.check('Implement a social scoring system for citizens', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects subliminal manipulation', async () => {
    const guard = euAiAct({ action: 'block' });
    const result = await guard.check('Use subliminal techniques to influence purchasing', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects real-time biometric surveillance', async () => {
    const guard = euAiAct({ action: 'block' });
    const result = await guard.check('Deploy real-time biometric identification in public spaces', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects high-risk employment scoring', async () => {
    const guard = euAiAct({ action: 'warn' });
    const result = await guard.check('AI-based hiring decision system', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('detects credit scoring as high risk', async () => {
    const guard = euAiAct({ action: 'warn' });
    const result = await guard.check('Automated credit scoring algorithm', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('allows normal AI usage', async () => {
    const guard = euAiAct({ action: 'block' });
    const result = await guard.check('Use AI to summarize meeting notes', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('allows chatbot with transparency', async () => {
    const guard = euAiAct({ action: 'warn' });
    const result = await guard.check('This is an AI-generated response from our chatbot', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });
});
