import { describe, it, expect } from 'vitest';
import { languageConsistency } from '../src/language-consistency.js';

const ctx = { pipelineType: 'output' as const };

describe('languageConsistency', () => {
  it('allows matching language (Korean)', async () => {
    const guard = languageConsistency({ action: 'warn', expected: ['ko'] });
    const r = await guard.check('안녕하세요. 머신러닝은 인공지능의 한 분야입니다.', ctx);
    expect(r.passed).toBe(true);
    expect(r.action).toBe('allow');
  });

  it('allows matching language (English)', async () => {
    const guard = languageConsistency({ action: 'warn', expected: ['en'] });
    const r = await guard.check('Machine learning is a subset of artificial intelligence that enables systems to learn from data.', ctx);
    expect(r.passed).toBe(true);
  });

  it('warns on language mismatch', async () => {
    const guard = languageConsistency({ action: 'warn', expected: ['ko'] });
    const r = await guard.check('This is an English response that should have been Korean.', ctx);
    expect(r.passed).toBe(false);
    expect(r.action).toBe('warn');
    expect(r.message).toContain('ko');
    expect(r.message).toContain('en');
  });

  it('blocks on language mismatch', async () => {
    const guard = languageConsistency({ action: 'block', expected: ['en'] });
    const r = await guard.check('이것은 한국어 응답입니다. 영어가 아닙니다.', ctx);
    expect(r.passed).toBe(false);
    expect(r.action).toBe('block');
  });

  it('allows multiple expected languages', async () => {
    const guard = languageConsistency({ action: 'warn', expected: ['en', 'ko'] });
    const r1 = await guard.check('This is English text for testing.', ctx);
    expect(r1.passed).toBe(true);

    const r2 = await guard.check('한국어 텍스트 테스트입니다.', ctx);
    expect(r2.passed).toBe(true);
  });

  it('skips when no expected language', async () => {
    const guard = languageConsistency({ action: 'warn' });
    const r = await guard.check('Some random text', ctx);
    expect(r.passed).toBe(true);
    expect(r.message).toContain('skipped');
  });

  it('reads inputLanguage from metadata', async () => {
    const guard = languageConsistency({ action: 'warn' });
    const ctxWithMeta = { pipelineType: 'output' as const, metadata: { inputLanguage: 'ko' } };
    const r = await guard.check('This is English but Korean was expected.', ctxWithMeta);
    expect(r.passed).toBe(false);
  });

  it('detects Japanese', async () => {
    const guard = languageConsistency({ action: 'warn', expected: ['ja'] });
    const r = await guard.check('こんにちは、機械学習について説明します。', ctx);
    expect(r.passed).toBe(true);
  });

  it('handles undetectable language gracefully', async () => {
    const guard = languageConsistency({ action: 'warn', expected: ['en'] });
    const r = await guard.check('123 456 789', ctx);
    expect(r.passed).toBe(true);
    expect(r.message).toContain('Could not detect');
  });
});
