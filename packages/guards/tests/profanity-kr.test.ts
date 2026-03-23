import { describe, it, expect } from 'vitest';
import { profanityKr } from '../src/profanity-kr.js';

const ctx = { pipelineType: 'input' as const };

describe('profanity-kr guard', () => {
  it('detects basic profanity', async () => {
    const guard = profanityKr({ action: 'block' });
    const result = await guard.check('이 씨발 뭐야', ctx);
    expect(result.passed).toBe(false);
    expect(result.details?.matched).toContain('씨발');
  });

  it('detects 초성 abbreviation', async () => {
    const guard = profanityKr({ action: 'block' });
    const result = await guard.check('진짜 ㅅㅂ', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects variant spellings', async () => {
    const guard = profanityKr({ action: 'block' });
    const result = await guard.check('시1발 진짜', ctx);
    expect(result.passed).toBe(false);
  });

  it('skips variants when detectVariants is false', async () => {
    const guard = profanityKr({ action: 'block', detectVariants: false });
    const result = await guard.check('ㅅㅂ 시1발', ctx);
    expect(result.passed).toBe(true);
  });

  it('allows clean Korean text', async () => {
    const guard = profanityKr({ action: 'block' });
    const result = await guard.check('오늘 날씨가 좋습니다', ctx);
    expect(result.passed).toBe(true);
  });

  it('returns matched words in details', async () => {
    const guard = profanityKr({ action: 'warn' });
    const result = await guard.check('개새끼 병신', ctx);
    expect(result.action).toBe('warn');
    expect(result.details?.matched).toContain('개새끼');
    expect(result.details?.matched).toContain('병신');
  });
});
