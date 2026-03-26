import { describe, it, expect } from 'vitest';
import { languageMix } from '../src/language-mix.js';
const ctx = { pipelineType: 'input' as const };
describe('language-mix', () => {
  it('blocks mixed scripts', async () => {
    const g = languageMix({ action: 'block', maxLanguages: 1 });
    expect((await g.check('Hello 안녕하세요', ctx)).passed).toBe(false);
  });
  it('allows single script', async () => {
    const g = languageMix({ action: 'block', maxLanguages: 1 });
    expect((await g.check('안녕하세요 감사합니다', ctx)).passed).toBe(true);
  });
  it('allows up to N scripts', async () => {
    const g = languageMix({ action: 'block', maxLanguages: 2 });
    expect((await g.check('Hello 안녕', ctx)).passed).toBe(true);
  });
});
