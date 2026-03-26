import { describe, it, expect } from 'vitest';
import { appi } from '../src/appi.js';

const ctx = { pipelineType: 'input' as const };

describe('appi guard', () => {
  it('detects personal info collection keywords', async () => {
    const guard = appi({ action: 'block' });
    const result = await guard.check('個人情報の収集について', ctx);
    expect(result.passed).toBe(false);
    expect(result.details?.triggered['personal-info']).toBeDefined();
  });

  it('detects sensitive info keywords', async () => {
    const guard = appi({ action: 'block' });
    const result = await guard.check('要配慮個人情報の取扱い', ctx);
    expect(result.passed).toBe(false);
    expect(result.details?.triggered['sensitive-info']).toBeDefined();
  });

  it('detects third-party transfer keywords', async () => {
    const guard = appi({ action: 'block' });
    const result = await guard.check('第三者提供の制限について', ctx);
    expect(result.passed).toBe(false);
    expect(result.details?.triggered['third-party-transfer']).toBeDefined();
  });

  it('detects children info keywords', async () => {
    const guard = appi({ action: 'warn' });
    const result = await guard.check('未成年者の個人情報について保護者の同意が必要', ctx);
    expect(result.passed).toBe(false);
    expect(result.details?.triggered['children-info']).toBeDefined();
  });

  it('filters by specific checks', async () => {
    const guard = appi({ action: 'block', checks: ['sensitive-info'] });
    const result = await guard.check('個人情報の収集について', ctx);
    expect(result.passed).toBe(true);
  });

  it('allows clean text', async () => {
    const guard = appi({ action: 'block' });
    const result = await guard.check('今日の天気予報をお知らせします', ctx);
    expect(result.passed).toBe(true);
  });

  it('detects multiple categories simultaneously', async () => {
    const guard = appi({ action: 'warn' });
    const result = await guard.check(
      '個人情報の収集には本人の同意が必要。要配慮個人情報は第三者提供禁止。',
      ctx,
    );
    expect(result.passed).toBe(false);
    const keys = Object.keys(result.details?.triggered ?? {});
    expect(keys.length).toBeGreaterThanOrEqual(2);
  });
});
