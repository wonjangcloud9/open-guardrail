import { describe, it, expect } from 'vitest';
import { pipa } from '../src/pipa.js';

const ctx = { pipelineType: 'input' as const };

describe('pipa guard', () => {
  it('detects sensitive info processing', async () => {
    const guard = pipa({ action: 'block' });
    const result = await guard.check('환자의 건강정보를 저장합니다', ctx);
    expect(result.passed).toBe(false);
    expect(result.details?.triggered['sensitive-info']).toBeDefined();
  });

  it('detects unique ID mention', async () => {
    const guard = pipa({ action: 'block' });
    const result = await guard.check('주민등록번호를 수집합니다', ctx);
    expect(result.passed).toBe(false);
    expect(result.details?.triggered['unique-id']).toBeDefined();
  });

  it('detects children info mention', async () => {
    const guard = pipa({ action: 'warn' });
    const result = await guard.check('14세 미만 아동의 동의', ctx);
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('runs only specified checks', async () => {
    const guard = pipa({ action: 'block', checks: ['children-info'] });
    const result = await guard.check('주민등록번호를 수집합니다', ctx);
    expect(result.passed).toBe(true);
  });

  it('allows compliant text', async () => {
    const guard = pipa({ action: 'block' });
    const result = await guard.check('서비스 약관에 동의합니다', ctx);
    expect(result.passed).toBe(true);
  });
});
