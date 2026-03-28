import { describe, it, expect } from 'vitest';
import { auditTrail } from '../src/audit-trail.js';
const ctx = { pipelineType: 'output' as const };
describe('audit-trail', () => {
  it('always passes', async () => {
    const g = auditTrail();
    expect((await g.check('Any text here', ctx)).passed).toBe(true);
  });
  it('includes timestamp by default', async () => {
    const g = auditTrail();
    const r = await g.check('Hello world', ctx);
    expect(r.details).toHaveProperty('timestamp');
  });
  it('includes guard version by default', async () => {
    const g = auditTrail();
    const r = await g.check('Hello world', ctx);
    expect(r.details).toHaveProperty('guardVersion', '0.1.0');
  });
  it('excludes timestamp when disabled', async () => {
    const g = auditTrail({ includeTimestamp: false });
    const r = await g.check('Hello', ctx);
    expect(r.details).not.toHaveProperty('timestamp');
  });
  it('excludes version when disabled', async () => {
    const g = auditTrail({ includeVersion: false });
    const r = await g.check('Hello', ctx);
    expect(r.details).not.toHaveProperty('guardVersion');
  });
  it('includes word and char count', async () => {
    const g = auditTrail();
    const r = await g.check('Hello world', ctx);
    expect(r.details).toHaveProperty('wordCount', 2);
    expect(r.details).toHaveProperty('charCount', 11);
  });
  it('action is always allow', async () => {
    const g = auditTrail();
    expect((await g.check('test', ctx)).action).toBe('allow');
  });
});
