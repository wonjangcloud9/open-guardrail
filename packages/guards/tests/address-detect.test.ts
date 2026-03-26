import { describe, it, expect } from 'vitest';
import { addressDetect } from '../src/address-detect.js';
const ctx = { pipelineType: 'input' as const };
describe('address-detect', () => {
  it('detects US street address', async () => {
    const g = addressDetect({ action: 'block' });
    expect((await g.check('I live at 123 Main Street', ctx)).passed).toBe(false);
  });
  it('detects Korean address', async () => {
    const g = addressDetect({ action: 'block' });
    expect((await g.check('서울특별시 강남구 역삼동 테헤란로', ctx)).passed).toBe(false);
  });
  it('masks addresses', async () => {
    const g = addressDetect({ action: 'mask' });
    const r = await g.check('Send to 456 Oak Ave', ctx);
    expect(r.overrideText).toContain('[ADDRESS]');
  });
  it('allows clean text', async () => {
    const g = addressDetect({ action: 'block' });
    expect((await g.check('Hello world', ctx)).passed).toBe(true);
  });
});
