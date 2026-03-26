import { describe, it, expect } from 'vitest';
import { brandSafety } from '../src/brand-safety.js';
const ctx = { pipelineType: 'output' as const };
describe('brand-safety', () => {
  it('detects negative content', async () => { expect((await brandSafety({ action: 'warn', categories: ['negative'] }).check('This is a terrible scam product', ctx)).passed).toBe(false); });
  it('allows positive', async () => { expect((await brandSafety({ action: 'block' }).check('Our team delivers great results', ctx)).passed).toBe(true); });
});
