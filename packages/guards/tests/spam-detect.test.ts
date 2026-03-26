import { describe, it, expect } from 'vitest';
import { spamDetect } from '../src/spam-detect.js';
const ctx = { pipelineType: 'input' as const };
describe('spam-detect', () => {
  it('detects all-caps spam', async () => { expect((await spamDetect({ action: 'block' }).check('BUY NOW!!! FREE WINNER CLICK HERE!!!', ctx)).passed).toBe(false); });
  it('allows normal text', async () => { expect((await spamDetect({ action: 'block' }).check('Could you help me with this question?', ctx)).passed).toBe(true); });
});
