import { describe, it, expect } from 'vitest';
import { codeLanguageDetect } from '../src/code-language-detect.js';

const ctx = { pipelineType: 'output' as const };

describe('code-language-detect guard', () => {
  it('passes when code blocks have language tags', async () => {
    const guard = codeLanguageDetect({ action: 'warn', requireLanguageTag: true });
    const result = await guard.check('```python\ndef hello():\n  pass\n```', ctx);
    expect(result.passed).toBe(true);
  });

  it('fails when language tag missing and required', async () => {
    const guard = codeLanguageDetect({ action: 'block', requireLanguageTag: true });
    const result = await guard.check('```\nconst x = 1;\n```', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects python code', async () => {
    const guard = codeLanguageDetect({ action: 'warn' });
    const result = await guard.check('```\ndef hello():\n  import os\n```', ctx);
    expect(result.details?.detectedLanguages).toContain('python');
  });

  it('detects javascript code', async () => {
    const guard = codeLanguageDetect({ action: 'warn' });
    const result = await guard.check('```\nconst x = 1;\nlet y = 2;\n```', ctx);
    expect(result.details?.detectedLanguages).toContain('javascript');
  });

  it('passes text without code blocks', async () => {
    const guard = codeLanguageDetect({ action: 'block', requireLanguageTag: true });
    const result = await guard.check('No code here.', ctx);
    expect(result.passed).toBe(true);
  });

  it('detects multiple languages', async () => {
    const guard = codeLanguageDetect({ action: 'warn' });
    const text = '```\ndef foo(): pass\n```\n\n```\nconst bar = 1;\n```';
    const result = await guard.check(text, ctx);
    expect(result.details?.detectedLanguages?.length).toBeGreaterThanOrEqual(1);
  });
});
