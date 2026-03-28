import { describe, it, expect } from 'vitest';
import { complianceTimestamp } from '../src/compliance-timestamp.js';
const ctx = { pipelineType: 'output' as const };
describe('compliance-timestamp', () => {
  it('flags missing timestamp when required', async () => {
    const g = complianceTimestamp({ action: 'block', requireTimestamp: true });
    const r = await g.check('This response has no date at all', ctx);
    expect(r.passed).toBe(false);
    expect(r.details?.issues).toContain('missing_timestamp');
  });
  it('passes when timestamp present and required', async () => {
    const g = complianceTimestamp({ action: 'block', requireTimestamp: true });
    const r = await g.check('Response generated on 2025-01-15T10:30:00', ctx);
    expect(r.passed).toBe(true);
  });
  it('flags mixed date formats', async () => {
    const g = complianceTimestamp({ action: 'warn' });
    const r = await g.check('Created 2025-01-15 and updated 01/20/2025', ctx);
    expect(r.passed).toBe(false);
    expect(r.details?.issues).toEqual(expect.arrayContaining([expect.stringContaining('mixed_date_formats')]));
  });
  it('flags wrong format when dateFormat specified', async () => {
    const g = complianceTimestamp({ action: 'block', dateFormat: 'iso' });
    const r = await g.check('Date: 01/15/2025', ctx);
    expect(r.passed).toBe(false);
  });
  it('passes with no timestamp and not required', async () => {
    const g = complianceTimestamp({ action: 'block' });
    const r = await g.check('Just a simple response', ctx);
    expect(r.passed).toBe(true);
  });
  it('flags future-dated ISO response', async () => {
    const g = complianceTimestamp({ action: 'block' });
    const r = await g.check('Report date: 2099-12-31T23:59:59', ctx);
    expect(r.passed).toBe(false);
    expect(r.details?.issues).toEqual(expect.arrayContaining([expect.stringContaining('future_date')]));
  });
  it('has correct metadata', async () => {
    const g = complianceTimestamp({ action: 'block' });
    expect(g.name).toBe('compliance-timestamp');
    expect(g.category).toBe('compliance');
  });
});
