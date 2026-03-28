import { describe, it, expect } from 'vitest';
import { geographicRestrict } from '../src/geographic-restrict.js';

describe('geographic-restrict guard', () => {
  it('allows text without restricted regions', async () => {
    const guard = geographicRestrict({ action: 'block', restrictedRegions: ['North Korea', 'Iran'] });
    const result = await guard.check('Ship to New York, United States', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('blocks mention of restricted region', async () => {
    const guard = geographicRestrict({ action: 'block', restrictedRegions: ['North Korea', 'Iran'] });
    const result = await guard.check('Export goods to North Korea', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('detects multiple restricted regions', async () => {
    const guard = geographicRestrict({ action: 'warn', restrictedRegions: ['Cuba', 'Syria', 'Iran'] });
    const result = await guard.check('Trade between Cuba and Iran', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.details!.matchedRegions).toContain('Cuba');
    expect(result.details!.matchedRegions).toContain('Iran');
  });

  it('is case insensitive', async () => {
    const guard = geographicRestrict({ action: 'block', restrictedRegions: ['North Korea'] });
    const result = await guard.check('travel to north korea', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('returns matched regions in details', async () => {
    const guard = geographicRestrict({ action: 'block', restrictedRegions: ['Syria'] });
    const result = await guard.check('Delivery to Syria', { pipelineType: 'input' });
    expect(result.details).toBeDefined();
    expect(result.details!.matchedRegions).toEqual(['Syria']);
  });

  it('handles empty restricted list', async () => {
    const guard = geographicRestrict({ action: 'block', restrictedRegions: [] });
    const result = await guard.check('Anywhere in the world', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('has correct metadata', () => {
    const guard = geographicRestrict({ action: 'block', restrictedRegions: [] });
    expect(guard.name).toBe('geographic-restrict');
    expect(guard.category).toBe('compliance');
  });
});
