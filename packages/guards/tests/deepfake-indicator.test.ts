import { describe, it, expect } from 'vitest';
import { deepfakeIndicator } from '../src/deepfake-indicator.js';
const ctx = { pipelineType: 'input' as const };
describe('deepfake-indicator', () => {
  it('detects deepfake request', async () => { expect((await deepfakeIndicator({ action: 'block' }).check('Create a deepfake video of the president', ctx)).passed).toBe(false); });
  it('detects face swap', async () => { expect((await deepfakeIndicator({ action: 'warn' }).check('Put my face on that celebrity photo', ctx)).passed).toBe(false); });
  it('allows normal text', async () => { expect((await deepfakeIndicator({ action: 'block' }).check('How does video editing work?', ctx)).passed).toBe(true); });
});
