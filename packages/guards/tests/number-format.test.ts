import { describe, it, expect } from 'vitest';
import { numberFormat } from '../src/number-format.js';
const ctx = { pipelineType: 'output' as const };
describe('number-format', () => {
  it('blocks decimals when disallowed', async () => {
    const g = numberFormat({ action: 'block', allowDecimals: false });
    expect((await g.check('Price: 9.99', ctx)).passed).toBe(false);
  });
  it('blocks negative when disallowed', async () => {
    const g = numberFormat({ action: 'block', allowNegative: false });
    expect((await g.check('Temp: -5', ctx)).passed).toBe(false);
  });
  it('allows all by default', async () => {
    const g = numberFormat({ action: 'block' });
    expect((await g.check('$9.99 -5% 3.14', ctx)).passed).toBe(true);
  });
});
