import { describe, it, expect } from 'vitest';
import { emotionalManipulation } from '../src/emotional-manipulation.js';
const ctx = { pipelineType: 'input' as const };
describe('emotional-manipulation', () => {
  it('detects guilt-tripping', async () => { expect((await emotionalManipulation({ action: 'block' }).check('After everything I have done for you', ctx)).passed).toBe(false); });
  it('detects shame tactics', async () => { expect((await emotionalManipulation({ action: 'warn' }).check('You should feel guilty about this', ctx)).passed).toBe(false); });
  it('allows normal text', async () => { expect((await emotionalManipulation({ action: 'block' }).check('Thank you for your help', ctx)).passed).toBe(true); });
});
