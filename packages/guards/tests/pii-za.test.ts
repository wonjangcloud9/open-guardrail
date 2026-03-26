import { describe, it, expect } from 'vitest';
import { piiZa } from '../src/pii-za.js';
const ctx = { pipelineType: 'input' as const };
describe('pii-za', () => {
  it('detects SA phone', async () => { expect((await piiZa({ entities: ['phone-za'], action: 'block' }).check('Call +27 82 123 4567', ctx)).passed).toBe(false); });
  it('allows clean', async () => { expect((await piiZa({ entities: ['phone-za'], action: 'block' }).check('Hello South Africa', ctx)).passed).toBe(true); });
});
