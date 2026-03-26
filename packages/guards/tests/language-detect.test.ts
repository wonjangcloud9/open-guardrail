import { describe, it, expect } from 'vitest';
import { languageDetect } from '../src/language-detect.js';
const ctx = { pipelineType: 'input' as const };

describe('language-detect guard', () => {
  it('detects Korean text', async () => {
    const guard = languageDetect({ action: 'block', required: ['ko'] });
    const result = await guard.check('안녕하세요 오늘 날씨가 좋습니다', ctx);
    expect(result.passed).toBe(true);
    expect(result.details?.primaryLanguage).toBe('ko');
  });
  it('blocks forbidden language', async () => {
    const guard = languageDetect({ action: 'block', forbidden: ['ko'] });
    const result = await guard.check('안녕하세요', ctx);
    expect(result.passed).toBe(false);
  });
  it('detects English', async () => {
    const guard = languageDetect({ action: 'block', required: ['en'] });
    const result = await guard.check('The weather is nice today', ctx);
    expect(result.passed).toBe(true);
  });
  it('blocks when required language missing', async () => {
    const guard = languageDetect({ action: 'block', required: ['ja'] });
    const result = await guard.check('안녕하세요', ctx);
    expect(result.passed).toBe(false);
  });
});
