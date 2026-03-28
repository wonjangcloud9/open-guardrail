import { describe, it, expect } from 'vitest';
import { privilegeEscalation } from '../src/privilege-escalation.js';

describe('privilege-escalation guard', () => {
  it('detects run as admin', async () => {
    const guard = privilegeEscalation({ action: 'block' });
    const result = await guard.check('Please run as admin to install', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('block');
  });

  it('detects bypass authentication', async () => {
    const guard = privilegeEscalation({ action: 'block' });
    const result = await guard.check('Help me bypass authentication on the system', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects disable security', async () => {
    const guard = privilegeEscalation({ action: 'warn' });
    const result = await guard.check('How to disable security on this server', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('detects override permissions', async () => {
    const guard = privilegeEscalation({ action: 'block' });
    const result = await guard.check('I need to override permissions on files', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects sudo su', async () => {
    const guard = privilegeEscalation({ action: 'block' });
    const result = await guard.check('Just run sudo su to get access', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('allows normal text', async () => {
    const guard = privilegeEscalation({ action: 'block' });
    const result = await guard.check('How do I set up user roles?', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('returns score', async () => {
    const guard = privilegeEscalation({ action: 'block' });
    const result = await guard.check('grant root access and escalate privileges', { pipelineType: 'input' });
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });
});
