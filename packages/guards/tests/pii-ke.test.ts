import { describe, it, expect } from 'vitest';
import { piiKe } from '../src/pii-ke.js';
const ctx = { pipelineType: 'input' as const };
describe('pii-ke', () => {
  it('detects KRA PIN', async () => { expect((await piiKe({ entities: ['kra-pin'], action: 'block' }).check('KRA: A123456789B', ctx)).passed).toBe(false); });
  it('allows clean', async () => { expect((await piiKe({ entities: ['kra-pin'], action: 'block' }).check('Habari Kenya', ctx)).passed).toBe(true); });
});
