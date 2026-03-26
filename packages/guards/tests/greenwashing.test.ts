import { describe, it, expect } from 'vitest';
import { greenwashing } from '../src/greenwashing.js';
const ctx = { pipelineType: 'output' as const };
describe('greenwashing', () => {
  it('detects carbon neutral claim', async () => { expect((await greenwashing({ action: 'warn' }).check('Our product is 100% carbon neutral guaranteed', ctx)).passed).toBe(false); });
  it('allows factual env text', async () => { expect((await greenwashing({ action: 'block' }).check('Renewable energy sources include solar and wind', ctx)).passed).toBe(true); });
});
