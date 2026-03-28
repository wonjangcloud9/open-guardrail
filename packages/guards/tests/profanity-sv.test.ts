import { describe, it, expect } from 'vitest';
import { profanitySv } from '../src/profanity-sv.js';

describe('profanity-sv guard', () => {
  it('detects "jävla"', async () => {
    const guard = profanitySv({ action: 'block' });
    const result = await guard.check('Det var jävla dåligt', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('detects "helvete"', async () => {
    const guard = profanitySv({ action: 'warn' });
    const result = await guard.check('Vad i helvete!', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('detects "fitta"', async () => {
    const guard = profanitySv({ action: 'block' });
    const result = await guard.check('Han sa fitta högt', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('allows clean Swedish text', async () => {
    const guard = profanitySv({ action: 'block' });
    const result = await guard.check('Hej, hur mår du idag?', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
    expect(result.action).toBe('allow');
  });

  it('detects multiple profanities with higher score', async () => {
    const guard = profanitySv({ action: 'block' });
    const result = await guard.check('jävla skit fan helvete', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.score).toBeGreaterThan(0.5);
  });

  it('is case-insensitive', async () => {
    const guard = profanitySv({ action: 'block' });
    const result = await guard.check('JÄVLA dålig dag', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });
});
