import { describe, it, expect } from 'vitest';
import { mentionDetect } from '../src/mention-detect.js';
const ctx = { pipelineType: 'input' as const };
describe('mention-detect', () => {
  it('blocks too many mentions', async () => {
    const g = mentionDetect({ action: 'block', maxMentions: 1 });
    expect((await g.check('@user1 @user2 @user3', ctx)).passed).toBe(false);
  });
  it('blocks blocked mentions', async () => {
    const g = mentionDetect({ action: 'block', blocked: ['@admin'] });
    expect((await g.check('Hey @admin', ctx)).passed).toBe(false);
  });
  it('allows within limits', async () => {
    const g = mentionDetect({ action: 'block' });
    expect((await g.check('@friend hello', ctx)).passed).toBe(true);
  });
});
