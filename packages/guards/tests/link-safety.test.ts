import { describe, it, expect } from 'vitest';
import { linkSafety } from '../src/link-safety.js';
const ctx = { pipelineType: 'input' as const };
describe('link-safety', () => {
  it('allows normal URLs', async () => {
    const g = linkSafety({ action: 'block' });
    expect((await g.check('Visit https://example.com for info', ctx)).passed).toBe(true);
  });
  it('detects shortened URLs', async () => {
    const g = linkSafety({ action: 'block' });
    expect((await g.check('Click https://bit.ly/abc123', ctx)).passed).toBe(false);
  });
  it('allows shortened URLs when enabled', async () => {
    const g = linkSafety({ action: 'block', allowShortened: true });
    expect((await g.check('Click https://bit.ly/abc123', ctx)).passed).toBe(true);
  });
  it('detects javascript URIs', async () => {
    const g = linkSafety({ action: 'block' });
    expect((await g.check('javascript:alert(1)', ctx)).passed).toBe(false);
  });
  it('detects IP-based URLs', async () => {
    const g = linkSafety({ action: 'warn' });
    expect((await g.check('Go to http://192.168.1.1/admin', ctx)).passed).toBe(false);
  });
  it('detects suspicious TLDs', async () => {
    const g = linkSafety({ action: 'block' });
    expect((await g.check('Visit https://malware.tk/payload', ctx)).passed).toBe(false);
  });
  it('allows text without URLs', async () => {
    const g = linkSafety({ action: 'block' });
    expect((await g.check('No links here at all', ctx)).passed).toBe(true);
  });
});
