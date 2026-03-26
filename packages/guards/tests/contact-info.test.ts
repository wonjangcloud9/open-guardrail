import { describe, it, expect } from 'vitest';
import { contactInfo } from '../src/contact-info.js';
const ctx = { pipelineType: 'input' as const };
describe('contact-info', () => {
  it('detects social handles', async () => {
    const g = contactInfo({ action: 'block', detect: ['social'] });
    expect((await g.check('Follow me @username on twitter.com/user', ctx)).passed).toBe(false);
  });
  it('detects messenger IDs', async () => {
    const g = contactInfo({ action: 'block', detect: ['messenger'] });
    expect((await g.check('Add me on telegram: @myuser', ctx)).passed).toBe(false);
  });
  it('masks all contact info', async () => {
    const g = contactInfo({ action: 'mask' });
    const r = await g.check('Email me at a@b.com or call 010-1234-5678', ctx);
    expect(r.overrideText).toContain('[EMAIL]');
  });
  it('allows clean text', async () => {
    const g = contactInfo({ action: 'block' });
    expect((await g.check('Hello world', ctx)).passed).toBe(true);
  });
});
