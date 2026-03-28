import { describe, it, expect } from 'vitest';
import { spamLink } from '../src/spam-link.js';

describe('spam-link guard', () => {
  it('detects too many URLs', async () => {
    const guard = spamLink({ action: 'block', maxUrls: 2 });
    const text = 'Visit https://a.com https://b.com https://c.com';
    const result = await guard.check(text, { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects URL shorteners', async () => {
    const guard = spamLink({ action: 'block' });
    const text = 'Click https://bit.ly/abc and https://tinyurl.com/xyz';
    const result = await guard.check(text, { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects affiliate params', async () => {
    const guard = spamLink({ action: 'warn' });
    const text = 'Buy at https://shop.com?ref=me123';
    const result = await guard.check(text, { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects suspicious TLDs', async () => {
    const guard = spamLink({ action: 'block' });
    const text = 'Visit https://free-stuff.xyz for prizes';
    const result = await guard.check(text, { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('allows few normal URLs', async () => {
    const guard = spamLink({ action: 'block' });
    const text = 'Check https://example.com for details';
    const result = await guard.check(text, { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('respects maxUrls option', async () => {
    const guard = spamLink({ action: 'block', maxUrls: 5 });
    const text = 'https://a.com https://b.com https://c.com https://d.com';
    const result = await guard.check(text, { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });
});
