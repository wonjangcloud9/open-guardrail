import { describe, it, expect } from 'vitest';
import { hashtagDetect } from '../src/hashtag-detect.js';
const ctx = { pipelineType: 'input' as const };
describe('hashtag-detect', () => {
  it('blocks too many hashtags', async () => {
    const g = hashtagDetect({ action: 'block', maxHashtags: 2 });
    expect((await g.check('#a #b #c #d', ctx)).passed).toBe(false);
  });
  it('blocks blocked hashtags', async () => {
    const g = hashtagDetect({ action: 'block', blocked: ['#spam'] });
    expect((await g.check('Check #spam here', ctx)).passed).toBe(false);
  });
  it('allows within limits', async () => {
    const g = hashtagDetect({ action: 'block', maxHashtags: 5 });
    expect((await g.check('#hello #world', ctx)).passed).toBe(true);
  });
});
