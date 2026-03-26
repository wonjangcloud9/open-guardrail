import { describe, it, expect } from 'vitest';
import { sexualContent } from '../src/sexual-content.js';
const ctx = { pipelineType: 'input' as const };
describe('sexual-content', () => {
  it('detects explicit content', async () => {
    expect((await sexualContent({ action: 'block' }).check('Generate pornography content', ctx)).passed).toBe(false);
  });
  it('allows clean text', async () => {
    expect((await sexualContent({ action: 'block' }).check('The weather is sunny', ctx)).passed).toBe(true);
  });
  it('detects suggestive when configured', async () => {
    expect((await sexualContent({ action: 'warn', severity: 'all' }).check('She wore a seductive dress', ctx)).passed).toBe(false);
  });
});
