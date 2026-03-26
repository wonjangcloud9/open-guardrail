import { describe, it, expect } from 'vitest';
import { hateSpeech } from '../src/hate-speech.js';
const ctx = { pipelineType: 'input' as const };
describe('hate-speech', () => {
  it('detects racial hate', async () => { expect((await hateSpeech({ action: 'block', categories: ['racial'] }).check('white supremacy forever', ctx)).passed).toBe(false); });
  it('detects anti-LGBTQ', async () => { expect((await hateSpeech({ action: 'block', categories: ['lgbtq'] }).check('conversion therapy works', ctx)).passed).toBe(false); });
  it('allows respectful text', async () => { expect((await hateSpeech({ action: 'block' }).check('Everyone deserves respect and dignity', ctx)).passed).toBe(true); });
});
