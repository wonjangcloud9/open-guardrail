import { describe, it, expect } from 'vitest';
import { languageJa } from '../src/language-ja.js';

describe('language-ja guard', () => {
  it('detects Japanese hiragana text', async () => {
    const guard = languageJa({ action: 'warn' });
    const result = await guard.check('こんにちは、お元気ですか', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThan(0.3);
  });

  it('detects Japanese katakana text', async () => {
    const guard = languageJa({ action: 'warn' });
    const result = await guard.check('コンピュータサイエンス', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('fails on pure English text', async () => {
    const guard = languageJa({ action: 'warn' });
    const result = await guard.check('Hello, how are you today?', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
  });

  it('respects custom minRatio', async () => {
    const guard = languageJa({ action: 'warn', minRatio: 0.9 });
    const result = await guard.check('Hello こんにちは', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('handles empty text', async () => {
    const guard = languageJa({ action: 'warn' });
    const result = await guard.check('', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects kanji characters', async () => {
    const guard = languageJa({ action: 'warn' });
    const result = await guard.check('日本語のテスト文章です', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });
});
