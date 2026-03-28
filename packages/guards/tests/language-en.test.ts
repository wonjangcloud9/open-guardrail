import { describe, it, expect } from 'vitest';
import { languageEn } from '../src/language-en.js';

describe('language-en guard', () => {
  it('passes English text', async () => {
    const guard = languageEn({ action: 'block' });
    const result = await guard.check('The quick brown fox jumps over the lazy dog', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('fails non-English text', async () => {
    const guard = languageEn({ action: 'block' });
    const result = await guard.check('これは日本語のテキストです。今日は天気がいいですね。', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('respects minRatio option', async () => {
    const guard = languageEn({ action: 'warn', minRatio: 0.8 });
    const result = await guard.check('Hello world こんにちは mixed text', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('returns combined score details', async () => {
    const guard = languageEn({ action: 'block' });
    const result = await guard.check('This is a simple English sentence', { pipelineType: 'input' });
    expect(result.details).toBeDefined();
    expect(result.details!.asciiRatio).toBeGreaterThan(0);
    expect(result.details!.wordRatio).toBeGreaterThan(0);
  });

  it('handles empty text', async () => {
    const guard = languageEn({ action: 'block' });
    const result = await guard.check('', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('uses warn action correctly', async () => {
    const guard = languageEn({ action: 'warn' });
    const result = await guard.check('한국어 텍스트입니다', { pipelineType: 'input' });
    expect(result.action).toBe('warn');
  });
});
