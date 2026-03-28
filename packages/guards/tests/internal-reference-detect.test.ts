import { describe, it, expect } from 'vitest';
import { internalReferenceDetect } from '../src/internal-reference-detect.js';

const ctx = { pipelineType: 'output' as const };

describe('internalReferenceDetect', () => {
  const guard = internalReferenceDetect({ action: 'block' });

  it('allows normal text', async () => {
    const r = await guard.check('Please submit a support request through our portal.', ctx);
    expect(r.passed).toBe(true);
    expect(r.action).toBe('allow');
  });

  it('detects JIRA ticket ID', async () => {
    const r = await guard.check('This was fixed in PROJ-1234', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects Atlassian URL', async () => {
    const r = await guard.check('See https://company.atlassian.net/browse/FEAT-42', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects Confluence URL', async () => {
    const r = await guard.check('Docs at https://confluence.company.com/display/TEAM', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects Slack archive link', async () => {
    const r = await guard.check('Check slack.com/archives/C01ABC23DEF for context', ctx);
    expect(r.passed).toBe(false);
  });

  it('detects employee ID', async () => {
    const r = await guard.check('Contact EMP-00012345 for access', ctx);
    expect(r.passed).toBe(false);
  });

  it('respects warn action', async () => {
    const warnGuard = internalReferenceDetect({ action: 'warn' });
    const r = await warnGuard.check('Fixed in PROJ-999', ctx);
    expect(r.action).toBe('warn');
  });
});
