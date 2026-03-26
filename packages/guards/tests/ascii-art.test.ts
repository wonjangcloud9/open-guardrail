import { describe, it, expect } from 'vitest';
import { asciiArt } from '../src/ascii-art.js';
const ctx = { pipelineType: 'input' as const };
describe('ascii-art', () => {
  it('detects ASCII art patterns', async () => { expect((await asciiArt({ action: 'block' }).check('████████████████', ctx)).passed).toBe(false); });
  it('detects box drawing', async () => { expect((await asciiArt({ action: 'block' }).check('╔══════════╗\n║  hello   ║\n╚══════════╝', ctx)).passed).toBe(false); });
  it('allows normal text', async () => { expect((await asciiArt({ action: 'block' }).check('Hello, how are you today?', ctx)).passed).toBe(true); });
});
