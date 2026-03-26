import { describe, it, expect } from 'vitest';
import { piiVn } from '../src/pii-vn.js';
const ctx = { pipelineType: 'input' as const };
describe('pii-vn', () => {
  it('detects CCCD', async () => { expect((await piiVn({ entities: ['cccd'], action: 'block' }).check('CCCD: 079123456789', ctx)).passed).toBe(false); });
  it('allows clean', async () => { expect((await piiVn({ entities: ['cccd'], action: 'block' }).check('Xin chao', ctx)).passed).toBe(true); });
});
