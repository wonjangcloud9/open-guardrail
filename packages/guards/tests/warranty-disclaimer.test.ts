import { describe, it, expect } from 'vitest';
import { warrantyDisclaimer } from '../src/warranty-disclaimer.js';
const ctx = { pipelineType: 'output' as const };
describe('warranty-disclaimer', () => {
  it('detects guarantee claim', async () => { expect((await warrantyDisclaimer({ action: 'warn' }).check('100% money-back guarantee if not satisfied', ctx)).passed).toBe(false); });
  it('allows factual', async () => { expect((await warrantyDisclaimer({ action: 'block' }).check('Results may vary depending on usage.', ctx)).passed).toBe(true); });
});
