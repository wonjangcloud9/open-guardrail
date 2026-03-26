import { describe, it, expect } from 'vitest';
import { stereotypeDetect } from '../src/stereotype-detect.js';
const ctx = { pipelineType: 'output' as const };
describe('stereotype-detect', () => {
  it('detects gender stereotypes', async () => { expect((await stereotypeDetect({ action: 'block' }).check('Women belong in the kitchen', ctx)).passed).toBe(false); });
  it('detects group generalizations', async () => { expect((await stereotypeDetect({ action: 'warn' }).check('All men are always like that', ctx)).passed).toBe(false); });
  it('allows respectful text', async () => { expect((await stereotypeDetect({ action: 'block' }).check('People have diverse perspectives and strengths', ctx)).passed).toBe(true); });
});
