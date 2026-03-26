import { describe, it, expect } from 'vitest';
import { profanityEn } from '../src/profanity-en.js';
const ctx = { pipelineType: 'input' as const };
describe('profanity-en', () => {
  it('detects severe profanity', async () => {
    const g = profanityEn({ action: 'block', severity: 'severe' });
    expect((await g.check('what the fuck', ctx)).passed).toBe(false);
  });
  it('detects obfuscated profanity', async () => {
    const g = profanityEn({ action: 'block' });
    expect((await g.check('f**k this', ctx)).passed).toBe(false);
  });
  it('skips obfuscation when disabled', async () => {
    const g = profanityEn({ action: 'block', detectObfuscation: false });
    expect((await g.check('f**k this', ctx)).passed).toBe(true);
  });
  it('allows clean text', async () => {
    const g = profanityEn({ action: 'block' });
    expect((await g.check('Have a wonderful day', ctx)).passed).toBe(true);
  });
});
