import { describe, it, expect } from 'vitest';
import { piiRedactConsistency } from '../src/pii-redact-consistency.js';

describe('pii-redact-consistency guard', () => {
  it('passes fully redacted text', async () => {
    const guard = piiRedactConsistency({ action: 'block' });
    const r = await guard.check('Contact [EMAIL] or call [PHONE]', { pipelineType: 'output' });
    expect(r.passed).toBe(true);
  });

  it('blocks mixed raw and redacted PII', async () => {
    const guard = piiRedactConsistency({ action: 'block' });
    const r = await guard.check('Contact [EMAIL] or call 555-123-4567', { pipelineType: 'output' });
    expect(r.passed).toBe(false);
  });

  it('passes text without markers', async () => {
    const guard = piiRedactConsistency({ action: 'block' });
    const r = await guard.check('Hello world', { pipelineType: 'output' });
    expect(r.passed).toBe(true);
  });
});
