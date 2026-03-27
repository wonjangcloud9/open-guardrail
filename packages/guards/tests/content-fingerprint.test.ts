import { describe, it, expect } from 'vitest';
import { contentFingerprint } from '../src/content-fingerprint.js';

describe('content-fingerprint', () => {
  it('passes unknown content', async () => {
    const guard = contentFingerprint({
      action: 'block',
      knownHashes: ['deadbeef'],
    });
    const ctx = { pipelineType: 'output' as const };
    const r = await guard.check('Some safe content', ctx);
    expect(r.passed).toBe(true);
    expect(r.action).toBe('allow');
  });

  it('blocks known bad hash', async () => {
    const badText = 'known bad content for testing';
    // Pre-compute hash via djb2
    const guard1 = contentFingerprint({
      action: 'block',
      knownHashes: [],
    });
    const ctx = { pipelineType: 'output' as const };
    const r1 = await guard1.check(badText, ctx);
    const hash = r1.details?.hash as string;

    const guard2 = contentFingerprint({
      action: 'block',
      knownHashes: [hash],
    });
    const r2 = await guard2.check(badText, ctx);
    expect(r2.passed).toBe(false);
    expect(r2.action).toBe('block');
  });
});
