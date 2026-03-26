import { describe, it, expect } from 'vitest';
import { promptLength } from '../src/prompt-length.js';
const ctx = { pipelineType: 'input' as const };
describe('prompt-length', () => {
  it('blocks exceeding chars', async () => { expect((await promptLength({ action: 'block', maxChars: 10 }).check('This is a long prompt text', ctx)).passed).toBe(false); });
  it('blocks exceeding words', async () => { expect((await promptLength({ action: 'block', maxWords: 3 }).check('one two three four five', ctx)).passed).toBe(false); });
  it('allows within limits', async () => { expect((await promptLength({ action: 'block', maxChars: 100, maxWords: 20 }).check('Hello world', ctx)).passed).toBe(true); });
});
