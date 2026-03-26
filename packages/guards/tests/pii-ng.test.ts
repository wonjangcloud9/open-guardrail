import { describe, it, expect } from 'vitest';
import { piiNg } from '../src/pii-ng.js';
const ctx = { pipelineType: 'input' as const };
describe('pii-ng', () => {
  it('detects Nigerian phone', async () => { expect((await piiNg({ entities: ['phone-ng'], action: 'block' }).check('Call +234 801 234 5678', ctx)).passed).toBe(false); });
  it('allows clean', async () => { expect((await piiNg({ entities: ['phone-ng'], action: 'block' }).check('Hello Nigeria', ctx)).passed).toBe(true); });
});
