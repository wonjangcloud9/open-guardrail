import { describe, it, expect } from 'vitest';
import { socialMediaDetect } from '../src/social-media-detect.js';

describe('social-media-detect guard', () => {
  it('detects @mentions', async () => {
    const guard = socialMediaDetect({ action: 'warn' });
    const result = await guard.check('Check out @username for more', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects hashtags', async () => {
    const guard = socialMediaDetect({ action: 'warn' });
    const result = await guard.check('Use #trending #viral for reach', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects retweet patterns', async () => {
    const guard = socialMediaDetect({ action: 'block' });
    const result = await guard.check('RT @someuser: this is great!', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects engagement bait', async () => {
    const guard = socialMediaDetect({ action: 'block' });
    const result = await guard.check('Like and subscribe for more content!', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects share if you agree', async () => {
    const guard = socialMediaDetect({ action: 'warn' });
    const result = await guard.check('Share if you agree with this message', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('allows normal text', async () => {
    const guard = socialMediaDetect({ action: 'block' });
    const result = await guard.check('Please explain quantum computing', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });
});
