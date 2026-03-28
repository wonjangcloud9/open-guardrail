import { describe, it, expect } from 'vitest';
import { multiLanguageDetect } from '../src/multi-language-detect.js';

describe('multi-language-detect guard', () => {
  it('allows single Latin script', async () => {
    const guard = multiLanguageDetect({ action: 'warn' });
    const result = await guard.check('Hello world', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('allows two scripts within default limit', async () => {
    const guard = multiLanguageDetect({ action: 'warn' });
    const result = await guard.check('Hello 안녕하세요', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('detects three scripts exceeding default limit', async () => {
    const guard = multiLanguageDetect({ action: 'block' });
    const result = await guard.check('Hello 안녕하세요 Привет', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects CJK + Latin + Arabic', async () => {
    const guard = multiLanguageDetect({ action: 'warn' });
    const result = await guard.check('Hello 你好 مرحبا', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('respects custom maxLanguages', async () => {
    const guard = multiLanguageDetect({ action: 'warn', maxLanguages: 4 });
    const result = await guard.check('Hello 안녕 Привет مرحبا', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('returns detected scripts in details', async () => {
    const guard = multiLanguageDetect({ action: 'warn' });
    const result = await guard.check('Hello 안녕하세요', { pipelineType: 'input' });
    expect(result.details).toBeDefined();
    expect((result.details as any).detectedScripts).toContain('Latin');
    expect((result.details as any).detectedScripts).toContain('Korean');
  });

  it('detects Thai script', async () => {
    const guard = multiLanguageDetect({ action: 'warn', maxLanguages: 1 });
    const result = await guard.check('Hello สวัสดี', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });
});
