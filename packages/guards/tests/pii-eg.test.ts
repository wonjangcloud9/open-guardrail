import { describe, it, expect } from 'vitest';
import { piiEg } from '../src/pii-eg.js';
const ctx = { pipelineType: 'input' as const };
describe('pii-eg', () => {
  it('detects Egyptian phone', async () => { expect((await piiEg({ entities: ['phone-eg'], action: 'block' }).check('+20 1012345678', ctx)).passed).toBe(false); });
  it('allows clean', async () => { expect((await piiEg({ entities: ['phone-eg'], action: 'block' }).check('Ahlan wa sahlan', ctx)).passed).toBe(true); });
});
