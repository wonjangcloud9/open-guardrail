import { describe, it, expect } from 'vitest';
import { payloadSize } from '../src/payload-size.js';
const ctx = { pipelineType: 'input' as const };
describe('payload-size', () => {
  it('blocks oversized payload', async () => { expect((await payloadSize({ action: 'block', maxBytes: 50 }).check('A'.repeat(100), ctx)).passed).toBe(false); });
  it('blocks large base64', async () => { expect((await payloadSize({ action: 'block', maxBase64Bytes: 50 }).check('data: ' + 'A'.repeat(200), ctx)).passed).toBe(false); });
  it('allows normal text', async () => { expect((await payloadSize({ action: 'block' }).check('Hello world', ctx)).passed).toBe(true); });
});
