import { describe, it, expect } from 'vitest';
import { unicodeConfusable } from '../src/unicode-confusable.js';
const ctx = { pipelineType: 'input' as const };
describe('unicode-confusable', () => {
  it('detects Cyrillic homoglyphs', async () => { expect((await unicodeConfusable({ action: 'block' }).check('p\u0430ypal', ctx)).passed).toBe(false); });
  it('allows normal Latin text', async () => { expect((await unicodeConfusable({ action: 'block' }).check('Hello world', ctx)).passed).toBe(true); });
});
