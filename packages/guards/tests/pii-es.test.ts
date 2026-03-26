import { describe, it, expect } from 'vitest';
import { piiEs } from '../src/pii-es.js';
const ctx = { pipelineType: 'input' as const };
describe('pii-es', () => {
  it('detects DNI', async () => { expect((await piiEs({ entities: ['dni'], action: 'block' }).check('DNI: 12345678Z', ctx)).passed).toBe(false); });
  it('detects NIE', async () => { expect((await piiEs({ entities: ['nie'], action: 'block' }).check('NIE: X1234567A', ctx)).passed).toBe(false); });
  it('allows clean', async () => { expect((await piiEs({ entities: ['dni'], action: 'block' }).check('Hola mundo', ctx)).passed).toBe(true); });
});
