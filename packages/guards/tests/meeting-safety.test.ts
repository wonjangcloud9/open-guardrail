import { describe, it, expect } from 'vitest';
import { meetingSafety } from '../src/meeting-safety.js';
const ctx = { pipelineType: 'input' as const };
describe('meeting-safety', () => {
  it('detects "confidential" mentions', async () => {
    const g = meetingSafety({ action: 'block' });
    const r = await g.check('This is confidential information', ctx);
    expect(r.passed).toBe(false);
    expect(r.details?.flags).toContain('confidential mention');
  });
  it('detects "under NDA"', async () => {
    const g = meetingSafety({ action: 'block' });
    expect((await g.check('This project is under NDA', ctx)).passed).toBe(false);
  });
  it('detects attorney-client privilege', async () => {
    const g = meetingSafety({ action: 'block' });
    expect((await g.check('This is covered by attorney-client privilege', ctx)).passed).toBe(false);
  });
  it('detects M&A discussions', async () => {
    const g = meetingSafety({ action: 'warn' });
    const r = await g.check('The merger and acquisition deal is pending', ctx);
    expect(r.passed).toBe(false);
    expect(r.action).toBe('warn');
  });
  it('allows normal meeting notes', async () => {
    const g = meetingSafety({ action: 'block' });
    expect((await g.check('We discussed the product roadmap for Q2', ctx)).passed).toBe(true);
  });
  it('detects "off the record"', async () => {
    const g = meetingSafety({ action: 'block' });
    expect((await g.check('This is off the record', ctx)).passed).toBe(false);
  });
  it('detects material non-public information', async () => {
    const g = meetingSafety({ action: 'block' });
    expect((await g.check('This is material non-public information', ctx)).passed).toBe(false);
  });
});
