import { describe, it, expect } from 'vitest';
import { piiAu } from '../src/pii-au.js';
const ctx = { pipelineType: 'input' as const };
describe('pii-au', () => {
  it('detects Australian phone', async () => { expect((await piiAu({ entities: ['phone-au'], action: 'block' }).check('Call +61 4 1234 5678', ctx)).passed).toBe(false); });
  it('masks Australian passport', async () => {
    const r = await piiAu({ entities: ['passport-au'], action: 'mask' }).check('Passport PA1234567', ctx);
    expect(r.overrideText).toContain('[Passport]');
  });
  it('allows clean text', async () => { expect((await piiAu({ entities: ['tfn', 'phone-au'], action: 'block' }).check('G\'day mate', ctx)).passed).toBe(true); });
});
