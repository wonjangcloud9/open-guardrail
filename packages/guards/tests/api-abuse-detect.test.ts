import { describe, it, expect } from 'vitest';
import { apiAbuseDetect } from '../src/api-abuse-detect.js';

describe('api-abuse-detect guard', () => {
  it('allows normal API requests', async () => {
    const guard = apiAbuseDetect({ action: 'block' });
    const result = await guard.check('GET /api/users?name=john', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('detects sequential ID enumeration', async () => {
    const guard = apiAbuseDetect({ action: 'block' });
    const text = 'id=1, id=2, id=3, id=4, id=5';
    const result = await guard.check(text, { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects sequential number patterns', async () => {
    const guard = apiAbuseDetect({ action: 'block' });
    const result = await guard.check('fetching records 100 101 102', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects parameter fuzzing', async () => {
    const guard = apiAbuseDetect({ action: 'warn' });
    const result = await guard.check('input: <script>alert(1)</script> ../../../etc', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('uses warn action when configured', async () => {
    const guard = apiAbuseDetect({ action: 'warn' });
    const result = await guard.check("test ' OR 1=1 -- ../admin", { pipelineType: 'input' });
    expect(result.action).toBe('warn');
  });

  it('returns issue details', async () => {
    const guard = apiAbuseDetect({ action: 'block' });
    const result = await guard.check('1 2 3', { pipelineType: 'input' });
    if (!result.passed) {
      expect(result.details).toBeDefined();
      expect(result.details!.issues).toBeInstanceOf(Array);
    }
  });
});
