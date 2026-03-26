import { describe, it, expect } from 'vitest';
import { dataRetention } from '../src/data-retention.js';
const ctx = { pipelineType: 'input' as const };
describe('data-retention', () => {
  it('detects storage request', async () => { expect((await dataRetention({ action: 'block' }).check('Remember my password for next time', ctx)).passed).toBe(false); });
  it('detects profile creation', async () => { expect((await dataRetention({ action: 'block' }).check('Create a profile for me', ctx)).passed).toBe(false); });
  it('allows normal request', async () => { expect((await dataRetention({ action: 'block' }).check('What is the weather today?', ctx)).passed).toBe(true); });
});
