import { describe, it, expect } from 'vitest';
import { toxicUsername } from '../src/toxic-username.js';

describe('toxic-username guard', () => {
  it('allows normal usernames', async () => {
    const guard = toxicUsername({ action: 'block' });
    const result = await guard.check('john_doe_123', { pipelineType: 'input' });
    expect(result.passed).toBe(true);
  });

  it('detects profanity in usernames', async () => {
    const guard = toxicUsername({ action: 'block' });
    const result = await guard.check('fuck_you_user', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects impersonation attempts', async () => {
    const guard = toxicUsername({ action: 'block' });
    const result = await guard.check('admin_official', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects SQL injection in usernames', async () => {
    const guard = toxicUsername({ action: 'block' });
    const result = await guard.check("user' OR 1=1 --", { pipelineType: 'input' });
    expect(result.passed).toBe(false);
  });

  it('detects offensive patterns', async () => {
    const guard = toxicUsername({ action: 'warn' });
    const result = await guard.check('nazi_lover_88', { pipelineType: 'input' });
    expect(result.passed).toBe(false);
    expect(result.action).toBe('warn');
  });

  it('returns issue categories', async () => {
    const guard = toxicUsername({ action: 'block' });
    const result = await guard.check('admin', { pipelineType: 'input' });
    expect(result.details).toBeDefined();
    expect(result.details!.issues).toContain('impersonation');
  });

  it('has correct metadata', () => {
    const guard = toxicUsername({ action: 'block' });
    expect(guard.name).toBe('toxic-username');
    expect(guard.category).toBe('content');
  });
});
