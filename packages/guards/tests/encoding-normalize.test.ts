import { describe, it, expect } from 'vitest';
import { encodingNormalize } from '../src/encoding-normalize.js';
const ctx = { pipelineType: 'input' as const };
describe('encoding-normalize', () => {
  it('detects fullwidth characters', async () => {
    const g = encodingNormalize({ action: 'block' });
    const r = await g.check('Ｈｅｌｌｏ world', ctx);
    expect(r.passed).toBe(false);
    expect(r.details?.issues).toContain('fullwidth-chars');
  });
  it('detects combining diacriticals', async () => {
    const g = encodingNormalize({ action: 'warn' });
    const r = await g.check('te\u0300\u0301\u0302st', ctx);
    expect(r.passed).toBe(false);
    expect(r.details?.issues).toContain('combining-diacriticals');
  });
  it('detects mixed Cyrillic and Latin', async () => {
    const g = encodingNormalize({ action: 'block' });
    const r = await g.check('p\u0430ssword', ctx);
    expect(r.passed).toBe(false);
    expect(r.details?.issues).toContain('mixed-script');
  });
  it('detects HTML entities', async () => {
    const g = encodingNormalize({ action: 'block' });
    const r = await g.check('Click &#60;script&#62; here', ctx);
    expect(r.passed).toBe(false);
    expect(r.details?.issues).toContain('html-entities');
  });
  it('allows clean ASCII text', async () => {
    const g = encodingNormalize({ action: 'block' });
    expect((await g.check('Hello, this is normal text.', ctx)).passed).toBe(true);
  });
  it('reports multiple issues', async () => {
    const g = encodingNormalize({ action: 'warn' });
    const r = await g.check('Ｈ&#60;ello p\u0430ss', ctx);
    expect(r.details?.issues?.length).toBeGreaterThanOrEqual(2);
  });
});
