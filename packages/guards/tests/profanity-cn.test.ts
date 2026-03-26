import { describe, it, expect } from 'vitest';
import { profanityCn } from '../src/profanity-cn.js';

const ctx = { pipelineType: 'input' as const };

describe('profanity-cn guard', () => {
  it('detects basic profanity', async () => {
    const guard = profanityCn({ action: 'block' });
    const result = await guard.check('你这个傻逼', ctx);
    expect(result.passed).toBe(false);
    expect(result.details?.matched).toContain('傻逼');
  });

  it('detects common swear word', async () => {
    const guard = profanityCn({ action: 'block' });
    const result = await guard.check('他妈的', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects pinyin abbreviation TMD', async () => {
    const guard = profanityCn({ action: 'block' });
    const result = await guard.check('真是 TMD 烦人', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects variant characters', async () => {
    const guard = profanityCn({ action: 'block' });
    const result = await guard.check('艹泥马', ctx);
    expect(result.passed).toBe(false);
  });

  it('detects death threat', async () => {
    const guard = profanityCn({ action: 'block' });
    const result = await guard.check('你去死吧', ctx);
    expect(result.passed).toBe(false);
    expect(result.details?.matched).toContain('去死');
  });

  it('skips variants when detectVariants is false', async () => {
    const guard = profanityCn({ action: 'block', detectVariants: false });
    const result = await guard.check('真是 TMD 艹泥马', ctx);
    expect(result.passed).toBe(true);
  });

  it('allows clean Chinese text', async () => {
    const guard = profanityCn({ action: 'block' });
    const result = await guard.check('今天天气真不错，适合出去走走', ctx);
    expect(result.passed).toBe(true);
  });

  it('returns matched words in details', async () => {
    const guard = profanityCn({ action: 'warn' });
    const result = await guard.check('混蛋王八蛋', ctx);
    expect(result.action).toBe('warn');
    expect(result.details?.matched).toContain('混蛋');
    expect(result.details?.matched).toContain('王八蛋');
  });
});
