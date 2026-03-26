import { describe, it, expect } from 'vitest';
import { gamblingDetect } from '../src/gambling-detect.js';
const ctx = { pipelineType: 'input' as const };
describe('gambling-detect', () => {
  it('detects online casino', async () => { expect((await gamblingDetect({ action: 'block' }).check('Best online casino strategies', ctx)).passed).toBe(false); });
  it('detects guaranteed win scam', async () => { expect((await gamblingDetect({ action: 'warn' }).check('This is a guaranteed win method', ctx)).passed).toBe(false); });
  it('allows normal', async () => { expect((await gamblingDetect({ action: 'block' }).check('What is probability theory?', ctx)).passed).toBe(true); });
});
