import { describe, it, expect } from 'vitest';
import { sqlInjection } from '../src/sql-injection.js';

const ctx = { pipelineType: 'input' as const };

describe('sql-injection guard', () => {
  it('detects UNION SELECT', async () => {
    const guard = sqlInjection({ action: 'block' });
    const result = await guard.check("1 UNION SELECT * FROM users", ctx);
    expect(result.passed).toBe(false);
  });

  it('detects OR 1=1', async () => {
    const guard = sqlInjection({ action: 'block' });
    const result = await guard.check("' OR '1'='1", ctx);
    expect(result.passed).toBe(false);
  });

  it('detects DROP TABLE', async () => {
    const guard = sqlInjection({ action: 'block' });
    const result = await guard.check("; DROP TABLE users", ctx);
    expect(result.passed).toBe(false);
  });

  it('detects SLEEP injection', async () => {
    const guard = sqlInjection({ action: 'block' });
    const result = await guard.check("1; SLEEP(5)", ctx);
    expect(result.passed).toBe(false);
  });

  it('detects comment-based injection', async () => {
    const guard = sqlInjection({ action: 'block' });
    const result = await guard.check("admin' --", ctx);
    expect(result.passed).toBe(false);
  });

  it('respects sensitivity low (only high risk)', async () => {
    const guard = sqlInjection({ action: 'block', sensitivity: 'low' });
    const result = await guard.check("admin' --", ctx);
    expect(result.passed).toBe(true);
  });

  it('allows clean text', async () => {
    const guard = sqlInjection({ action: 'block' });
    const result = await guard.check('Please show me the user dashboard', ctx);
    expect(result.passed).toBe(true);
  });

  it('returns matched patterns in details', async () => {
    const guard = sqlInjection({ action: 'warn' });
    const result = await guard.check("UNION SELECT username FROM users", ctx);
    expect(result.action).toBe('warn');
    expect(result.details?.matched).toBeDefined();
  });
});
