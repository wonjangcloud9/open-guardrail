import { describe, it, expect } from 'vitest';
import { responseLanguageMatch } from '../src/response-language-match.js';
describe('response-language-match', () => {
  it('passes when input and output use same script (Latin)', async () => {
    const g = responseLanguageMatch({ action: 'block' });
    const r = await g.check('This is English', { pipelineType: 'output', inputText: 'Hello world' } as never);
    expect(r.passed).toBe(true);
  });
  it('flags script mismatch (Latin input, Cyrillic output)', async () => {
    const g = responseLanguageMatch({ action: 'block' });
    const r = await g.check('Это русский текст', { pipelineType: 'output', inputText: 'This is English' } as never);
    expect(r.passed).toBe(false);
  });
  it('flags script mismatch (CJK input, Latin output)', async () => {
    const g = responseLanguageMatch({ action: 'warn' });
    const r = await g.check('This is in English', { pipelineType: 'output', inputText: '这是中文测试' } as never);
    expect(r.passed).toBe(false);
    expect(r.action).toBe('warn');
  });
  it('passes when no input text provided', async () => {
    const g = responseLanguageMatch({ action: 'block' });
    const r = await g.check('Any text', { pipelineType: 'output' });
    expect(r.passed).toBe(true);
  });
  it('enforces allowedLanguages', async () => {
    const g = responseLanguageMatch({ action: 'block', allowedLanguages: ['latin'] });
    const r = await g.check('Привет мир', { pipelineType: 'output', inputText: 'Привет' } as never);
    expect(r.passed).toBe(false);
  });
  it('has correct metadata', async () => {
    const g = responseLanguageMatch({ action: 'block' });
    expect(g.name).toBe('response-language-match');
    expect(g.category).toBe('locale');
  });
});
