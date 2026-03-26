import { describe, it, expect } from 'vitest';
import { gibberishDetect } from '../src/gibberish-detect.js';

const ctx = { pipelineType: 'input' as const };

describe('gibberish-detect guard', () => {
  it('detects random character spam', async () => {
    const guard = gibberishDetect({ action: 'block' });
    const result = await guard.check('asdfghjklqwrtzxcvbnm', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects repeated characters', async () => {
    const guard = gibberishDetect({ action: 'block' });
    const result = await guard.check('aaaaaabbbbbbcccccc', ctx);
    expect(result.passed).toBe(false);
  });

  it('allows normal English text', async () => {
    const guard = gibberishDetect({ action: 'block' });
    const result = await guard.check('Hello, how are you doing today?', ctx);
    expect(result.passed).toBe(true);
  });

  it('allows normal Korean text', async () => {
    const guard = gibberishDetect({ action: 'block' });
    const result = await guard.check('안녕하세요 오늘 날씨가 좋습니다', ctx);
    expect(result.passed).toBe(true);
  });

  it('allows normal Japanese text', async () => {
    const guard = gibberishDetect({ action: 'block' });
    const result = await guard.check('今日はいい天気ですね', ctx);
    expect(result.passed).toBe(true);
  });

  it('returns score in result', async () => {
    const guard = gibberishDetect({ action: 'warn' });
    const result = await guard.check('qwrtpsdfghjklzxcvbnm', ctx);
    expect(result.score).toBeGreaterThan(0);
  });

  it('respects custom threshold', async () => {
    const guard = gibberishDetect({ action: 'block', threshold: 0.9 });
    const result = await guard.check('asdfghjkl', ctx);
    expect(result.passed).toBe(true);
  });
});
