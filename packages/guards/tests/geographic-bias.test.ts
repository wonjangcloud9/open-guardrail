import { describe, it, expect } from 'vitest';
import { geographicBias } from '../src/geographic-bias.js';
const ctx = { pipelineType: 'output' as const };
describe('geographic-bias', () => {
  it('detects third-world bias', async () => { expect((await geographicBias({ action: 'warn' }).check('Those third-world countries are backward', ctx)).passed).toBe(false); });
  it('allows respectful', async () => { expect((await geographicBias({ action: 'block' }).check('Developing nations face unique challenges', ctx)).passed).toBe(true); });
});
