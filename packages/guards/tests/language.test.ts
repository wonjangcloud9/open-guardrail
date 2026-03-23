import { describe, it, expect } from 'vitest';
import { language } from '../src/language.js';

const ctx = { pipelineType: 'input' as const };

describe('language guard', () => {
  it('allows English when configured', async () => {
    const guard = language({
      allowed: ['en'],
      action: 'block',
    });
    const result = await guard.check(
      'This is a simple English sentence with the words.',
      ctx,
    );
    expect(result.passed).toBe(true);
    expect(result.action).toBe('allow');
    expect(result.details?.detectedLanguage).toBe('en');
  });

  it('allows Korean when configured', async () => {
    const guard = language({
      allowed: ['ko'],
      action: 'block',
    });
    const result = await guard.check(
      '안녕하세요, 오늘 날씨가 좋습니다.',
      ctx,
    );
    expect(result.passed).toBe(true);
    expect(result.action).toBe('allow');
    expect(result.details?.detectedLanguage).toBe('ko');
  });

  it('blocks non-allowed language', async () => {
    const guard = language({
      allowed: ['en'],
      action: 'block',
    });
    const result = await guard.check(
      '안녕하세요, 오늘 날씨가 좋습니다.',
      ctx,
    );
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
    expect(result.details?.detectedLanguage).toBe('ko');
  });

  it('returns detected language in details', async () => {
    const guard = language({
      allowed: ['ja'],
      action: 'warn',
    });
    const result = await guard.check(
      'これは日本語のテキストです。',
      ctx,
    );
    expect(result.passed).toBe(true);
    expect(result.details?.detectedLanguage).toBe('ja');
  });
});
