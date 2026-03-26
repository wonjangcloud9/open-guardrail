import { describe, it, expect } from 'vitest';
import { academicIntegrity } from '../src/academic-integrity.js';
const ctx = { pipelineType: 'input' as const };
describe('academic-integrity', () => {
  it('detects essay request', async () => { expect((await academicIntegrity({ action: 'block' }).check('Write my essay for me about WW2', ctx)).passed).toBe(false); });
  it('detects plagiarism', async () => { expect((await academicIntegrity({ action: 'warn' }).check('I need to plagiarize this paper', ctx)).passed).toBe(false); });
  it('allows learning request', async () => { expect((await academicIntegrity({ action: 'block' }).check('Help me understand quantum physics', ctx)).passed).toBe(true); });
});
