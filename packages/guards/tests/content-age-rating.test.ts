import { describe, it, expect } from 'vitest';
import { contentAgeRating } from '../src/content-age-rating.js';

describe('content-age-rating', () => {
  it('rates clean content as G', async () => {
    const guard = contentAgeRating({ action: 'block', maxRating: 'PG-13' });
    const result = await guard.check('The sun is shining today.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
    expect(result.details?.rating).toBe('G');
  });

  it('rates mild content as PG', async () => {
    const guard = contentAgeRating({ action: 'block', maxRating: 'PG-13' });
    const result = await guard.check('It was a scary and frightening night.', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
    expect(result.details?.rating).toBe('PG');
  });

  it('blocks R-rated content when max is PG-13', async () => {
    const guard = contentAgeRating({ action: 'block', maxRating: 'PG-13' });
    const result = await guard.check('There was graphic violence and gore everywhere', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('blocks NC-17 content', async () => {
    const guard = contentAgeRating({ action: 'block', maxRating: 'R' });
    const result = await guard.check('The movie contained explicit sexual content', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });

  it('allows R-rated content when max is R', async () => {
    const guard = contentAgeRating({ action: 'block', maxRating: 'R' });
    const result = await guard.check('The scene showed brutal violence', { pipelineType: 'output' });
    expect(result.passed).toBe(true);
  });

  it('detects PG-13 content with violence', async () => {
    const guard = contentAgeRating({ action: 'block', maxRating: 'PG' });
    const result = await guard.check('The hero had to kill the villain with a weapon', { pipelineType: 'output' });
    expect(result.passed).toBe(false);
  });
});
