import { describe, it, expect } from 'vitest';
import { languageKo } from '../src/language-ko.js';

describe('language-ko guard', () => {
  it('detects Korean text above threshold', async () => {
    const guard = languageKo({ action: 'warn' });
    const result = await guard.check('안녕하세요 오늘 날씨가 좋습니다', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThan(0.3);
  });

  it('fails on pure English text', async () => {
    const guard = languageKo({ action: 'warn' });
    const result = await guard.check('Hello, how are you today?', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
  });

  it('handles mixed Korean-English text', async () => {
    const guard = languageKo({ action: 'warn', minRatio: 0.2 });
    const result = await guard.check('Hello 안녕 world 세계', { pipelineType: 'input' });
    expect(result.score).toBeGreaterThan(0);
  });

  it('respects custom minRatio', async () => {
    const guard = languageKo({ action: 'warn', minRatio: 0.9 });
    const result = await guard.check('Hello 안녕하세요', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('handles empty text', async () => {
    const guard = languageKo({ action: 'warn' });
    const result = await guard.check('', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('returns Korean ratio in details', async () => {
    const guard = languageKo({ action: 'warn' });
    const result = await guard.check('한국어 테스트', { pipelineType: 'input' });
    expect(result.details).toBeDefined();
    expect((result.details as any).koreanRatio).toBeGreaterThan(0);
  });
});
