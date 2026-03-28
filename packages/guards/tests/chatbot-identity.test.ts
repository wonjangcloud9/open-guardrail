import { describe, it, expect } from 'vitest';
import { chatbotIdentity } from '../src/chatbot-identity.js';

describe('chatbot-identity guard', () => {
  it('detects claiming to be human', async () => {
    const guard = chatbotIdentity({ action: 'block' });
    const result = await guard.check('I am a human just like you.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('detects claiming to be a different AI', async () => {
    const guard = chatbotIdentity({ action: 'warn', botName: 'claude' });
    const result = await guard.check('I am ChatGPT, made by OpenAI.', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows correct identity with botName', async () => {
    const guard = chatbotIdentity({ action: 'block', botName: 'claude' });
    const result = await guard.check('I am Claude, made by Anthropic.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('detects denying being AI', async () => {
    const guard = chatbotIdentity({ action: 'block' });
    const result = await guard.check("I'm not an AI, I'm a real person.", { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows normal AI response', async () => {
    const guard = chatbotIdentity({ action: 'block' });
    const result = await guard.check('Here is the information you requested about the topic.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('detects "I am not a bot"', async () => {
    const guard = chatbotIdentity({ action: 'warn' });
    const result = await guard.check("I'm not a bot, trust me.", { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('returns score within range', async () => {
    const guard = chatbotIdentity({ action: 'block' });
    const result = await guard.check('I am a human and I am not an AI.', { pipelineType: 'output' });
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });
});
