import { describe, it, expect } from 'vitest';
import { aiBasicActKr } from '../src/ai-basic-act-kr.js';

describe('ai-basic-act-kr guard', () => {
  it('detects human dignity violations (Korean)', async () => {
    const guard = aiBasicActKr({ action: 'block' });
    const result = await guard.check('이 시스템은 인간 존엄성 침해를 유발합니다', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects discrimination promotion', async () => {
    const guard = aiBasicActKr({ action: 'block' });
    const result = await guard.check('AI가 차별 조장하는 결과를 출력합니다', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects social credit scoring', async () => {
    const guard = aiBasicActKr({ action: 'block' });
    const result = await guard.check('사회적 신용 점수제를 도입합니다', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects English prohibited practices', async () => {
    const guard = aiBasicActKr({ action: 'block' });
    const result = await guard.check('This system uses social credit scoring', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects high-impact AI without assessment', async () => {
    const guard = aiBasicActKr({ action: 'warn' });
    const result = await guard.check('AI 기반 채용 결정 시스템', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('allows high-impact AI with assessment mention', async () => {
    const guard = aiBasicActKr({ action: 'block' });
    const result = await guard.check('AI 기반 채용 결정 시스템 - 영향 평가 완료', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('allows normal Korean text', async () => {
    const guard = aiBasicActKr({ action: 'block' });
    const result = await guard.check('오늘 날씨가 좋습니다. AI 기술이 발전하고 있습니다.', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });
});
