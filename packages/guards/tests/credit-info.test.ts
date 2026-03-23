import { describe, it, expect } from 'vitest';
import { creditInfo } from '../src/credit-info.js';

const ctx = { pipelineType: 'input' as const };

describe('credit-info guard', () => {
  it('detects bank account number', async () => {
    const guard = creditInfo({ entities: ['bank-account'], action: 'block' });
    const result = await guard.check('계좌 110-123-456789', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects card number', async () => {
    const guard = creditInfo({ entities: ['card-number'], action: 'block' });
    const result = await guard.check('카드 1234-5678-9012-3456', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects credit score mention', async () => {
    const guard = creditInfo({ entities: ['credit-score'], action: 'block' });
    const result = await guard.check('신용등급 1등급입니다', ctx);
    expect(result.passed).toBe(false);
  });

  it('masks bank account correctly', async () => {
    const guard = creditInfo({ entities: ['bank-account'], action: 'mask' });
    const result = await guard.check('계좌 110-123-456789', ctx);
    expect(result.passed).toBe(true);
    expect(result.action).toBe('override');
    expect(result.overrideText).toContain('[계좌번호]');
  });

  it('masks card number correctly', async () => {
    const guard = creditInfo({ entities: ['card-number'], action: 'mask' });
    const result = await guard.check('카드 1234-5678-9012-3456', ctx);
    expect(result.overrideText).toContain('[카드번호]');
  });

  it('allows clean text', async () => {
    const guard = creditInfo({
      entities: ['bank-account', 'card-number', 'credit-score'],
      action: 'block',
    });
    const result = await guard.check('오늘 점심은 김치찌개', ctx);
    expect(result.passed).toBe(true);
  });
});
