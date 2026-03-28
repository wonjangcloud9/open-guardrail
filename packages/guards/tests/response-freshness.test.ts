import { describe, it, expect } from 'vitest';
import { responseFreshness } from '../src/response-freshness.js';

describe('response-freshness guard', () => {
  it('detects "as of 2019" as outdated', async () => {
    const guard = responseFreshness({ action: 'warn', currentYear: 2026 });
    const result = await guard.check('As of 2019, React was at version 16', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('detects deprecated technology references', async () => {
    const guard = responseFreshness({ action: 'warn', currentYear: 2026 });
    const result = await guard.check('deprecated since 2020, use the new API', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects end-of-life mention', async () => {
    const guard = responseFreshness({ action: 'block', currentYear: 2026 });
    const result = await guard.check('Python 2.7 reached end-of-life', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects training cutoff disclaimer', async () => {
    const guard = responseFreshness({ action: 'warn', currentYear: 2026 });
    const result = await guard.check('as of my knowledge cutoff in 2023', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('detects old Node.js version', async () => {
    const guard = responseFreshness({ action: 'warn', currentYear: 2026 });
    const result = await guard.check('Install Node.js 8 from the website', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows fresh content', async () => {
    const guard = responseFreshness({ action: 'warn', currentYear: 2026 });
    const result = await guard.check('React 19 introduced new features for concurrent rendering', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });
});
