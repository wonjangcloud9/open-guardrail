import { describe, it, expect } from 'vitest';
import { childSafety } from '../src/child-safety.js';
const ctx = { pipelineType: 'input' as const };
describe('child-safety', () => {
  it('detects exploitation patterns', async () => { expect((await childSafety({ action: 'block' }).check('child exploitation content', ctx)).passed).toBe(false); });
  it('detects grooming', async () => { expect((await childSafety({ action: 'block' }).check('grooming a minor online', ctx)).passed).toBe(false); });
  it('allows safe content', async () => { expect((await childSafety({ action: 'block' }).check('Children learn best through play', ctx)).passed).toBe(true); });
});
