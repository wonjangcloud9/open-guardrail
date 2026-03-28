import { describe, it, expect } from 'vitest';
import { profanityKoExtended } from '../src/profanity-ko-extended.js';

describe('profanity-ko-extended guard', () => {
  it('detects Korean consonant abbreviation ㅅㅂ', async () => {
    const guard = profanityKoExtended({ action: 'block' });
    const result = await guard.check('이건 진짜 ㅅㅂ', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects 시발', async () => {
    const guard = profanityKoExtended({ action: 'block' });
    const result = await guard.check('시발 진짜 화난다', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects 개새끼', async () => {
    const guard = profanityKoExtended({ action: 'warn' });
    const result = await guard.check('이 개새끼가', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('detects 병신', async () => {
    const guard = profanityKoExtended({ action: 'block' });
    const result = await guard.check('병신같은 코드', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects 또라이', async () => {
    const guard = profanityKoExtended({ action: 'block' });
    const result = await guard.check('완전 또라이네', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('allows clean Korean text', async () => {
    const guard = profanityKoExtended({ action: 'block' });
    const result = await guard.check('오늘 날씨가 정말 좋습니다', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('returns match count in details', async () => {
    const guard = profanityKoExtended({ action: 'block' });
    const result = await guard.check('ㅅㅂ 병신 또라이', { pipelineType: 'input' });
    expect(result.details).toBeDefined();
    expect((result.details as any).matchedCount).toBeGreaterThanOrEqual(3);
  });
});
