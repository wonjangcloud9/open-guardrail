import { describe, it, expect } from 'vitest';
import { misinformation } from '../src/misinformation.js';
const ctx = { pipelineType: 'output' as const };
describe('misinformation', () => {
  it('detects miracle cure claims', async () => {
    expect((await misinformation({ action: 'block' }).check('A secret miracle cure for cancer was discovered', ctx)).passed).toBe(false);
  });
  it('detects conspiracy patterns', async () => {
    expect((await misinformation({ action: 'warn' }).check('They don\'t want you to know the truth', ctx)).passed).toBe(false);
  });
  it('allows factual text', async () => {
    expect((await misinformation({ action: 'block' }).check('Water is composed of hydrogen and oxygen.', ctx)).passed).toBe(true);
  });
});
