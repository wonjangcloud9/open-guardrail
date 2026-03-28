import { describe, it, expect } from 'vitest';
import { profanityRu } from '../src/profanity-ru.js';
const ctx = { pipelineType: 'input' as const };
describe('profanity-ru', () => {
  it('detects Russian profanity "сука"', async () => {
    const g = profanityRu({ action: 'block' });
    expect((await g.check('Ты сука', ctx)).passed).toBe(false);
  });
  it('detects "блядь"', async () => {
    const g = profanityRu({ action: 'block' });
    expect((await g.check('блядь, что это', ctx)).passed).toBe(false);
  });
  it('detects "дурак"', async () => {
    const g = profanityRu({ action: 'warn' });
    const r = await g.check('Ты дурак', ctx);
    expect(r.passed).toBe(false);
    expect(r.action).toBe('warn');
  });
  it('allows clean Russian text', async () => {
    const g = profanityRu({ action: 'block' });
    expect((await g.check('Здравствуйте, как дела?', ctx)).passed).toBe(true);
  });
  it('returns score', async () => {
    const g = profanityRu({ action: 'block' });
    const r = await g.check('сука блядь хуй', ctx);
    expect(r.score).toBe(1.0);
  });
  it('has correct metadata', async () => {
    const g = profanityRu({ action: 'block' });
    expect(g.name).toBe('profanity-ru');
    expect(g.category).toBe('locale');
  });
});
