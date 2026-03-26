import { describe, it, expect } from 'vitest';
import { profanityJp } from '../src/profanity-jp.js';

const ctx = { pipelineType: 'input' as const };

describe('profanity-jp guard', () => {
  it('detects basic profanity (hiragana)', async () => {
    const guard = profanityJp({ action: 'block' });
    const result = await guard.check('なんだこのくそ', ctx);
    expect(result.passed).toBe(false);
    expect(result.details?.matched).toContain('くそ');
  });

  it('detects katakana profanity', async () => {
    const guard = profanityJp({ action: 'block' });
    const result = await guard.check('お前はバカだ', ctx);
    expect(result.passed).toBe(false);
    expect(result.details?.matched).toContain('バカ');
  });

  it('detects kanji profanity', async () => {
    const guard = profanityJp({ action: 'block' });
    const result = await guard.check('この馬鹿野郎', ctx);
    expect(result.passed).toBe(false);
    expect(result.details?.matched).toContain('馬鹿');
  });

  it('detects death threat expression', async () => {
    const guard = profanityJp({ action: 'block' });
    const result = await guard.check('死ねよ', ctx);
    expect(result.passed).toBe(false);
    expect(result.details?.matched).toContain('死ね');
  });

  it('detects variant spelling (タヒ)', async () => {
    const guard = profanityJp({ action: 'block' });
    const result = await guard.check('タヒね', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects variant spelling (氏ね)', async () => {
    const guard = profanityJp({ action: 'block' });
    const result = await guard.check('氏ね', ctx);
    expect(result.passed).toBe(false);
  });

  it('skips variants when detectVariants is false', async () => {
    const guard = profanityJp({ action: 'block', detectVariants: false });
    const result = await guard.check('タヒね 氏ね', ctx);
    expect(result.passed).toBe(true);
  });

  it('allows clean Japanese text', async () => {
    const guard = profanityJp({ action: 'block' });
    const result = await guard.check('今日はいい天気ですね', ctx);
    expect(result.passed).toBe(true);
  });

  it('returns matched words in details', async () => {
    const guard = profanityJp({ action: 'warn' });
    const result = await guard.check('バカでクソだ', ctx);
    expect(result.action).toBe('warn');
    expect(result.details?.matched).toContain('バカ');
    expect(result.details?.matched).toContain('クソ');
  });
});
