import { describe, it, expect } from 'vitest';
import { religiousContent } from '../src/religious-content.js';
const ctx = { pipelineType: 'output' as const };
describe('religious-content', () => {
  it('detects proselytizing', async () => { expect((await religiousContent({ action: 'warn' }).check('Accept Jesus as your savior and convert to Christianity', ctx)).passed).toBe(false); });
  it('allows neutral', async () => { expect((await religiousContent({ action: 'block' }).check('Many world religions have rich traditions', ctx)).passed).toBe(true); });
});
