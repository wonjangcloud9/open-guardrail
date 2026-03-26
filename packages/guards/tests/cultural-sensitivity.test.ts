import { describe, it, expect } from 'vitest';
import { culturalSensitivity } from '../src/cultural-sensitivity.js';
const ctx = { pipelineType: 'output' as const };
describe('cultural-sensitivity', () => {
  it('detects insensitive language', async () => { expect((await culturalSensitivity({ action: 'warn' }).check('She has such exotic beauty, where are you really from', ctx)).passed).toBe(false); });
  it('allows respectful text', async () => { expect((await culturalSensitivity({ action: 'block' }).check('People from all backgrounds contribute', ctx)).passed).toBe(true); });
});
