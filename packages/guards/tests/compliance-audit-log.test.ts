import { describe, it, expect } from 'vitest';
import { complianceAuditLog } from '../src/compliance-audit-log.js';

describe('compliance-audit-log', () => {
  const guard = complianceAuditLog();
  const ctx = { pipelineType: 'input' as const };

  it('always passes', async () => {
    const r = await guard.check('Hello world', ctx);
    expect(r.passed).toBe(true);
    expect(r.action).toBe('allow');
  });

  it('logs audit entries for relevant text', async () => {
    const r = await guard.check(
      'The patient diagnosis requires a prescription and investment portfolio review',
      ctx,
    );
    expect(r.passed).toBe(true);
    expect(r.details?.audit.medical).toContain('diagnosis');
    expect(r.details?.audit.financial).toContain('investment');
  });
});
