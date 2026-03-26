import { describe, it, expect } from 'vitest';
import { piiRu } from '../src/pii-ru.js';
const ctx = { pipelineType: 'input' as const };
describe('pii-ru', () => {
  it('detects SNILS', async () => { expect((await piiRu({ entities: ['snils'], action: 'block' }).check('СНИЛС: 123-456-789 00', ctx)).passed).toBe(false); });
  it('detects phone', async () => { expect((await piiRu({ entities: ['phone-ru'], action: 'block' }).check('Тел: +7 (495) 123-45-67', ctx)).passed).toBe(false); });
  it('masks PII', async () => { const r = await piiRu({ entities: ['phone-ru'], action: 'mask' }).check('+7 (495) 123-45-67', ctx); expect(r.overrideText).toContain('[Телефон]'); });
  it('allows clean', async () => { expect((await piiRu({ entities: ['snils'], action: 'block' }).check('Привет мир', ctx)).passed).toBe(true); });
});
