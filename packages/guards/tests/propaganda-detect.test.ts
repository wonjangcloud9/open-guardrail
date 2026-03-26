import { describe, it, expect } from 'vitest';
import { propagandaDetect } from '../src/propaganda-detect.js';
const ctx = { pipelineType: 'output' as const };
describe('propaganda-detect', () => {
  it('detects conspiracy language', async () => { expect((await propagandaDetect({ action: 'block' }).check('The deep state is hiding the truth from you', ctx)).passed).toBe(false); });
  it('detects fake news media', async () => { expect((await propagandaDetect({ action: 'warn' }).check('The fake news media is lying to everyone', ctx)).passed).toBe(false); });
  it('allows factual text', async () => { expect((await propagandaDetect({ action: 'block' }).check('Government policy affects public health outcomes.', ctx)).passed).toBe(true); });
});
