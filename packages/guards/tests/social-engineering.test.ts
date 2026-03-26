import { describe, it, expect } from 'vitest';
import { socialEngineering } from '../src/social-engineering.js';
const ctx = { pipelineType: 'input' as const };
describe('social-engineering', () => {
  it('detects account suspension scam', async () => { expect((await socialEngineering({ action: 'block' }).check('Your account has been suspended, verify now', ctx)).passed).toBe(false); });
  it('detects urgency tactic', async () => { expect((await socialEngineering({ action: 'warn' }).check('Urgent action required immediately', ctx)).passed).toBe(false); });
  it('allows normal text', async () => { expect((await socialEngineering({ action: 'block' }).check('How do I change my settings?', ctx)).passed).toBe(true); });
});
