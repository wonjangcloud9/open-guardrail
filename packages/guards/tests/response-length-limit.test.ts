import { describe, it, expect } from 'vitest';
import { responseLengthLimit } from '../src/response-length-limit.js';
const ctx = { pipelineType: 'output' as const };
describe('response-length-limit', () => {
  it('allows text within limits', async () => {
    const g = responseLengthLimit({ action: 'block' });
    expect((await g.check('Hello world', ctx)).passed).toBe(true);
  });
  it('blocks text exceeding maxWords', async () => {
    const g = responseLengthLimit({ action: 'block', maxWords: 3 });
    expect((await g.check('one two three four five', ctx)).passed).toBe(false);
  });
  it('blocks text below minWords', async () => {
    const g = responseLengthLimit({ action: 'block', minWords: 5 });
    expect((await g.check('too short', ctx)).passed).toBe(false);
  });
  it('respects maxChars', async () => {
    const g = responseLengthLimit({ action: 'warn', maxChars: 10 });
    expect((await g.check('This is a longer string', ctx)).passed).toBe(false);
  });
  it('respects minChars', async () => {
    const g = responseLengthLimit({ action: 'warn', minChars: 100 });
    expect((await g.check('Short', ctx)).passed).toBe(false);
  });
  it('includes word and char count in details', async () => {
    const g = responseLengthLimit({ action: 'block' });
    const r = await g.check('Hello world', ctx);
    expect(r.details).toHaveProperty('wordCount', 2);
    expect(r.details).toHaveProperty('charCount', 11);
  });
});
