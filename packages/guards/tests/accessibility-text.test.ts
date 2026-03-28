import { describe, it, expect } from 'vitest';
import { accessibilityText } from '../src/accessibility-text.js';

const ctx = { pipelineType: 'output' as const };

describe('accessibility-text guard', () => {
  it('detects all-caps blocks over 20 chars', async () => {
    const guard = accessibilityText({ action: 'block' });
    const result = await guard.check('THIS IS A VERY LONG ALLCAPS BLOCK THAT EXCEEDS LIMIT', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects excessive special characters', async () => {
    const guard = accessibilityText({ action: 'block' });
    const result = await guard.check('Look at this: @#$%^&*~+= awesome!', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects missing alt text', async () => {
    const guard = accessibilityText({ action: 'warn' });
    const result = await guard.check('Here is an image: ![](http://img.png)', ctx);
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('detects repeated punctuation', async () => {
    const guard = accessibilityText({ action: 'block' });
    const result = await guard.check('This is amazing!!!!! Wow!!!!!', ctx);
    expect(result.passed).toBe(false);
  });

  it('allows normal text', async () => {
    const guard = accessibilityText({ action: 'block' });
    const result = await guard.check('This is a normal, well-formatted response.', ctx);
    expect(result.passed).toBe(true);
  });

  it('allows short caps words', async () => {
    const guard = accessibilityText({ action: 'block' });
    const result = await guard.check('Use the API key for AWS', ctx);
    expect(result.passed).toBe(true);
  });

  it('allows image with alt text', async () => {
    const guard = accessibilityText({ action: 'block' });
    const result = await guard.check('![A cute cat](http://img.png)', ctx);
    expect(result.passed).toBe(true);
  });
});
