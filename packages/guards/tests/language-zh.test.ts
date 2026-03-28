import { describe, it, expect } from 'vitest';
import { languageZh } from '../src/language-zh.js';

describe('language-zh guard', () => {
  it('detects Chinese text above threshold', async () => {
    const guard = languageZh({ action: 'warn' });
    const result = await guard.check('你好世界，今天天气很好', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThan(0.3);
  });

  it('fails on pure English text', async () => {
    const guard = languageZh({ action: 'warn' });
    const result = await guard.check('Hello, how are you today?', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
  });

  it('handles mixed Chinese-English text', async () => {
    const guard = languageZh({ action: 'warn', minRatio: 0.2 });
    const result = await guard.check('Hello 你好 World 世界', { pipelineType: 'input' });
    expect(result.score).toBeGreaterThan(0);
  });

  it('respects custom minRatio', async () => {
    const guard = languageZh({ action: 'warn', minRatio: 0.9 });
    const result = await guard.check('Hello 你好', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('handles empty text', async () => {
    const guard = languageZh({ action: 'warn' });
    const result = await guard.check('', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('returns Chinese ratio in details', async () => {
    const guard = languageZh({ action: 'warn' });
    const result = await guard.check('中文测试内容', { pipelineType: 'input' });
    expect(result.details).toBeDefined();
    expect((result.details as any).chineseRatio).toBeGreaterThan(0);
  });
});
