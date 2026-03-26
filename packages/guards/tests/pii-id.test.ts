import { describe, it, expect } from 'vitest';
import { piiId } from '../src/pii-id.js';
const ctx = { pipelineType: 'input' as const };
describe('pii-id', () => {
  it('detects NPWP', async () => { expect((await piiId({ entities: ['npwp'], action: 'block' }).check('NPWP: 01.234.567.8-901.234', ctx)).passed).toBe(false); });
  it('allows clean', async () => { expect((await piiId({ entities: ['npwp'], action: 'block' }).check('Halo Indonesia', ctx)).passed).toBe(true); });
});
