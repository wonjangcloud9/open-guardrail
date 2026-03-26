import { describe, it, expect } from 'vitest';
import { piiPl } from '../src/pii-pl.js';
const ctx = { pipelineType: 'input' as const };
describe('pii-pl', () => {
  it('detects NIP', async () => { expect((await piiPl({ entities: ['nip'], action: 'block' }).check('NIP: 123-456-78-90', ctx)).passed).toBe(false); });
  it('detects dowod', async () => { expect((await piiPl({ entities: ['dowod'], action: 'block' }).check('Dowod: ABC123456', ctx)).passed).toBe(false); });
  it('allows clean', async () => { expect((await piiPl({ entities: ['nip'], action: 'block' }).check('Czesc swiecie', ctx)).passed).toBe(true); });
});
