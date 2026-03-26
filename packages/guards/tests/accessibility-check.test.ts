import { describe, it, expect } from 'vitest';
import { accessibilityCheck } from '../src/accessibility-check.js';
const ctx = { pipelineType: 'output' as const };
describe('accessibility-check', () => {
  it('detects excessive jargon', async () => { expect((await accessibilityCheck({ action: 'warn', maxJargonRatio: 0.01 }).check('The paradigm synergy leverage ecosystem is holistic and scalable with actionable deliverables', ctx)).passed).toBe(false); });
  it('allows simple text', async () => { expect((await accessibilityCheck({ action: 'block' }).check('The cat sat on the mat. It was happy.', ctx)).passed).toBe(true); });
});
