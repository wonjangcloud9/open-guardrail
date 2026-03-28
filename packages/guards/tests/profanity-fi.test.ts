import { describe, it, expect } from 'vitest';
import { profanityFi } from '../src/profanity-fi.js';

describe('profanity-fi guard', () => {
  it('detects "perkele"', async () => {
    const guard = profanityFi({ action: 'block' });
    const result = await guard.check('Voi perkele tämä ei toimi', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('detects "vittu"', async () => {
    const guard = profanityFi({ action: 'warn' });
    const result = await guard.check('Mitä vittu tapahtuu', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('detects "saatana"', async () => {
    const guard = profanityFi({ action: 'block' });
    const result = await guard.check('saatana mikä päivä', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('allows clean Finnish text', async () => {
    const guard = profanityFi({ action: 'block' });
    const result = await guard.check('Hyvää päivää, miten voit?', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
    expect(result.action).toBe('allow');
  });

  it('detects "helvetti"', async () => {
    const guard = profanityFi({ action: 'block' });
    const result = await guard.check('Mene helvetti tästä', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('scores higher for multiple profanities', async () => {
    const guard = profanityFi({ action: 'block' });
    const result = await guard.check('perkele vittu saatana paska', { pipelineType: 'input' });
    expect(result.score).toBeGreaterThan(0.5);
  });

  it('is case-insensitive', async () => {
    const guard = profanityFi({ action: 'block' });
    const result = await guard.check('PERKELE!', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });
});
