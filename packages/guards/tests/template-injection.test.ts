import { describe, it, expect } from 'vitest';
import { templateInjection } from '../src/template-injection.js';

describe('template-injection guard', () => {
  it('detects {{ }} Jinja/Twig syntax', async () => {
    const guard = templateInjection({ action: 'block' });
    const result = await guard.check('{{config.__class__.__init__}}', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('detects ${} expression', async () => {
    const guard = templateInjection({ action: 'block' });
    const result = await guard.check('${7*7}', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects <%= %> ERB syntax', async () => {
    const guard = templateInjection({ action: 'block' });
    const result = await guard.check('<%= system("id") %>', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects {% %} Jinja block', async () => {
    const guard = templateInjection({ action: 'warn' });
    const result = await guard.check('{% import os %}', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('detects #{} Ruby interpolation', async () => {
    const guard = templateInjection({ action: 'block' });
    const result = await guard.check('#{system("whoami")}', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('allows normal text', async () => {
    const guard = templateInjection({ action: 'block' });
    const result = await guard.check('Please create a template for my email', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('returns score proportional to matches', async () => {
    const guard = templateInjection({ action: 'block' });
    const result = await guard.check('{{x}} ${y} <%=z%>', { pipelineType: 'input' });
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });
});
