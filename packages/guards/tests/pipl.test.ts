import { describe, it, expect } from 'vitest';
import { pipl } from '../src/pipl.js';

const ctx = { pipelineType: 'input' as const };

describe('pipl guard', () => {
  it('detects personal info collection keywords', async () => {
    const guard = pipl({ action: 'block' });
    const result = await guard.check('收集个人信息需要告知', ctx);
    expect(result.passed).toBe(false);
    expect(result.details?.triggered['personal-info']).toBeDefined();
  });

  it('detects sensitive info keywords', async () => {
    const guard = pipl({ action: 'block' });
    const result = await guard.check('敏感个人信息的处理规则', ctx);
    expect(result.passed).toBe(false);
    expect(result.details?.triggered['sensitive-info']).toBeDefined();
  });

  it('detects cross-border transfer keywords', async () => {
    const guard = pipl({ action: 'block' });
    const result = await guard.check('数据跨境传输需要安全评估', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects children info keywords', async () => {
    const guard = pipl({ action: 'warn' });
    const result = await guard.check('未满十四周岁的儿童个人信息需监护人同意', ctx);
    expect(result.passed).toBe(false);
    expect(result.details?.triggered['children-info']).toBeDefined();
  });

  it('filters by specific checks', async () => {
    const guard = pipl({ action: 'block', checks: ['sensitive-info'] });
    const result = await guard.check('收集个人信息需要告知', ctx);
    expect(result.passed).toBe(true);
  });

  it('allows clean text', async () => {
    const guard = pipl({ action: 'block' });
    const result = await guard.check('今天天气预报显示会下雨', ctx);
    expect(result.passed).toBe(true);
  });

  it('detects multiple categories simultaneously', async () => {
    const guard = pipl({ action: 'warn' });
    const result = await guard.check(
      '收集个人信息需同意。敏感个人信息需特别保护。数据出境需安全评估。',
      ctx,
    );
    expect(result.passed).toBe(false);
    const keys = Object.keys(result.details?.triggered ?? {});
    expect(keys.length).toBeGreaterThanOrEqual(2);
  });
});
