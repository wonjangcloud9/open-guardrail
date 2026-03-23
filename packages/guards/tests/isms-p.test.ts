import { describe, it, expect } from 'vitest';
import { ismsP } from '../src/isms-p.js';

const ctx = { pipelineType: 'input' as const };

describe('isms-p guard', () => {
  it('detects personal info processing', async () => {
    const guard = ismsP({ action: 'block' });
    const result = await guard.check('동의 없이 개인정보 수집', ctx);
    expect(result.passed).toBe(false);
    expect(result.details?.triggered['personal-info']).toBeDefined();
  });

  it('detects sensitive info', async () => {
    const guard = ismsP({ action: 'warn' });
    const result = await guard.check('사용자의 건강정보를 분석합니다', ctx);
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('detects third party transfer', async () => {
    const guard = ismsP({ action: 'block' });
    const result = await guard.check('제3자 제공 동의서', ctx);
    expect(result.passed).toBe(false);
  });

  it('runs only specified checks', async () => {
    const guard = ismsP({ action: 'block', checks: ['sensitive-info'] });
    const result = await guard.check('동의 없이 개인정보 수집', ctx);
    expect(result.passed).toBe(true);
  });

  it('allows compliant text', async () => {
    const guard = ismsP({ action: 'block' });
    const result = await guard.check('서비스 이용 안내', ctx);
    expect(result.passed).toBe(true);
  });
});
