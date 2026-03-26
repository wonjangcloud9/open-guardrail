import { describe, it, expect } from 'vitest';
import { piiIt } from '../src/pii-it.js';
const ctx = { pipelineType: 'input' as const };
describe('pii-it', () => {
  it('detects Codice Fiscale', async () => { expect((await piiIt({ entities: ['codice-fiscale'], action: 'block' }).check('CF: RSSMRA85T10A562S', ctx)).passed).toBe(false); });
  it('allows clean', async () => { expect((await piiIt({ entities: ['codice-fiscale'], action: 'block' }).check('Ciao mondo', ctx)).passed).toBe(true); });
});
